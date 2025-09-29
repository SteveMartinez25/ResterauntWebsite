// backend/src/controllers/payments.controllers.js
import Stripe from "stripe";
import { query } from "../db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/** Normalize a cart line to the DB primary key (base menu id). */
function normalizeBaseId(cartItem) {
  // Prefer meta.baseId for pupusas (e.g. "p-bean-cheese")
  if (cartItem?.meta?.kind === "pupusa" && cartItem?.meta?.baseId) {
    return String(cartItem.meta.baseId);
  }
  // Otherwise, strip variant suffix from the client cart id (e.g. "p-bean-cheese::s-curtido+...")
  const raw = String(cartItem?.id || "");
  return raw.includes("::") ? raw.split("::")[0] : raw;
}

/** Enforce business rules */
function ensureMaxSides(cart) {
  for (const it of cart) {
    if (it?.meta?.kind === "pupusa" && Array.isArray(it.meta.sides)) {
      if (it.meta.sides.length > 4) {
        throw new Error("Too many sides (max 4)");
      }
    }
  }
}

/** Server-side re-pricing from DB using menu_items.id */
async function repriceCart(cart, tip) {
  ensureMaxSides(cart);

  const items = cart.map((it) => ({
    id: normalizeBaseId(it),            // <- will equal your menu_items.id (as text)
    qty: Number(it.qty || 0),
  }));

  // Validate quantities
  for (const it of items) {
    if (!it.id) throw new Error("Missing item id");
    if (!Number.isFinite(it.qty) || it.qty < 1) throw new Error("Invalid quantity");
  }

  // Query prices by id; cast to text so this works for uuid/int/text PKs
  const uniqIds = [...new Set(items.map((i) => i.id))];
  const { rows } = await query(
    `SELECT id::text AS id_text, title, price_cents
       FROM menu_items
      WHERE id::text = ANY($1)`,
    [uniqIds]
  );

  const priceMap = Object.fromEntries(rows.map((r) => [r.id_text, r]));

  let subtotalCents = 0;
  const lines = items.map((i) => {
    const row = priceMap[i.id];
    if (!row) throw new Error(`Menu item unavailable: ${i.id}`);
    const line = row.price_cents * i.qty;
    subtotalCents += line;
    return {
      id: i.id,
      title: row.title,
      unit_cents: row.price_cents,
      qty: i.qty,
      line_cents: line,
    };
  });

  // Tip
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

/**
 * POST /api/payments/intent
 * Body:
 * {
 *   contact: { name, phone, email },
 *   pickup:  { startISO, endISO },
 *   tip:     { type: "none"|"percent"|"custom", value: number },
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

    // All items must be for the same occurrence
    const mId = cart[0]?.meta?.marketId;
    const mDate = cart[0]?.meta?.marketDateISO;
    if (!mId || !mDate) return res.status(400).json({ error: "Missing market info on items" });
    const same = cart.every(
      (it) => it?.meta?.marketId === mId && it?.meta?.marketDateISO === mDate
    );
    if (!same) return res.status(400).json({ error: "Mixed markets not allowed" });

    // Server pricing
    const priced = await repriceCart(cart, tip);

    // Create PaymentIntent
    const intent = await stripe.paymentIntents.create({
      amount: priced.amountCents,
      currency: "usd",
      payment_method_types: ["card"],
      receipt_email: contact.email,
      metadata: {
        market_id: mId,
        market_date_iso: mDate,
        pickup_start_iso: pickup.startISO,
        pickup_end_iso: pickup.endISO,
        contact_name: contact.name,
        contact_phone: contact.phone,
        cart_ids: priced.lines.map((l) => `${l.id}x${l.qty}`).join(","), // pricing by id
      },
    });

    return res.json({
      clientSecret: intent.client_secret,
      orderId: intent.id, // temporary order ref
      subtotalCents: priced.subtotalCents,
      tipCents: priced.tipCents,
      amountCents: priced.amountCents,
    });
  } catch (e) {
    console.error("createPaymentIntent error:", e);
    res.status(400).json({ error: e.message || "Failed to initialize payment" });
  }
}

// Keep alias if your router still imports this name:
export const createOrUpdateIntent = createPaymentIntent;

/** Optional webhook (leave as-is if already set up) */
export async function stripeWebhook(req, res) {
  try {
    const sig = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return res.status(500).send("Webhook secret not set");

    const event = stripe.webhooks.constructEvent(req.body, sig, secret);

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      console.log("✅ payment_intent.succeeded", pi.id);
      // TODO: mark order paid in DB here
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
