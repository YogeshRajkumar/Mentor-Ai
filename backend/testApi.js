import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("AIzaSyCtaJkwiiecPeozwmJ0-ljCmLK7z6Jx1_A");
async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello, write a poem.");
    console.log("SUCCESS:", result.response.text());
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  }
}
test();
