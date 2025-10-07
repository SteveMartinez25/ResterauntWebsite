// Load env first in ESM:
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import api from "./routes/index.js"; // your main router (JSON-parsed)
import { webhookRouter as paymentsWebhook } from "./routes/payments.routes.js"; // raw-body router ONLY

const app = express();
const PORT = process.env.PORT || 5174;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true, // 🔑 allow cookies from frontend
}));
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser(process.env.COOKIE_SECRET));

// 1) Stripe webhook MUST be mounted BEFORE express.json(), using raw body.
app.use("/api/payments", paymentsWebhook);

// 2) Now enable JSON for the rest of the API.
app.use(express.json());

// 3) Mount all your normal API routes (including /payments/intent).
app.use("/api", api);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
