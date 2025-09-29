import { Router } from "express";
import { query } from "../db.js"; 
import menuRoutes from "./menu.routes.js";
import marketsRoutes from "./markets.routes.js";
import paymentsRouter from "./payments.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));

router.use("/menu", menuRoutes);        // → /api/menu
router.use("/markets", marketsRoutes);  // → /api/markets/...
router.use("/payments", paymentsRouter);  // /api/payments/intent

export default router;
