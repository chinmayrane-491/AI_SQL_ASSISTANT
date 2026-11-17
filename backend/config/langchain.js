import "dotenv/config";
import { ChatGoogle } from "@langchain/google";
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI KEY IS MISSING");
}

const MODEL = new ChatGoogle({
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.2,
    maxOutputTokens: 2000,
    maxRetries: 2
});
export default MODEL;