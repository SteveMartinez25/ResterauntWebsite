import pg from "pg";
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires TLS
});

export const query = (text, params) => pool.query(text, params);

// If you like a default export object:
const db = { query, pool };
export default db;
