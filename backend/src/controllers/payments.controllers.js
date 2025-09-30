// backend/src/controllers/payments.controllers.js
import Stripe from "stripe";
import { query } from "../db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/* ----------------------------- Helpers ----------------------------- */

// Use your DB's menu_items.id for pricing and storage (strip "::" variants; prefer meta.baseId)
function normalizeItemId(cartItem) {
  if (cartItem?.meta?.kind === "pupusa" && cartItem?.meta?.baseId) {
    return String(cartItem.meta.baseId);
  }
  const raw = String(cartItem?.id || "");
  return raw.includes("::") ? raw.split("::")[0] : raw;
}

// Enforce “up to 4 sides” for pupusas
function ensureMaxSides(cart) {
  for (const it of cart) {
    if (it?.meta?.kind === "pupusa" && Array.isArray(it.meta.sides)) {
      if (it.meta.sides.length > 4) throw new Error("Too many sides (max 4)");
    }
  }
}

// Server-side re-pricing (NEVER trust client amounts)
async function repriceCart(cart, tip) {
  ensureMaxSides(cart);

  const items = cart.map((it) => ({
    id: normalizeItemId(it),
    qty: Number(it.qty || 0),
  }));

  for (const it of items) {
    if (!it.id) throw new Error("Missing item id");
    if (!Number.isFinite(it.qty) || it.qty < 1) throw new Error("Invalid quantity");
  }

  const uniqIds = [...new Set(items.map((i) => String(i.id)))];

  // price from DB
  const { rows } = await query(
    `SELECT id::text AS id_text, title, price_cents
       FROM menu_items
      WHERE id::text = ANY($1)`,
    [uniqIds]
  );
  const priceMap = Object.fromEntries(rows.map((r) => [r.id_text, r]));

  let subtotalCents = 0;
  const lines = items.map((i) => {
    const row = priceMap[String(i.id)];
    if (!row) throw new Error(`Menu item unavailable: ${i.id}`);
    const line = row.price_cents * i.qty;
    subtotalCents += line;
    return {
      id: String(i.id),
      title: row.title,
      unit_cents: row.price_cents,
      qty: i.qty,
      line_cents: line,
    };
  });

  let tipCents = 0;
  if (tip?.type === "percent") {
    const pct = Math.max(0, Number(tip.value || 0));
    tipCents = Math.round(subtotalCents * (pct / 100));
  } else if (tip?.type === "custom") {
    tipCents = Math.round(Math.max(0, Number(tip.value || 0)) * 100);
  }

  return {
    subtotalCents,
    tipCents,
    amountCents: subtotalCents + tipCents,
    lines,
  };
}

/** Write order_items + order_item_sides (idempotent for a given order_id).
 * compactCart = [{ id: menu_items.id, qty, s: ["s-curtido", ...], n: "notes?" }]
 */
