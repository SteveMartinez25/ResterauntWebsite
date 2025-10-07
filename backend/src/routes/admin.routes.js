import { Router } from "express";
import { query } from "../db.js";
import { adminLogin, adminLogout, adminMe, requireAdmin } from "../middleware/adminAuth.js";

const router = Router();

function hhmmToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return (h * 60) + (m || 0);
}

/* --- Auth --- */
// These are now base-relative. After mounting at /api/admin, the paths are:
// POST /api/admin/login
// POST /api/admin/logout
// GET  /api/admin/session
router.post("/login", adminLogin);
router.post("/logout", adminLogout);
router.get("/session", adminMe);

/* ---- Revenue stats with range + market filter ----
   GET /api/admin/stats/revenue?range=1d|7d|30d|90d|180d|365d (or days=NN)
   Optional: &marketId=<id>
   Returns: { rangeDays, marketId, grand, daily:[...], byMarket:[...] }
*/
router.get("/stats/revenue", requireAdmin, async (req, res) => {
  try {
    const { range, days, marketId } = req.query || {};

    // Resolve days
    const map = { "1d": 1, "7d": 7, "30d": 30, "90d": 90, "180d": 180, "365d": 365, "1y": 365 };
    const rangeDays = Number(days || map[(range || "").toLowerCase()] || 30);

    const since = new Date();
    since.setDate(since.getDate() - rangeDays);

    const params = [since.toISOString()];
    let filter = `created_at >= $1 AND order_status = 'PAID'`;
    if (marketId) {
      params.push(marketId);
      filter += ` AND market_id = $2`;
    }

    // Grand totals
    const grandQ = await query(
      `SELECT
         COUNT(*)::int                      AS orders,
         COALESCE(SUM(subtotal_cents), 0)   AS subtotal_cents,
         COALESCE(SUM(tip_cents), 0)        AS tip_cents,
         COALESCE(SUM(total_cents), 0)      AS total_cents
       FROM orders
       WHERE ${filter}`,
      params
    );

    // Daily buckets
    const dailyQ = await query(
      `SELECT date_trunc('day', created_at)::date AS day,
              COUNT(*)::int                      AS orders,
              COALESCE(SUM(total_cents), 0)      AS total_cents,
              COALESCE(SUM(subtotal_cents), 0)   AS subtotal_cents,
              COALESCE(SUM(tip_cents), 0)        AS tip_cents
         FROM orders
        WHERE ${filter}
        GROUP BY 1
        ORDER BY 1`,
      params
    );

    // By market (ignore marketId when computing this so the pills still show context)
    const byMarketQ = await query(
      `SELECT market_id,
              COALESCE(NULLIF(market_name, ''), market_id) AS market_name,
              COUNT(*)::int                                 AS orders,
              COALESCE(SUM(total_cents), 0)                 AS total_cents
         FROM orders
        WHERE created_at >= $1 AND order_status = 'PAID'
        GROUP BY 1,2
        ORDER BY total_cents DESC`,
      [since.toISOString()]
    );

    res.json({
      rangeDays,
      marketId: marketId || null,
      grand: grandQ.rows[0],
      daily: dailyQ.rows,
      byMarket: byMarketQ.rows
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load revenue stats" });
  }
});

/* --- Orders by occurrence (JSON) ---
// GET /api/admin/orders/by-occurrence?marketId=...&startISO=...
*/
router.get("/orders/by-occurrence", requireAdmin, async (req, res) => {
  try {
    const { marketId, startISO } = req.query || {};
    if (!marketId || !startISO) return res.status(400).json({ error: "marketId & startISO required" });

    // Get market template (name + times)
    const { rows: mrows } = await query(
      `SELECT name,
              to_char(start_time, 'HH24:MI') AS start_hhmm,
              to_char(end_time,   'HH24:MI') AS end_hhmm
         FROM public.markets
        WHERE id = $1`,
      [marketId]
    );
    if (!mrows.length) return res.status(404).json({ error: "Market not found" });

    const market = mrows[0];
    const durMin = hhmmToMinutes(market.end_hhmm) - hhmmToMinutes(market.start_hhmm);
    const dur = durMin > 0 ? durMin : 0;

    const s = new Date(startISO);
    if (Number.isNaN(+s)) return res.status(400).json({ error: "Invalid startISO" });
    const e = new Date(s.getTime() + dur * 60000);

    const sISO = s.toISOString();
    const eISO = e.toISOString();

    // Pull PAID orders in that window
    const { rows: orders } = await query(
      `SELECT o.*
         FROM orders o
        WHERE o.market_id = $1
          AND o.pickup_slot >= $2::timestamptz
          AND o.pickup_slot <  $3::timestamptz
          AND o.order_status = 'PAID'
        ORDER BY o.pickup_slot ASC, o.created_at ASC`,
      [marketId, sISO, eISO]
    );

    // Attach items (+sides)
    const full = [];
    for (const o of orders) {
      const { rows: items } = await query(
        `SELECT oi.id, oi.item_id, oi.title, oi.quantity, oi.notes,
                COALESCE((
                  SELECT json_agg(json_build_object('side_id', s.side_id, 'quantity', s.quantity, 'title', sd.title))
                  FROM order_item_sides s
                  LEFT JOIN sides sd ON sd.id = s.side_id
                 WHERE s.order_item_id = oi.id
                ), '[]'::json) AS sides
           FROM order_items oi
          WHERE oi.order_id = $1
          ORDER BY oi.title`,
        [o.id]
      );
      full.push({ order: o, items });
    }

    const totals = orders.reduce((acc, o) => {
      acc.orders += 1;
      acc.subtotal_cents += o.subtotal_cents || 0;
      acc.tip_cents += o.tip_cents || 0;
      acc.total_cents += o.total_cents || 0;
      return acc;
    }, { orders: 0, subtotal_cents: 0, tip_cents: 0, total_cents: 0 });

    res.json({
      occurrence: { marketId, name: market.name, startISO: sISO, endISO: eISO },
      totals,
      orders: full,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

/* --- CSV export for the same occurrence ---
   GET /api/admin/orders/by-occurrence.csv?marketId=...&startISO=...
*/
router.get("/orders/by-occurrence.csv", requireAdmin, async (req, res) => {
  try {
    const { marketId, startISO } = req.query || {};
    if (!marketId || !startISO) return res.status(400).json({ error: "marketId & startISO required" });

    const { rows: mrows } = await query(
      `SELECT name,
              to_char(start_time, 'HH24:MI') AS start_hhmm,
              to_char(end_time,   'HH24:MI') AS end_hhmm
         FROM public.markets
        WHERE id = $1`,
      [marketId]
    );
    if (!mrows.length) return res.status(404).json({ error: "Market not found" });

    const market = mrows[0];
    const durMin = hhmmToMinutes(market.end_hhmm) - hhmmToMinutes(market.start_hhmm);
    const dur = durMin > 0 ? durMin : 0;

    const s = new Date(startISO);
    if (Number.isNaN(+s)) return res.status(400).json({ error: "Invalid startISO" });
    const e = new Date(s.getTime() + dur * 60000);

    const sISO = s.toISOString();
    const eISO = e.toISOString();

    const { rows: orders } = await query(
      `SELECT o.*
         FROM orders o
        WHERE o.market_id = $1
          AND o.pickup_slot >= $2::timestamptz
          AND o.pickup_slot <  $3::timestamptz
          AND o.order_status = 'PAID'
        ORDER BY o.pickup_slot ASC, o.created_at ASC`,
      [marketId, sISO, eISO]
    );

    // Flatten to line-per-item
    const lines = [];
    for (const o of orders) {
      const { rows: items } = await query(
        `SELECT oi.id, oi.item_id, oi.title, oi.quantity, oi.notes
           FROM order_items oi
          WHERE oi.order_id = $1
          ORDER BY oi.title`,
        [o.id]
      );
      for (const it of items) {
        const { rows: sideRows } = await query(
          `SELECT s.side_id, sd.title, s.quantity
             FROM order_item_sides s
             LEFT JOIN sides sd ON sd.id = s.side_id
            WHERE s.order_item_id = $1
            ORDER BY sd.title`,
          [it.id]
        );
        lines.push({
          pickup: o.pickup_slot,
          customer: o.customer_name || "",
          phone: o.customer_phone || "",
          email: o.customer_email || "",
          item: it.title,
          qty: it.quantity,
          sides: sideRows.map(s => s.title).join(", "),
          notes: it.notes || "",
          subtotal: (o.subtotal_cents || 0) / 100,
          tip: (o.tip_cents || 0) / 100,
          total: (o.total_cents || 0) / 100,
          payment_intent: o.stripe_payment_intent_id || "",
        });
      }
    }

    const header = ["pickup_time","customer","phone","email","item","qty","sides","notes","subtotal","tip","total","payment_intent"];
    const esc = (v) => {
      const s = String(v ?? "");
      return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      header.join(","),
      ...lines.map(r => [
        esc(new Date(r.pickup).toLocaleString()),
        esc(r.customer),
        esc(r.phone),
        esc(r.email),
        esc(r.item),
        r.qty,
        esc(r.sides),
        esc(r.notes),
        r.subtotal.toFixed(2),
        r.tip.toFixed(2),
        r.total.toFixed(2),
        esc(r.payment_intent),
      ].join(","))
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="orders_${marketId}_${sISO.slice(0,10)}.csv"`);
    res.send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to export CSV" });
  }
});


/* ---------- Sales stats: last N days (default 30) ---------- */
// GET /api/admin/stats/revenue?days=30
router.get("/stats/revenue", requireAdmin, async (req, res) => {
  try {
    const days = Math.max(1, Math.min(180, parseInt(req.query.days || "30", 10)));

    // Daily totals (based on pickup_slot so the day matches kitchen ops)
    const { rows: daily } = await query(
      `SELECT date_trunc('day', pickup_slot) AS day,
              COUNT(*)::int                      AS orders,
              COALESCE(SUM(subtotal_cents), 0)   AS subtotal_cents,
              COALESCE(SUM(tip_cents), 0)        AS tip_cents,
              COALESCE(SUM(total_cents), 0)      AS total_cents
         FROM orders
        WHERE order_status = 'PAID'
          AND pickup_slot >= (now() - ($1 || ' days')::interval)
        GROUP BY 1
        ORDER BY 1`,
      [days]
    );

    // By market totals in the same window
    const { rows: byMarket } = await query(
      `SELECT market_id, COALESCE(market_name, market_id) AS market_name,
              COUNT(*)::int                    AS orders,
              COALESCE(SUM(total_cents), 0)   AS total_cents
         FROM orders
        WHERE order_status = 'PAID'
          AND pickup_slot >= (now() - ($1 || ' days')::interval)
        GROUP BY 1, 2
        ORDER BY total_cents DESC`,
      [days]
    );

    const grand = daily.reduce((a, d) => {
      a.orders += d.orders;
      a.subtotal_cents += Number(d.subtotal_cents);
      a.tip_cents += Number(d.tip_cents);
      a.total_cents += Number(d.total_cents);
      return a;
    }, { orders: 0, subtotal_cents: 0, tip_cents: 0, total_cents: 0 });

    res.json({ days, daily, byMarket, grand });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load revenue stats" });
  }
});


export default router;
