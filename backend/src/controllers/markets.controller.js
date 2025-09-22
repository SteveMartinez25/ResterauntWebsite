import { query } from "../db.js";

// helper to set time on a given date
function setTime(date, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function getNextMarket(req, res) {
  try {
    const { rows: markets } = await query(
      `SELECT id, name, day_of_week, start_hhmm, end_hhmm, is_active
         FROM markets
        WHERE is_active = true`
    );

    const now = new Date();
    const candidates = markets
      .map((m) => {
        const d = new Date(now);
        const delta = (m.day_of_week - d.getDay() + 7) % 7; // days to next occurrence
        d.setDate(d.getDate() + delta);
        let start = setTime(d, m.start_hhmm);
        let end = setTime(d, m.end_hhmm);
        // if it's the same day but already ended, push to next week
        if (delta === 0 && end <= now) {
          d.setDate(d.getDate() + 7);
          start = setTime(d, m.start_hhmm);
          end = setTime(d, m.end_hhmm);
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

export function nextOccurrenceFromTemplate(m, now = new Date()) {
  // m: { day_of_week, start_hhmm, end_hhmm, id, name }
  const d = new Date(now);
  const delta = (m.day_of_week - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + delta);
  let start = setTime(d, m.start_hhmm);
  let end   = setTime(d, m.end_hhmm);
  if (delta === 0 && end <= now) {         // today already passed -> next week
    d.setDate(d.getDate() + 7);
    start = setTime(d, m.start_hhmm);
    end   = setTime(d, m.end_hhmm);
  }
  return { start, end };
}