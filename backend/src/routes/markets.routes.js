import { Router } from "express";
import { query } from "../db.js";
import { getNextOpenMarket } from "../controllers/marketsOpen.controller.js"; // we’ll add below
import { nextOccurrenceFromTemplate } from '../controllers/markets.controller.js';

const router = Router();

// Simple header check
const requireAdmin = (req, res, next) => {
  if (req.headers["x-admin-key"] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

/* -------- PUBLIC: next open market (used by /order page) -------- */
router.get("/next-open", getNextOpenMarket);

/* -------- ADMIN: open/close the NEXT occurrence (no date input) -------- */
router.post("/admin/open-next", requireAdmin, async (req, res) => {
  try {
    const { marketId, open = true } = req.body || {};
    if (!marketId) return res.status(400).json({ error: "marketId required" });

    // load template row
    const { rows } = await query(
      `SELECT id, name, day_of_week, start_hhmm, end_hhmm
         FROM markets WHERE id = $1 AND is_active = true`,
      [marketId]
    );
    if (!rows.length) return res.status(404).json({ error: "Market not found or inactive" });

    // compute next start/end from weekly template
    const m = rows[0];
    const { start, end } = nextOccurrenceFromTemplate(m);

    // upsert flag for that occurrence
    const upsert = await query(
      `INSERT INTO market_open_flags (market_id, occurrence_start_at, occurrence_end_at, is_open)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (market_id, occurrence_start_at)
       DO UPDATE SET is_open = EXCLUDED.is_open
       RETURNING id, market_id, occurrence_start_at, occurrence_end_at, is_open`,
      [m.id, start.toISOString(), end.toISOString(), !!open]
    );

    res.json({ market: { id: m.id, name: m.name }, ...upsert.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to toggle next occurrence" });
  }
});

/* -------- ADMIN: quick status (shows next occurrence + is_open) -------- */
router.get("/admin/status", requireAdmin, async (_req, res) => {
  try {
    const { rows: markets } = await query(
      `SELECT id, name, day_of_week, start_hhmm, end_hhmm
         FROM markets WHERE is_active = true ORDER BY day_of_week`
    );
    const now = new Date();

    // compute next occurrence per market and see if a flag exists
    const results = [];
    for (const m of markets) {
      const { start, end } = nextOccurrenceFromTemplate(m, now);
      const { rows: flags } = await query(
        `SELECT is_open FROM market_open_flags
          WHERE market_id = $1 AND occurrence_start_at = $2::timestamptz`,
        [m.id, start.toISOString()]
      );
      results.push({
        marketId: m.id,
        name: m.name,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        isOpen: flags[0]?.is_open === true
      });
    }
    res.json(results);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load status" });
  }
});

export default router;