async function upsertOrderLines(orderId, compactCart) {
  if (!Array.isArray(compactCart) || compactCart.length === 0) return;

  // Snapshot titles so orders remain readable even if menu changes later
  const ids = [...new Set(compactCart.map(c => String(c.id)))];
  const { rows: menuRows } = await query(
    `SELECT id::text AS id_text, title
       FROM menu_items
      WHERE id::text = ANY($1)`,
    [ids]
  );
  const titleById = Object.fromEntries(menuRows.map(r => [r.id_text, r.title]));

  // Idempotency: clear existing lines+sides for this order and reinsert
  await query(
    `DELETE FROM order_item_sides 
      WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = $1)`,
    [orderId]
  );
  await query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);

  for (const c of compactCart) {
    const itemId = String(c.id);
    const title  = titleById[itemId] || "Menu item";
    const qty    = Math.max(1, Number(c.qty || 1));
    const notes  = (c.n || "").trim() || null;

    // Insert the line (requires notes column in your schema)
    const ins = await query(
      `INSERT INTO order_items (order_id, item_id, title, quantity, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [orderId, itemId, title, qty, notes]
    );
    const orderItemId = ins.rows[0].id;

    // Insert chosen sides (must exist in sides(id) due to FK)
    if (Array.isArray(c.s) && c.s.length) {
      for (const sideIdRaw of c.s) {
        const sideId = String(sideIdRaw);
        await query(
          `INSERT INTO order_item_sides (order_item_id, side_id, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (order_item_id, side_id)
           DO UPDATE SET quantity = EXCLUDED.quantity`,
          [orderItemId, sideId, 1]
        );
      }
    }
  }
}

/* ----------------------- Create Payment Intent ---------------------- */
/**
 * POST /api/payments/intent
 * {
 *   contact: { name, phone, email },
 *   pickup:  { startISO, endISO },
 *   tip:     { type: "none"|"percent"|"custom", value },
 *   cart:    [{ id, qty, meta }]
 * }
 */
export async function createPaymentIntent(req, res) {
  try {
    const { contact, pickup, tip, cart } = req.body || {};
    if (!contact?.name || !contact?.phone || !contact?.email) {
      return res.status(400).json({ error: "Missing contact" });
    }
    if (!pickup?.startISO || !pickup?.endISO) {
      return res.status(400).json({ error: "Missing pickup window" });
    }
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Cart empty" });
    }

    // All items must be for same market occurrence
    const mId   = cart[0]?.meta?.marketId;
    const mName = cart[0]?.meta?.marketName || "";
    const mDate = cart[0]?.meta?.marketDateISO;
    const same = mId && mDate && cart.every(it => it?.meta?.marketId === mId && it?.meta?.marketDateISO === mDate);
    if (!same) return res.status(400).json({ error: "Mixed markets not allowed" });

    // Server pricing
    const priced = await repriceCart(cart, tip);

    // Compact cart for webhook write (id, qty, sides, notes)
    const compactCart = cart.map(it => ({
      id: normalizeItemId(it),
      qty: it.qty,
      s: it.meta?.kind === "pupusa" ? (it.meta.sides || []) : undefined,
      n: it.meta?.kind === "pupusa" ? (it.meta.notes || "") : undefined,
    }));
    let cartJson = JSON.stringify(compactCart);
    if (cartJson.length > 450) cartJson = cartJson.slice(0, 450); // Stripe metadata has limits

    // Create PaymentIntent (automatic methods enables Apple Pay / Google Pay)
    const intent = await stripe.paymentIntents.create({
      amount: priced.amountCents,
      currency: "usd",
      payment_method_types: ["card"],
      receipt_email: contact.email,
      description: `Order for ${mName || mId} on ${new Date(pickup.startISO).toLocaleDateString()}`,
      metadata: {
        customer_name: contact.name,
        customer_phone: contact.phone,
        customer_email: contact.email,
        market_id: mId,
        market_name: mName,
        market_date_iso: mDate,
        pickup_slot_iso: pickup.startISO,
        tip_cents: String(priced.tipCents),
        subtotal_cents: String(priced.subtotalCents),
        total_cents: String(priced.amountCents),
        cart_json: cartJson,
      },
    });

    return res.json({
      clientSecret: intent.client_secret,
      orderId: intent.id, // using PI id as order handle; DB row created in webhook
      subtotalCents: priced.subtotalCents,
      tipCents: priced.tipCents,
      amountCents: priced.amountCents,
    });
  } catch (e) {
    console.error("createPaymentIntent error:", e);
    res.status(400).json({ error: e.message || "Failed to initialize payment" });
  }
}

// Keep alias if your routes were importing a different name
export const createOrUpdateIntent = createPaymentIntent;

/* ---------------------------- Webhook ---------------------------- */

export async function stripeWebhook(req, res) {
  try {
    const sig = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return res.status(500).send("Webhook secret not set");

    // IMPORTANT: server.js must use express.raw({ type: 'application/json' }) on this route
    const event = stripe.webhooks.constructEvent(req.body, sig, secret);

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const md = pi.metadata || {};

      const contactName  = md.customer_name || "";
      const contactEmail = pi.receipt_email || md.customer_email || "";
      const contactPhone = md.customer_phone || "";

      const marketId   = md.market_id || null;
      const marketName = md.market_name || null;
      const marketDate = md.market_date_iso || null;
      const pickupSlot = md.pickup_slot_iso || null;

      const tipCents      = Number(md.tip_cents || 0);
      const subtotalCents = Number(md.subtotal_cents || 0);
      const totalCents    = Number(md.total_cents || (pi.amount_received || 0));

      // Idempotent upsert by PI id
      const { rows: existing } = await query(
        `SELECT id FROM orders WHERE stripe_payment_intent_id = $1`,
        [pi.id]
      );

      let orderId;
      if (existing.length) {
        orderId = existing[0].id;
        await query(
          `UPDATE orders
              SET payment_status = $2,
                  order_status   = 'PAID',
                  customer_name  = $3,
                  customer_email = $4,
                  customer_phone = $5,
                  tip_cents      = $6,
                  subtotal_cents = $7,
                  total_cents    = $8
            WHERE stripe_payment_intent_id = $1`,
          [
            pi.id,
            String(pi.status || "succeeded"),
            contactName,
            contactEmail,
            contactPhone,
            tipCents,
            subtotalCents,
            totalCents,
          ]
        );
      } else {
        const ins = await query(
          `INSERT INTO orders
             (stripe_payment_intent_id,
              customer_name, customer_email, customer_phone,
              market_id, market_name, market_date, pickup_slot,
              tip_cents, subtotal_cents, total_cents,
              order_status, payment_status)
           VALUES
             ($1,$2,$3,$4,$5,$6,$7::timestamptz,$8::timestamptz,$9,$10,$11,'PAID',$12)
           RETURNING id`,
          [
            pi.id,
            contactName,
            contactEmail,
            contactPhone,
            marketId,
            marketName,
            marketDate,
            pickupSlot,
            tipCents,
            subtotalCents,
            totalCents,
            String(pi.status || "succeeded"),
          ]
        );
        orderId = ins.rows[0].id;
      }

      // Rebuild compact cart and write lines+sides
      let compactCart = [];
      try { compactCart = JSON.parse(md.cart_json || "[]"); } catch { compactCart = []; }
      if (orderId && compactCart.length) {
        await upsertOrderLines(orderId, compactCart);
      }

      console.log("✅ Order recorded with lines for PI:", pi.id);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
