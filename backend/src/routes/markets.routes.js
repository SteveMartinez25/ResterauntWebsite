import { Router } from "express";
import { query } from "../db.js";
import { getNextOpenMarket } from "../controllers/marketsOpen.controller.js";
import { nextOccurrenceFromTemplate } from "../controllers/markets.controller.js";

const router = Router();
const TZ = "America/Los_Angeles";

// Simple header check
const requireAdmin = (req, res, next) => {
  if (req.headers["x-admin-key"] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

// helper: LA local date "YYYY-MM-DD" from a Date/ISO
function localDateYYYYMMDD(dLike, tz = TZ) {
  const d = dLike instanceof Date ? dLike : new Date(dLike);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/* -------- PUBLIC: next open market (used by /order page) -------- */
router.get("/next-open", getNextOpenMarket);

/* -------- ADMIN: open/close the NEXT occurrence (no date input) -------- */
router.post("/admin/open-next", requireAdmin, async (req, res) => {
  try {
    const { marketId, open = true, cutoffMinutes = 60 } = req.body || {};
    if (!marketId) return res.status(400).json({ error: "marketId required" });

    // load template row, alias times to HH:MM strings
    const { rows } = await query(
      `SELECT
         id,
         name,
         day_of_week,
         to_char(start_time, 'HH24:MI') AS start_hhmm,
         to_char(end_time,   'HH24:MI') AS end_hhmm
       FROM public.markets
       WHERE id = $1 AND active = true`,
      [marketId]
    );
    if (!rows.length) return res.status(404).json({ error: "Market not found or inactive" });

    // compute next start/end from weekly template
    const m = rows[0];
    const { start, end } = nextOccurrenceFromTemplate(m);
    const localDate = localDateYYYYMMDD(start, TZ);

    // upsert flag for that local date
    const upsert = await query(
      `INSERT INTO public.market_open_flags (market_id, local_date, is_open, cutoff_minutes)
       VALUES ($1, $2::date, $3, $4)
       ON CONFLICT (market_id, local_date)
       DO UPDATE SET is_open = EXCLUDED.is_open, cutoff_minutes = EXCLUDED.cutoff_minutes
       RETURNING id, market_id, local_date, is_open, cutoff_minutes`,
      [m.id, localDate, !!open, cutoffMinutes]
    );

    res.json({
      market: { id: m.id, name: m.name },
      occurrence: { startISO: start.toISOString(), endISO: end.toISOString(), localDate },
      flag: upsert.rows[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to toggle next occurrence" });
  }
});

/* -------- ADMIN: quick status (shows next occurrence + is_open) -------- */
router.get("/admin/status", requireAdmin, async (_req, res) => {
  try {
    // alias times to HH:MM strings so the helper works
    const { rows: markets } = await query(
      `SELECT
         id,
         name,
         day_of_week,
         to_char(start_time, 'HH24:MI') AS start_hhmm,
         to_char(end_time,   'HH24:MI') AS end_hhmm
       FROM public.markets
       WHERE active = true
       ORDER BY day_of_week`
    );

    const now = new Date();
    const results = [];

    for (const m of markets) {
      const { start, end } = nextOccurrenceFromTemplate(m, now);
      const localDate = localDateYYYYMMDD(start, TZ);

      const { rows: flags } = await query(
        `SELECT is_open, cutoff_minutes
           FROM public.market_open_flags
          WHERE market_id = $1 AND local_date = $2::date`,
        [m.id, localDate]
      );

      results.push({
        marketId: m.id,
        name: m.name,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        localDate,
        isOpen: flags[0]?.is_open === true,
        cutoffMinutes: flags[0]?.cutoff_minutes ?? 60,
      });
    }

    res.json({ now: now.toISOString(), markets: results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load status" });
  }
});

export default router;
