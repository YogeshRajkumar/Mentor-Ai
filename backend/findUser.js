import mongoose from "mongoose";
import User from "./models/User.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
dotenv.config();

async function run() {
    await connectDB();
    const user = await User.findOne({ name: "Student" });
    console.log("DEFAULT_USER_ID=" + (user ? user._id : "none"));
    process.exit(0);
}
run();
