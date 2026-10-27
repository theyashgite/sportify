import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import teamRoutes from "./routes/teams.js";
import playerRoutes from "./routes/players.js";
import eventRoutes from "./routes/events.js";
import uploadRoutes from "./routes/uploads.js";
import clubRoutes from "./routes/clubs.js";
import { requireAuth } from "./middleware/auth.js";
import { requireRole } from "./middleware/requireRole.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads");
const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(helmet());
app.use(cors({ origin: clientOrigins }));
app.use("/uploads", express.static(uploadsDirectory, {
  dotfiles: "deny",
  index: false,
  maxAge: "1d",
  setHeaders(res) {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  }
}));
app.use(express.json({ limit: "20kb" }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/clubs", requireAuth, requireRole("admin", "coach"), clubRoutes);
app.use("/api/uploads", requireAuth, requireRole("admin", "coach"), uploadRoutes);
app.use("/api/dashboard", requireAuth, requireRole("coach"), dashboardRoutes);
app.use("/api/teams", requireAuth, requireRole("coach"), teamRoutes);
app.use("/api/players", requireAuth, requireRole("coach"), playerRoutes);
app.use("/api/events", requireAuth, requireRole("coach"), eventRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
