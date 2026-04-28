import mongoose from "mongoose";

const scheduleTaskSchema = new mongoose.Schema(
  {
    task_id: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    title: { type: String, required: true },
    category: { type: String },
    priority: { type: String },
    duration: { type: Number },
    status: {
      type: String,
      enum: ["idle", "pending", "completed"],
      default: "idle",
    },
  },
  { _id: false }
);

const scheduleSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    day: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
    },

    tasks: [scheduleTaskSchema],
  },
  { timestamps: true }
);

// One document per user per day
scheduleSchema.index({ user_id: 1, day: 1 }, { unique: true });

export default mongoose.model("Schedule", scheduleSchema);
