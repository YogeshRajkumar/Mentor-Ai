import mongoose from "mongoose";

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGO_URI in environment variables");
  }

  mongoose.set("strictQuery", true);

  return mongoose.connect(mongoUri);
}

