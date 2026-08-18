import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { referenceRouter } from "./routes/reference.routes";
import { diagnosisRouter } from "./routes/diagnosis.routes";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "8mb" })); // headroom for base64 photo uploads in the diagnosis route

app.get("/health", (_req, res) => res.json({ ok: true, service: "krishi-swasthya-sahayak-backend" }));

app.use("/auth", authRouter);
app.use("/reference", referenceRouter);
app.use("/diagnosis", diagnosisRouter);

app.use((_req, res) => res.status(404).json({ error: "NOT_FOUND" }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

app.listen(PORT, () => {
  console.log(`Krishi Swasthya Sahayak backend listening on port ${PORT}`);
  console.log(`SMS provider: ${process.env.SMS_PROVIDER || "mock"} (see .env.example)`);
  console.log(`Photo diagnosis (Claude vision): ${process.env.ANTHROPIC_API_KEY ? "enabled" : "disabled — set ANTHROPIC_API_KEY to enable"}`);
});
