import { GoogleGenerativeAI } from "@google/generative-ai";

export function getAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("❌ GEMINI_API_KEY missing");
  }

  // Using the more standard @google/generative-ai package
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}