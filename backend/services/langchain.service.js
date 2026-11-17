import model from "../config/langchain.js";
import genralPrompt from "../prompts/general.prompt.js";
import { StringOutputParser } from "@langchain/core/output_parsers";

const parser = new StringOutputParser();

const genralChain = genralPrompt.pipe(model).pipe(parser);

export async function askWithLangChain(question) {
    const answer = await genralChain.invoke({
        question,
    });

    return {
        answer,
        provider: "Google Gemini",
        framework: "LangChain",
        model: process.env.GEMINI_MODEL,
    };
}

export default genralChain;