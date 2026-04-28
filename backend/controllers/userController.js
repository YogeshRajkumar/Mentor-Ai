import mongoose from "mongoose";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

function asString(val) {
  return typeof val === "string" ? val : "";
}

export async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    
    // 🔒 Ownership check
    if (req.user.id !== id) {
      return res.status(403).json({ success: false, message: "Unauthorized access to profile" });
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Valid id is required" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
}
