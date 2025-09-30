// src/controllers/orders.controller.js
import { query } from "../db.js";

/** GET /api/orders/by-intent/:pi
 * Returns 404 until the webhook has created/updated the order row.
 * Response:
 * {
 *   order: { id, customer_name, customer_email, customer_phone,
 *            market_id, market_name, market_date, pickup_slot,
 *            subtotal_cents, tip_cents, total_cents, order_status, created_at },
 *   items: [
 *     { id, item_id, title, quantity, notes, sides: [{ side_id, title, quantity }] }
 *   ]
 * }
 */
export async function getOrderByIntent(req, res) {
  try {
    const { pi } = req.params;
    if (!pi) return res.status(400).json({ error: "Missing payment intent id" });

    // Only show once webhook recorded it
    const { rows: ordRows } = await query(
      `SELECT id, customer_name, customer_email, customer_phone,
              market_id, market_name, market_date, pickup_slot,
              subtotal_cents, tip_cents, total_cents,
              order_status, payment_status, created_at
         FROM orders
        WHERE stripe_payment_intent_id = $1`,
      [pi]
    );

    if (!ordRows.length) {
      return res.status(404).json({ error: "Order not found yet (processing)" });
    }

    const order = ordRows[0];

    // (Optional) enforce only when actually paid
    // if (order.order_status !== "PAID") {
    //   return res.status(409).json({ error: "Order not paid yet" });
    // }

    // Fetch lines + sides
    const { rows: items } = await query(
      `SELECT
         oi.id,
         oi.item_id,
         oi.title,
         oi.quantity,
         oi.notes,
         COALESCE(
           json_agg(
             json_build_object(
               'side_id', ois.side_id,
               'title', s.title,
               'quantity', ois.quantity
             )
             ORDER BY s.title
           ) FILTER (WHERE ois.side_id IS NOT NULL),
           '[]'
         ) AS sides
       FROM order_items oi
       LEFT JOIN order_item_sides ois ON ois.order_item_id = oi.id
       LEFT JOIN sides s ON s.id = ois.side_id
      WHERE oi.order_id = $1
      GROUP BY oi.id
      ORDER BY oi.title`,
      [order.id]
    );

    res.json({ order, items });
  } catch (e) {
    console.error("getOrderByIntent error:", e);
    res.status(500).json({ error: "Failed to load order" });
  }
}
