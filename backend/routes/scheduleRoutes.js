import express from "express";
import {
  generateWeeklySchedule,
  getWeeklySchedule,
  updateTaskStatus,
  deleteScheduleTask,
  deleteScheduleEntry,
} from "../controllers/scheduleController.js";

const router = express.Router();

// POST   /schedule/generate-weekly              → generate full 7-day schedule
router.post("/generate-weekly", generateWeeklySchedule);

// GET    /schedule/:userId                      → get weekly schedule (7 days)
router.get("/:userId", getWeeklySchedule);

// PATCH  /schedule/status/:scheduleId           → update task status (syncs Task collection too)
router.patch("/status/:scheduleId", updateTaskStatus);

// DELETE /schedule/entry/:scheduleId/task/:taskId → remove task from schedule + Task collection
router.delete("/entry/:scheduleId/task/:taskId", deleteScheduleTask);

// DELETE /schedule/:id                          → remove entire day document
router.delete("/:id", deleteScheduleEntry);

export default router;
