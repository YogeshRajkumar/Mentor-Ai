import express from "express";
import rateLimit from "express-rate-limit";
import { aiChat, feedback, dailyPlan } from "../controllers/aiController.js";

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: { success: false, message: "Too many AI requests, please try again later" },
});

router.use(aiLimiter);

// 🧠 AI Chat
router.post("/chat", aiChat);

// 💬 Feedback
router.post("/feedback", feedback);

// 📅 Daily Plan
router.post("/daily-plan", dailyPlan);

export default router;