import mongoose from "mongoose";
import Task from "../models/Task.js";
import Schedule from "../models/Schedule.js";
import User from "../models/User.js";
import UserActivity from "../models/UserActivity.js";

// Priority string → sort number
const priorityMap = {
  high: 1,
  medium: 2,
  low: 3,
};

// ─────────────────────────────────────────────
// ➕ ADD TASK
// ─────────────────────────────────────────────
export async function addTask(req, res) {
  try {
    let { title, category, priority, duration, status, deadline } = req.body;
    const user_id = req.user.id;

    if (!title?.trim() || !category || !priority) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ success: false, message: "Invalid user_id" });
    }

    const objectUserId = new mongoose.Types.ObjectId(user_id);

    const exists = await Task.findOne({
      title: title.trim(),
      user_id: objectUserId,
    });

    if (exists) {
      return res.status(400).json({ success: false, message: "Task already exists" });
    }

    const allowed = ["idle", "pending", "completed"];
    const finalStatus = allowed.includes(status) ? status : "idle";

    const task = new Task({
      title: title.trim(),
      category: category.toLowerCase(),
      priority: priority.toLowerCase(),
      priority_order: priorityMap[priority.toLowerCase()] || 3,
      duration: Number(duration) || 0,
      user_id: objectUserId,
      status: finalStatus,
      deadline: deadline || null,
    });

    const saved = await task.save();

    res.json({ success: true, data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────
// 📋 GET TASKS (READ ONLY)
// ─────────────────────────────────────────────
export async function getTasksForUser(req, res) {
  try {
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Valid userId is required" });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

    const tasks = await Task.find({ user_id: objectUserId })
      .sort({ priority_order: 1, createdAt: -1 })
      .lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const updatedTasks = tasks.map((task) => {
      const isOverdue =
        task.status !== "completed" &&
        task.deadline &&
        new Date(task.deadline) < today;

      return {
        ...task,
        isOverdue: !!isOverdue,
        priority_order: isOverdue ? 0 : task.priority_order,
      };
    });

    // Sort by deadline first, then priority
    updatedTasks.sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;

      if (da !== db) return da - db;

      return a.priority_order - b.priority_order;
    });

    res.json({ success: true, data: updatedTasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────
// 🔄 UPDATE STATUS (FIXED)
// ─────────────────────────────────────────────
export async function updateTaskStatus(req, res) {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const allowed = ["idle", "pending", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (task.user_id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const wasCompleted = task.status !== "completed" && status === "completed";

    const taskUpdate = {
      status,
      completedAt: status === "completed" ? new Date() : null,
    };

    // ✅ FIRST update task
    const updated = await Task.findByIdAndUpdate(id, taskUpdate, { new: true });

    // ── USER ACTIVITY LOGGING (ONLY ONE BLOCK)
    if (wasCompleted) {
      await UserActivity.create({
        user_id: updated.user_id,
        task_id: updated._id,
        category: updated.category,
        priority: updated.priority,
        completed: true,
        duration: updated.duration,
        deadline: updated.deadline,
        completedAt: new Date(),
      });
    } else {
      await UserActivity.create({
        user_id: updated.user_id,
        task_id: updated._id,
        category: updated.category,
        priority: updated.priority,
        completed: false,
        duration: updated.duration,
        deadline: updated.deadline,
        completedAt: null,
      });
    }

    // ── SCHEDULE SYNC
    await Schedule.updateMany(
      { "tasks.task_id": new mongoose.Types.ObjectId(id) },
      { $set: { "tasks.$.status": status } }
    );

    // ── LEARNING SYSTEM
    if (wasCompleted) {
      const user = await User.findById(task.user_id);
      if (user) {
        user.learning_score = (user.learning_score || 1) + 0.05;
        user.learning_score = Math.max(0.5, Math.min(2, user.learning_score));
        await user.save();
      }
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────
// 📊 GET PROGRESS
// ─────────────────────────────────────────────
export async function getProgress(req, res) {
  try {
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Valid userId is required" });
    }

    const objectUserId = new mongoose.Types.ObjectId(userId);

    const total = await Task.countDocuments({ user_id: objectUserId });
    const completed = await Task.countDocuments({
      user_id: objectUserId,
      status: "completed",
    });

    const percentage =
      total === 0 ? 0 : Math.round((completed / total) * 100);

    res.json({ success: true, data: { total, completed, percentage } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ─────────────────────────────────────────────
// 🗑️ DELETE TASK
// ─────────────────────────────────────────────
export async function deleteTask(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid task ID" });
    }

    const deleted = await Task.findOneAndDelete({ _id: id, user_id: req.user.id });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Task not found or unauthorized" });
    }

    // Remove from schedule everywhere
    await Schedule.updateMany(
      { "tasks.task_id": new mongoose.Types.ObjectId(id) },
      { $pull: { tasks: { task_id: new mongoose.Types.ObjectId(id) } } }
    );

    res.json({ success: true, data: { deletedId: id } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}