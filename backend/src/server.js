// Load env first in ESM:
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import api from "./routes/index.js"; // our router

const app = express();
const PORT = process.env.PORT || 5174;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// mount all API routes at /api
app.use("/api", api);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
