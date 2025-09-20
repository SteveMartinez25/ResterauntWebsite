import { Router } from "express";
import { getNextMarket } from "../controllers/markets.controller.js";

const router = Router();

// final path will be /api/markets/next
router.get("/next", getNextMarket);

export default router;
