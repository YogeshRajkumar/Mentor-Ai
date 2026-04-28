import Task from "../models/Task.js";
import Schedule from "../models/Schedule.js";
import User from "../models/User.js";
import UserActivity from "../models/UserActivity.js";
import axios from "axios";
import { predictFailure } from "../ml/predictor.js";
import { fetchCompanyInsights } from "../utils/companyInsights.js";
import UserProfile from "../models/UserProfile.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to get Gemini SDK instance
let genAIInstance = null;
function getGenAI() {
  if (!genAIInstance) {
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is missing from environment variables");
      return null;
    }
    genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAIInstance;
}

// ─────────────────────────────
// GROK FALLBACK (TOP-LEVEL)
// ─────────────────────────────
async function callGrok(prompt) {
  const models = ["grok-2-1212", "grok-2-latest", "grok-2", "grok-beta"];
  for (const model of models) {
    try {
      if (!process.env.GROK_API_KEY) {
        console.warn("⚠️ GROK_API_KEY missing, skipping fallback.");
        return "";
      }

      const res = await axios.post(
        "https://api.x.ai/v1/chat/completions",
        {
          model,
          messages: [
            { role: "system", content: "You are a helpful AI mentor specializing in job placements and career guidance. Always return valid JSON if requested." },
            { role: "user", content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROK_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const content = res.data.choices?.[0]?.message?.content || "";
      if (content) return content;
    } catch (err) {
      const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      console.warn(`⚠️ Grok fallback model ${model} failed:`, detail);
    }
  }
  return "";
}

// ─────────────────────────────
// HELPER: LEARNING INSIGHT
// ─────────────────────────────
function generateLearningInsight(history) {
  if (!history || history.length === 0) return "Keep working to build consistency";
  const stats = {};
  history.forEach((h) => {
    if (!stats[h.category]) stats[h.category] = { total: 0, completed: 0 };
    stats[h.category].total++;
    if (h.completed) stats[h.category].completed++;
  });
  let weak = null;
  let lowest = 1;
  for (const [cat, s] of Object.entries(stats)) {
    const rate = s.completed / s.total;
    if (rate < lowest && s.total >= 2) {
      lowest = rate;
      weak = cat;
    }
  }
  return weak ? `You struggle more with ${weak}` : "You are consistent across tasks";
}

// ─────────────────────────────
// AI CHAT CONTROLLER — PLACEMENT MENTOR
// ─────────────────────────────
export async function aiChat(req, res) {
  try {
    const { message, history: chatHistory } = req.body;
    const userId = req.user.id;
    const msg = message?.toLowerCase() || "";

    if (!userId || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: "userId and message required" });
    }

    // ───────────── FETCH USER DATA ─────────────
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ───────────── INTENT CLASSIFICATION ─────────────
    const greetingKeywords = ["hi", "hello", "hey", "howdy", "sup", "what's up"];
    const placementKeywords = ["interview", "company", "placement", "job", "hr", "dsa", "resume", "aptitude", "infosys", "tcs", "wipro"];
    
    const isGreeting = greetingKeywords.some((kw) => msg.includes(kw));
    const isPlacement = placementKeywords.some((kw) => msg.includes(kw));

    // ───────────── MEMORY SYSTEM ─────────────
    let updates = { strongAreas: [], weakAreas: [] };
    if (msg.includes("weak")) updates.weakAreas.push(msg.split("weak in ")[1]?.split(" ")[0] || "general");
    
    let profile = null;
    try {
      profile = await UserProfile.findOneAndUpdate(
        { userId },
        {
          $addToSet: {
            strongAreas: { $each: updates.strongAreas },
            weakAreas: { $each: updates.weakAreas }
          },
          $set: { updatedAt: new Date() }
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      profile = await UserProfile.findOne({ userId });
    }

    // ───────────── COMPANY DETECTION ─────────────
    const companyPatterns = ["tcs", "infosys", "wipro", "accenture", "amazon", "google", "microsoft"];
    let detectedCompany = null;
    for (const cp of companyPatterns) {
      if (msg.includes(cp)) {
        detectedCompany = cp.charAt(0).toUpperCase() + cp.slice(1);
        break;
      }
    }

    let companyInsights = null;
    if (detectedCompany) {
      try { companyInsights = await fetchCompanyInsights(detectedCompany); } catch { companyInsights = null; }
    }
    const companyContext = companyInsights ? JSON.stringify(companyInsights) : "No specific company data available";

    const historyPrompt = chatHistory?.length > 0
      ? `\n# 📜 CHAT HISTORY\n${chatHistory.map(h => `${h.role === "user" ? "User" : "Mentor"}: ${h.text}`).join("\n")}\n`
      : "";

    // ───────────── PROMPT ─────────────
    const prompt = `
You are an AI Mentor specialized ONLY in job placements, career guidance, aptitude, and technical interviews.

STRICT RULES:
1. If the user asks anything NOT related to placements, career, aptitude, DSA, resume, or jobs, you MUST politely refuse.
2. For unrelated questions, return type: "unrelated" and a reply explaining you only help with placement prep.
3. ALWAYS return valid JSON. Do not include markdown code blocks or extra text.

User Profile:
- Strong Areas: ${profile?.strongAreas?.join(", ") || "None"}
- Weak Areas: ${profile?.weakAreas?.join(", ") || "None"}

Message: "${message}"
Detected Intent: ${isPlacement ? "Placement" : isGreeting ? "Greeting" : "General"}
${historyPrompt}

Company Context:
${companyContext}

Output JSON Format (Strict):
{
  "reply": "Your helpful mentor response",
  "type": "placement | aptitude | guidance | unrelated | greeting",
  "data": {
    "insight": "One line pro-tip or null",
    "technical": ["Specific topics to study"],
    "strategy": ["Step-by-step advice"],
    "tips": ["Interview hacks"],
    "steps": ["Actionable steps"]
  }
}
`;

    // ───────────── AI CALLS ─────────────
    let rawText = "";
    const modelsToTry = [
      "gemini-flash-latest",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-pro-latest"
    ];

    // 1. Try Gemini Models using SDK
    const genAI = getGenAI();
    if (genAI) {
      for (const modelName of modelsToTry) {
        try {
          console.log(`🤖 Attempting Gemini model: ${modelName}...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
          });
          
          const response = await result.response;
          rawText = response.text();
          
          if (rawText) {
            console.log(`✅ Success with ${modelName}`);
            break;
          }
        } catch (err) {
          console.warn(`⚠️ Model ${modelName} failed:`, err.message);
          
          // Direct axios fallback if SDK fails (using v1 stable)
          try {
            console.log(`🔄 Attempting direct Axios fallback for ${modelName}...`);
            const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
            const res = await axios.post(url, {
              contents: [{ parts: [{ text: prompt }] }]
            }, { timeout: 15000 });
            rawText = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (rawText) {
               console.log(`✅ Success with ${modelName} (Axios fallback)`);
               break;
            }
          } catch (axiosErr) {
            const detail = axiosErr.response?.data ? JSON.stringify(axiosErr.response.data) : axiosErr.message;
            console.warn(`❌ Axios fallback for ${modelName} also failed:`, detail);
          }
        }
      }
    } else {
      console.warn("⚠️ Gemini SDK not initialized (missing API key)");
    }

    // 2. Try Grok Fallback (If Gemini failed)
    if (!rawText) {
      console.log("🔄 Gemini failed (all models), attempting Grok fallback...");
      rawText = await callGrok(prompt);
    }

    // 3. Final EMERGENCY Fallback (No AI)
    if (!rawText) {
      console.warn("❌ All AI models failed (Gemini & Grok). Using emergency static response.");
      rawText = JSON.stringify({
        reply: `I'm currently experiencing high traffic, but I can still help! For Interview prep: Focus on Pseudo Code, Puzzle solving (logical), and DBMS. For HR: Prepare and your project details. Let's try again in a minute!`,
        type: "guidance",
        data: {
          insight: "Interview prep typically focuses heavily on logical reasoning and pseudo-code.",
          technical: ["Pseudo Code", "DBMS", "Java/Python"],
          strategy: ["Practice puzzles from GeeksforGeeks", "Review Resume projects"],
          tips: ["Be confident", "Explain your logic clearly"],
          steps: ["Complete Aptitude mock", "Revise core technicals"]
        }
      });
    } else {
      console.log("📝 Raw AI Response (first 100 chars):", rawText.substring(0, 100));
    }

    // ───────────── PARSING & NORMALIZATION ─────────────
    let parsed;
    try {
      // Find the first '{' and last '}'
      const jsonStart = rawText.indexOf("{");
      const jsonEnd = rawText.lastIndexOf("}");
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonString = rawText.slice(jsonStart, jsonEnd + 1);
        parsed = JSON.parse(jsonString);
      } else {
        throw new Error("No JSON structure found");
      }
    } catch (err) {
      console.warn("⚠️ JSON Parse Failed, raw text was:", rawText.slice(0, 100) + "...");
      
      // Fallback: If it looks like JSON but failed to parse, try a simple regex to get the 'reply'
      const replyMatch = rawText.match(/"reply"\s*:\s*"([^"]+)"/);
      parsed = {
        reply: replyMatch ? replyMatch[1] : (rawText.length < 500 ? rawText : "I'm having trouble formatting the response. Let's try again!"),
        type: isPlacement ? "placement" : "general",
        data: { insight: null, technical: [], strategy: [], tips: [], steps: [] }
      };
    }

    // Ensure structure exists and fields are arrays
    if (!parsed.data) parsed.data = {};
    const arrayFields = ["technical", "strategy", "tips", "steps"];
    arrayFields.forEach(field => {
      parsed.data[field] = Array.isArray(parsed.data[field]) ? parsed.data[field] : [];
    });

    return res.json({
      success: true,
      data: {
        reply: parsed.reply,
        type: parsed.type || "general",
        company: detectedCompany || null,
        data: parsed.data
      }
    });

  } catch (err) {
    console.error("❌ Chat Controller Error:", err.message);
    return res.status(500).json({ success: false, message: "AI Error" });
  }
}

export async function feedback(req, res) {
  try {
    return res.json({ success: true, message: "Feedback received" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function dailyPlan(req, res) {
  try {
    const userId = req.user.id;
    const tasks = await Task.find({ user_id: userId, status: { $ne: "completed" } }).limit(3);
    return res.json({ success: true, data: tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}