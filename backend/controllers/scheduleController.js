import mongoose from "mongoose";
import Task from "../models/Task.js";
import Schedule from "../models/Schedule.js";
import { logger } from "../utils/logger.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─────────────────────────────────────────────────────────────────
// POST /schedule/generate-weekly
// Body: { userId }
// Generates a fresh 7-day schedule from the Task collection.
// Task collection = single source of truth.
// ─────────────────────────────────────────────────────────────────
export async function generateWeeklySchedule(req, res) {
  try {
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    // ── 1. Fetch ONLY non-completed tasks (source of truth = Task collection)
    const tasks = await Task.find({
      user_id: userId,
      status: { $ne: "completed" },
    }).lean();

    if (tasks.length === 0) {
      // Still clear stale schedule so the UI shows empty state
      await Schedule.deleteMany({ user_id: userId });
      return res.json({
        success: false,
        message: "No tasks available to schedule. Add tasks first.",
      });
    }

    // ── 2. Sort: priority_order ASC (1=high), then deadline ASC
    const sorted = [...tasks].sort((a, b) => {
      const pa = a.priority_order ?? 99;
      const pb = b.priority_order ?? 99;
      if (pa !== pb) return pa - pb;

      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return da - db;
    });

    // ── 3. Build fresh 7-day structure
    const schedule = DAYS.map((day) => ({
      user_id: userId,
      day,
      tasks: [],
    }));

    // ── 4. Distribute tasks round-robin across Mon–Fri (indices 0–4)
    let dayIndex = 0;
    for (const task of sorted) {
      schedule[dayIndex].tasks.push(buildTaskEntry(task));
      dayIndex = (dayIndex + 1) % 5;
    }

    // ── 5. Incomplete tasks → also appear on Sat (5) + Sun (6)
    //    Deduplicate: only push if not already present on that day
    for (const task of sorted) {
      if (task.status === "completed") continue; // defensive guard

      const taskIdStr = task._id.toString();

      // Saturday
      if (!schedule[5].tasks.some((t) => t.task_id.toString() === taskIdStr)) {
        schedule[5].tasks.push(buildTaskEntry(task));
      }

      // Sunday
      if (!schedule[6].tasks.some((t) => t.task_id.toString() === taskIdStr)) {
        schedule[6].tasks.push(buildTaskEntry(task));
      }
    }

    // ── 6. Atomic replace: clear old → insert fresh
    await Schedule.deleteMany({ user_id: userId });
    const savedDocs = await Schedule.insertMany(schedule);

    logger.info("Weekly schedule generated", { userId, taskCount: tasks.length });

    return res.json({
      success: true,
      message: `Schedule generated with ${tasks.length} task(s)`,
      data: savedDocs,
    });
  } catch (err) {
    logger.error("generateWeeklySchedule error", { error: err.message });
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /schedule/:userId
// Returns ordered 7-day array. Always 7 entries (empty days included).
// ─────────────────────────────────────────────────────────────────
export async function getWeeklySchedule(req, res) {
  try {
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    const docs = await Schedule.find({ user_id: userId }).lean();

    // Always return all 7 days in Mon → Sun order
    const ordered = DAYS.map((day) => {
      const found = docs.find((d) => d.day === day);
      if (found) return found;
      return { _id: null, day, tasks: [] };
    });

    return res.json({ success: true, data: ordered });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// PATCH /schedule/status/:scheduleId
// Body: { taskId, status }
//
// HARDENED: Syncs status across ALL three layers:
//   1. The clicked Schedule doc's embedded task
//   2. EVERY other Schedule doc that contains this task_id
//   3. The Task collection (single source of truth)
// ─────────────────────────────────────────────────────────────────
export async function updateTaskStatus(req, res) {
  try {
    const { scheduleId } = req.params;
    const { taskId, status } = req.body || {};

    const VALID = ["idle", "pending", "completed"];

    if (!status || !VALID.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    // SAFE CASTING: Ensure all IDs are proper ObjectIds for the query
    let objectScheduleId, objectTaskId, objectUserId;
    try {
      objectScheduleId = new mongoose.Types.ObjectId(scheduleId);
      objectTaskId     = new mongoose.Types.ObjectId(taskId);
      objectUserId     = new mongoose.Types.ObjectId(req.user.id);
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    console.log(`🛠️ Updating Schedule ${objectScheduleId} for Task ${objectTaskId} to ${status}`);

    // ── LAYER 1: Update the clicked Schedule doc's embedded task
    const updated = await Schedule.findOneAndUpdate(
      { 
        _id: objectScheduleId, 
        user_id: objectUserId, 
        "tasks.task_id": objectTaskId 
      },
      { $set: { "tasks.$.status": status } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Schedule entry or task not found",
      });
    }

    // ── LAYER 2: Propagate status to ALL Schedule docs containing this task
    await Schedule.updateMany(
      { user_id: objectUserId, "tasks.task_id": objectTaskId },
      { $set: { "tasks.$.status": status } }
    );

    // ── LAYER 3: Mirror to Task collection
    await Task.findOneAndUpdate(
      { _id: objectTaskId, user_id: objectUserId }, 
      { status, completedAt: status === "completed" ? new Date() : null }
    );

    logger.info("Task status updated", { taskId, status });

    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE /schedule/entry/:scheduleId/task/:taskId
//
// HARDENED: Removes task from EVERYWHERE:
//   1. ALL Schedule docs for this user ($pull)
//   2. Task collection (permanent delete)
// ─────────────────────────────────────────────────────────────────
export async function deleteScheduleTask(req, res) {
  try {
    const { scheduleId, taskId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(scheduleId) ||
      !mongoose.Types.ObjectId.isValid(taskId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid scheduleId or taskId",
      });
    }

    // Get user_id from this schedule doc so we can clean ALL days
    const scheduleDoc = await Schedule.findOne({ _id: scheduleId, user_id: req.user.id }).lean();
    if (!scheduleDoc) {
      return res.status(404).json({ success: false, message: "Schedule not found or unauthorized" });
    }

    // ── 1. Remove task from ALL schedule days for this user
    await Schedule.updateMany(
      { user_id: scheduleDoc.user_id },
      { $pull: { tasks: { task_id: new mongoose.Types.ObjectId(taskId) } } }
    );

    // ── 2. Permanently delete from Task collection
    await Task.findOneAndDelete({ _id: taskId, user_id: req.user.id });

    logger.info("Task permanently deleted from schedule + tasks", { taskId });

    return res.json({ success: true, message: "Task permanently deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// DELETE /schedule/:id
// Removes an entire schedule day document
// ─────────────────────────────────────────────────────────────────
export async function deleteScheduleEntry(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const deleted = await Schedule.findOneAndDelete({ _id: id, user_id: req.user.id });
    if (!deleted) return res.status(404).json({ success: false, message: "Not found or unauthorized" });
    return res.json({ success: true, message: "Schedule entry deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────
// Helper — build clean embedded task snapshot from Task document
// ─────────────────────────────────────────────────────────────────
function buildTaskEntry(task) {
  return {
    task_id:  task._id,
    title:    task.title,
    category: task.category,
    priority: task.priority,
    duration: task.duration,
    status:   task.status,
  };
}
