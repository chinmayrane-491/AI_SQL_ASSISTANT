
import model from "../config/langchain.js";
import explanationPrompt from "../prompts/explanation.prompt.js";
import { explanationSchema } from "../schemas/explanation.schema.js";


const structuredModel = model.withStructuredOutput(
    explanationSchema
);


const explanationChain = explanationPrompt.pipe(
    structuredModel
);


const MAX_ROWS_FOR_AI = 30;
const MAX_COLUMNS_FOR_AI = 20;
const MAX_CELL_LENGTH = 500;

function normalizeValue(value) {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === "bigint") {
        return value.toString();
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (Buffer.isBuffer(value)) {
        return "[binary data omitted]";
    }

    if (typeof value === "string") {
        return value.slice(0, MAX_CELL_LENGTH);
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return value;
    }

    return String(value).slice(0, MAX_CELL_LENGTH);
}

function prepareRowsForAI(rows) {
    return rows
        .slice(0, MAX_ROWS_FOR_AI)
        .map((row) => {
            const safeRow = {};

            Object.entries(row)
                .slice(0, MAX_COLUMNS_FOR_AI)
                .forEach(([key, value]) => {
                    safeRow[key] = normalizeValue(value);
                });

            return safeRow;
        });
}

export async function explainQueryResult({
    question,
    sql,
    rows,
}) {
    if (!Array.isArray(rows)) {
        throw new Error("Invalid database result.");
    }

    // No need to call Gemini when no records are returned.
    if (rows.length === 0) {
        return {
            answer: "No matching records were found.",
            keyInsights: [],
            dataSummary: "The query returned zero records.",
            limitations: [
                "There were no matching records to analyze.",
            ],
        };
    }

    const safeRows = prepareRowsForAI(rows);

    const resultText = JSON.stringify({
        totalRowsReturned: rows.length,
        rowsSentForAnalysis: safeRows.length,
        rows: safeRows,
    });

    const explanation = await explanationChain.invoke({
        question,
        sql,
        result: resultText,
    });

    return {
        ...explanation,
        rowsAnalyzed: safeRows.length,
        totalRowsReturned: rows.length,
        truncated: rows.length > MAX_ROWS_FOR_AI,
    };
}
