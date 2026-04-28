import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    category: {
      type: String,
      enum: ["java", "aptitude", "project"],
      required: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },

    priority_order: Number,

    penalized: { type: Boolean, default: false },

    duration: { type: Number, required: true, min: 1 },

    // 🔥 NEW: difficulty for ML
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    // 🔥 NEW: AI workload understanding
    estimated_effort_score: {
      type: Number,
      default: 1,
    },

    status: {
      type: String,
      enum: ["idle", "pending", "completed"],
      default: "idle",
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    completedAt: Date,
    deadline: Date,
  },
  { timestamps: true }
);

// 🔥 INDEX FOR PERFORMANCE
taskSchema.index({ user_id: 1, status: 1 });

export default mongoose.model("Task", taskSchema);