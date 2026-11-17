import modle from "../config/langchain.js";
import { getDatabaseSchema } from "./schema.service.js";
import { formatSchemaForAI } from "../utils/schema-formatter.js";
import sqlGenerationPrompt from "../prompts/sql-generation.prompt.js";
import { sqlOutputSchema } from "../schemas/sql-output.schema.js";

const structuredModel = modle.withStructuredOutput(sqlOutputSchema);
const sqlGenerationChain = sqlGenerationPrompt.pipe(structuredModel);

export async function generateSQL(question, targetDb = null) {
    if (
        typeof question !== "string" ||
        !question.trim() ||
        question.length > 2000
    ) {
        throw new Error("Invalid user question");
    }

    const schema = await getDatabaseSchema(targetDb);
    const schemaText = formatSchemaForAI(schema);
    const result = await sqlGenerationChain.invoke({
        schema: schemaText,
        question: question.trim()
    });
    if (!result || typeof result.sql !== "string") {
        throw new Error("Invalid structured SQL response");
    }
    return {
        question: question.trim(),
        database: schema.database,
        operation: result.operation,
        sql: result.sql,
        explanation: result.explanation,
        tables_used: result.tables_used,
        confidence: result.confidence,
        needs_clarification: result.needs_clarification,
        clarification_question: result.clarification_question,
        status: result.needs_clarification
            ? "clarification_required"
            : result.sql.trim()
                ? "generated"
                : "not_generated",
    };
}