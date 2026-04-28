import axios from "axios";

export async function callGrok(prompt) {
  const models = ["grok-beta", "grok-2", "grok-1"];
  for (const model of models) {
    try {
      const res = await axios.post(
        "https://api.x.ai/v1/chat/completions",
        {
          model,
          messages: [
            { role: "system", content: "You are a helpful AI mentor." },
            { role: "user", content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROK_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return res.data.choices?.[0]?.message?.content || "";
    } catch (err) {
      const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      console.warn(`⚠️ Grok model ${model} failed:`, detail);
      continue;
    }
  }
  return "";
}