import { query } from "../db.js";

/** build a Date from a local Y-M-D (uses server's local tz), safer than new Date('YYYY-MM-DD') */
function dateFromYMD(ymd) {
  const [y, m, d] = String(ymd).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Set base date to HH:MM (tolerates HH:MM:SS) */
function setTime(date, hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}/.test(String(hhmm))) {
    throw new Error(`Missing/invalid time (expected "HH:MM"): got ${JSON.stringify(hhmm)}`);
  }
  const [h, m] = String(hhmm).slice(0, 5).split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Return the nearest OPEN occurrence (future or currently in progress, before cutoff) */
export async function getNextOpenMarket(_req, res) {
  try {
    // Pull all open flags and join to market weekly hours; alias times to HH:MM strings
    const { rows } = await query(`
      SELECT
        m.id  AS "marketId",
        m.name,
        to_char(m.start_time, 'HH24:MI') AS "start_hhmm",
        to_char(m.end_time,   'HH24:MI') AS "end_hhmm",
        f.local_date::text    AS "localDate",
        f.cutoff_minutes      AS "cutoffMinutes",
        f.is_open             AS "isOpen"
      FROM public.market_open_flags f
      JOIN public.markets m ON m.id = f.market_id
      WHERE f.is_open = true
      ORDER BY f.local_date ASC
    `);

    const now = new Date();
    const candidates = [];

    for (const r of rows) {
      const day = dateFromYMD(r.localDate);                     // local Y-M-D as a Date (00:00 local)
      const start = setTime(day, r.start_hhmm);                 // start datetime
      const end   = setTime(day, r.end_hhmm);                   // end datetime
      const cutoff = new Date(end.getTime() - (r.cutoffMinutes ?? 60) * 60000);

      // still valid if we're before cutoff and before absolute end
      if (now < cutoff && now < end) {
        candidates.push({
          marketId: r.marketId,
          name: r.name,
          startISO: start.toISOString(),
          endISO: end.toISOString(),
          cutoffISO: cutoff.toISOString(),
          cutoffMinutes: r.cutoffMinutes ?? 60,
          orderOpen: true,
          sortKey: start.getTime()
        });
      }
    }

    if (!candidates.length) {
      return res.status(404).json({ error: "No open market" });
    }

    // choose the earliest start among valid candidates
    candidates.sort((a, b) => a.sortKey - b.sortKey);
    const n = candidates[0];
    delete n.sortKey;
    return res.json(n);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to load next open market" });
  }
}
