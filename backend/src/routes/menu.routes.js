import { Router } from "express";
import { getMenu } from "../controllers/menu.controller.js";

const router = Router();

// final path will be /api/menu
router.get("/", getMenu);

export default router;
