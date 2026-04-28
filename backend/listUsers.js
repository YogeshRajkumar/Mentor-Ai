import mongoose from "mongoose";
import User from "./models/User.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
dotenv.config();

async function run() {
    await connectDB();
    const user = await User.findOne({});
    if (user) {
        console.log("USER_ID=" + user._id.toString());
    } else {
        console.log("NO USER FOUND");
    }
    process.exit(0);
}
run();
