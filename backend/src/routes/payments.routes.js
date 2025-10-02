// src/routes/payments.routes.js
import express from "express";
import { Router } from "express";
import { createOrUpdatePaymentIntent, stripeWebhook } from "../controllers/payments.controllers.js";

const router = Router();

/* Create PaymentIntent (used by your Checkout page "Continue to payment") */
router.post("/intent", createOrUpdatePaymentIntent);

/* Stripe webhook (must be BEFORE express.json() for this route, uses raw body) */
const webhookRouter = Router();
webhookRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  (req, _res, next) => { req.rawBody = req.body; next(); },
  stripeWebhook
);

export { webhookRouter };
export default router;
