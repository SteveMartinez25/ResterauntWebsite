import { query } from "../db.js";

/** Return the nearest OPEN occurrence (flagged), future-only */
export async function getNextOpenMarket(_req, res) {
  try {
    const { rows } = await query(
      `SELECT m.id  AS "marketId",
              m.name,
              f.occurrence_start_at AS "startISO",
              f.occurrence_end_at   AS "endISO",
              f.is_open AS "orderOpen"
         FROM market_open_flags f
         JOIN markets m ON m.id = f.market_id
        WHERE f.is_open = true
          AND f.occurrence_end_at > now()
        ORDER BY f.occurrence_start_at
        LIMIT 1`
    );
    if (!rows.length) return res.status(404).json({ error: "No open market" });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load next open market" });
  }
}
