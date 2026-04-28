import mongoose from "mongoose";

const userActivitySchema = new mongoose.Schema(
  {
    user_id: mongoose.Schema.Types.ObjectId,
    task_id: mongoose.Schema.Types.ObjectId,

    category: String,
    priority: String,

    completed: Boolean,
    duration: Number,

    deadline: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("UserActivity", userActivitySchema);