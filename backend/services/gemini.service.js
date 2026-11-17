import ai from "../config/gemini.js";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
export async function askGemini(userMessage) {
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: userMessage,
        config: {
            systemInstruction:
                "You are a helpful AI assistant. " +
                "Answer clearly and accurately. " +
                "If you do not know something, say so.",

            maxOutputTokens: 500,
        },
    });

    const answer = response.text;
    if (!answer) {
        throw new Error("GEMINI RETURN EMPTY MESSAGE")
    }
    return {
        answer,
        model: MODEL,
        usage: response.usageMetadata ?? null,
    };
}

