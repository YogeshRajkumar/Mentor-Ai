import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    user_email: { type: String, trim: true, default: "" },
    college_schedule: {
      start: { type: String, default: "" },
      end: { type: String, default: "" },
    },
    free_time_slots: [
      {
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
    ],
    learning_speed: {
      java: { type: Number, default: 1 },
      aptitude: { type: Number, default: 1 },
    },
    lastScheduleUpdate: { type: Date },
    lastFeedback: { type: String, default: "" },
    learningSpeed: { type: Number, default: 1 },
    
    // 🔥 LEARNING SYSTEM: Tracks user performance globally 
    learning_score: { type: Number, default: 1 },
    
    reminderTime: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
