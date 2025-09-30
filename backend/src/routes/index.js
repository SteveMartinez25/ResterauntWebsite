import { Router } from "express";
import { query } from "../db.js"; 
import menuRoutes from "./menu.routes.js";
import marketsRoutes from "./markets.routes.js";
import paymentsRouter from "./payments.routes.js";
import ordersRoutes from "./orders.routes.js";

const router = Router();

router.get("/health", (req, res) => res.json({ ok: true }));

router.use("/menu", menuRoutes);        // → /api/menu
router.use("/markets", marketsRoutes);  // → /api/markets/...
router.use("/payments", paymentsRouter);  // /api/payments/intent
router.use("/orders", ordersRoutes);    // /api/orders

export default router;
