import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema({
  userId: String,

  strongAreas: [String],
  weakAreas: [String],

  topicsKnown: [String],
  preferences: [String],

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("UserProfile", userProfileSchema);