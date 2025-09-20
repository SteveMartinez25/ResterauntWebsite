import { Router } from "express";
import { query } from "../db.js"; 
import menuRoutes from "./menu.routes.js";
import marketsRoutes from "./markets.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));

router.use("/menu", menuRoutes);        // → /api/menu
router.use("/markets", marketsRoutes);  // → /api/markets/...

export default router;
