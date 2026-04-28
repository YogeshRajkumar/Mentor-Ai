import express from "express";
import {
  addTask,
  getTasksForUser,
  updateTaskStatus,
  getProgress,
  deleteTask,
} from "../controllers/taskController.js";

const router = express.Router();

router.post("/add", addTask);
router.get("/progress/:userId", getProgress);
router.get("/:userId", getTasksForUser);
router.put("/update/:id", updateTaskStatus);
router.delete("/delete/:id", deleteTask);

export default router;

