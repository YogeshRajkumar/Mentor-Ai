import "dotenv/config";

import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandlers.js";

const app = express();

// ✅ TRUST PROXY
app.set("trust proxy", 1);

// ✅ SECURITY
app.use(helmet());

// ✅ 🔥 FIXED CORS (IMPORTANT)
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ 🔥 HANDLE PREFLIGHT (VERY IMPORTANT)
app.options("*", cors());

// 🔒 GLOBAL RATE LIMIT
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, // Very high for dev
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});

// Bypass rate limit in development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => next());
} else {
  app.use(limiter);
}

// ✅ BODY PARSER
app.use(express.json({ limit: "1mb" }));

// ✅ LOGGER
app.use(morgan("dev"));

// 🔥 DEBUG (ADD THIS TEMPORARILY)
app.use((req, res, next) => {
  console.log("➡️ Incoming:", req.method, req.url);
  next();
});

// ✅ HEALTH
app.get("/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.get("/test", (req, res) => {
  res.send("API running");
});

// ✅ ROUTES
app.use("/auth", authLimiter, authRoutes);
app.use("/user", authMiddleware, userRoutes);
app.use("/tasks", authMiddleware, taskRoutes);
app.use("/schedule", authMiddleware, scheduleRoutes);
app.use("/ai", authMiddleware, aiRoutes);

// ✅ ERRORS
app.use(notFoundHandler);
app.use(errorHandler);

// ✅ START SERVER
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`Server running on PORT ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });