import { query } from "../db.js";

/** Set base date to HH:MM (tolerates HH:MM:SS), with guardrails */
function setTime(date, hhmm) {
  if (!hhmm || !/^\d{2}:\d{2}/.test(String(hhmm))) {
    throw new Error(`Missing/invalid time (expected "HH:MM"): got ${JSON.stringify(hhmm)}`);
  }
  const [h, m] = String(hhmm).slice(0, 5).split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function getNextMarket(req, res) {
  try {
    // Alias start_time/end_time -> start_hhmm/end_hhmm, active -> is_active
    const { rows: markets } = await query(`
      SELECT
        id,
        name,
        day_of_week,
        to_char(start_time, 'HH24:MI') AS start_hhmm,
        to_char(end_time,   'HH24:MI') AS end_hhmm,
        active AS is_active
      FROM public.markets
      WHERE active = true
      ORDER BY day_of_week
    `);

    const now = new Date();
    const candidates = markets
      .map((m) => {
        const d = new Date(now);
        const delta = (m.day_of_week - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + delta);

        let start = setTime(d, m.start_hhmm);
        let end   = setTime(d, m.end_hhmm);

        if (delta === 0 && end <= now) {
          d.setDate(d.getDate() + 7);
          start = setTime(d, m.start_hhmm);
          end   = setTime(d, m.end_hhmm);
        }
        return { ...m, date: d, start, end };
      })
      .filter((c) => c.end > now)
      .sort((a, b) => a.start - b.start);

    const n = candidates[0];
    if (!n) return res.status(404).json({ error: "No upcoming market" });

    res.json({
      id: n.id,
      name: n.name,
      dateISO: n.date.toISOString(),
      startISO: n.start.toISOString(),
      endISO: n.end.toISOString(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to compute next market" });
  }
}

// Expects m to have { day_of_week, start_hhmm, end_hhmm }
export function nextOccurrenceFromTemplate(m, now = new Date()) {
  const d = new Date(now);
  const delta = (m.day_of_week - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + delta);

  let start = setTime(d, m.start_hhmm);
  let end   = setTime(d, m.end_hhmm);

  if (delta === 0 && end <= now) {
    d.setDate(d.getDate() + 7);
    start = setTime(d, m.start_hhmm);
    end   = setTime(d, m.end_hhmm);
  }
  return { start, end };
}
