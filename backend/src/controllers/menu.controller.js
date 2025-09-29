import { query } from "../db.js";

export async function getMenu(req, res) {
  try {
    const { rows: items } = await query(
      `SELECT id, title, type, price_cents AS "priceCents",
              image_url AS "imageUrl", description AS "desc"
         FROM menu_items
        WHERE active = true
        ORDER BY type, title`
    );
    const { rows: sides } = await query(
      `SELECT id, title, image_url AS "imageUrl"
         FROM sides
        ORDER BY title`
    );
    res.json({ items, sides });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load menu" });
  }
}
