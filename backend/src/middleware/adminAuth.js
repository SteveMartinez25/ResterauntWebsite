// backend/src/middleware/adminAuth.js
import bcrypt from "bcryptjs";

/**
 * POST /api/admin/login
 * Body: { username, password }
 * Sets a signed cookie "admin" when ok.
 */
export async function adminLogin(req, res) {
  try {
    const { username, password } = req.body || {};
    const U = process.env.ADMIN_USERNAME || "";
    const HASH = process.env.ADMIN_PASSWORD_HASH || ""; // bcrypt hash only

    if (!U || !HASH) {
      return res.status(500).json({ error: "Admin credentials not configured" });
    }
    if (!username || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    // Constant-time-ish check flow
    const usernameOk = username === U;
    const passwordOk = await bcrypt.compare(password, HASH);
    if (!(usernameOk && passwordOk)) {
      // generic error to avoid user enumeration
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("admin", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,          // must be HTTPS in prod
      signed: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
    res.json({ ok: true });
  } catch (e) {
    console.error("adminLogin error:", e);
    res.status(500).json({ error: "Login failed" });
  }
}

export function adminLogout(_req, res) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("admin", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    signed: true,
    path: "/",
  });
  res.json({ ok: true });
}

export function requireAdmin(req, res, next) {
  if (req.signedCookies?.admin === "1") return next();
  return res.status(401).json({ error: "Unauthorized" });
}

export function adminMe(req, res) {
  if (req.signedCookies?.admin === "1") return res.json({ ok: true });
  return res.status(401).json({ error: "Unauthorized" });
}
