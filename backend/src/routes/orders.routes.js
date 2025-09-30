// src/routes/orders.routes.js
import { Router } from "express";
import { getOrderByIntent } from "../controllers/orders.controllers.js";

const router = Router();
router.get("/by-intent/:pi", getOrderByIntent);

export default router;
