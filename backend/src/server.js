// Load env first in ESM:
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import api from "./routes/index.js"; // your main router (JSON-parsed)
import { webhookRouter as paymentsWebhook } from "./routes/payments.routes.js"; // raw-body router ONLY

const app = express();
const PORT = process.env.PORT || 5174;

// CORS / security / logging
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(helmet());
app.use(morgan("dev"));

// 1) Stripe webhook MUST be mounted BEFORE express.json(), using raw body.
app.use("/api/payments", paymentsWebhook);

// 2) Now enable JSON for the rest of the API.
app.use(express.json());

// 3) Mount all your normal API routes (including /payments/intent).
app.use("/api", api);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
