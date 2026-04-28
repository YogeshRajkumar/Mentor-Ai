import { getAI } from "../utils/genai.js";
import axios from "axios";

export async function fetchCompanyInsights(companyName) {
  try {
    
    if (!companyName || typeof companyName !== "string") {
      return emptyResponse();
    }

    const prompt = `
You are an AI placement assistant.

Give preparation details for company: "${companyName}"

Return ONLY valid JSON (no explanation, no markdown):

{
  "topics": ["..."],
  "questions": ["..."]
}

Rules:
- Topics = important subjects asked in interviews/aptitude
- Questions = real or commonly asked interview/coding questions
- Keep answers realistic and useful for students
- No extra text outside JSON
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 🔥 CLEAN AI RESPONSE
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return emptyResponse();
    }

    // ✅ VALIDATION (VERY IMPORTANT)
    return {
      topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 10) : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 10) : [],
    };

  } catch (err) {
    return emptyResponse();
  }
}

// 🔥 SAFE FALLBACK
function emptyResponse() {
  return {
    topics: [],
    questions: [],
  };
}