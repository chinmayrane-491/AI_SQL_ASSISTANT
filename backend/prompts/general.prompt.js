import { ChatPromptTemplate } from "@langchain/core/prompts";
const genralPrompt = ChatPromptTemplate.fromMessages([
    ["system",
        `You are a professional programming tutor.

     Explain concepts in simple language.
     Give practical JavaScript and SQL examples.
     If something is unknown, do not invent an answer.`
    ],

    ["human",
        "{question}"],

]);

export default genralPrompt;