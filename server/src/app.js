import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/documents", documentRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
