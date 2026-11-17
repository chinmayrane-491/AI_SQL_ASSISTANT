import express from "express";
import { generateSQL } from "../services/sql-generation.service.js";
import { executeSafeSQL, executeConfirmedSQL } from "../services/sql-execution.service.js";
import { explainQueryResult } from "../services/explanation.service.js";
import { checkSQLPermission } from "../middleware/rbac.middleware.js";

const router = express.Router();

const DESTRUCTIVE_OPERATIONS = ["drop", "truncate", "delete", "update", "insert", "alter"];

/**
 * POST /api/ask
 * Natural language to SQL:
 * - SELECT queries execute immediately without confirmation
 * - DROP, TRUNCATE, DELETE, UPDATE require explicit confirmation before execution
 */
router.post("/ask", async (req, res) => {
    try {
        const { question, database, role = "reader" } = req.body;

        if (
            typeof question !== "string" ||
            !question.trim() ||
            question.length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid question (max 2000 characters).",
            });
        }

        // 1. Generate SQL via Gemini / LangChain
        const generated = await generateSQL(question, database);

        if (
            generated.status !== "generated" ||
            !generated.sql ||
            !generated.sql.trim()
        ) {
            return res.status(200).json({
                success: true,
                message: "SQL could not be generated.",
                data: {
                    question: generated.question,
                    explanation: generated.explanation,
                    clarification_question: generated.clarification_question,
                    status: generated.status,
                },
            });
        }

        const op = (generated.operation || "select").toLowerCase();

        // 2. Destructive / Mutating query check: Requires user confirmation
        if (DESTRUCTIVE_OPERATIONS.includes(op)) {
            // First verify RBAC permission
            const permCheck = checkSQLPermission(role, op);
            if (!permCheck.allowed) {
                return res.status(200).json({
                    success: false,
                    isError: true,
                    message: `Security Policy Violation: ${permCheck.message}. (Active role: ${role.toUpperCase()})`,
                    data: {
                        question: generated.question,
                        sql: generated.sql,
                        operation: op.toUpperCase(),
                        role,
                    },
                });
            }

            // Return for user confirmation - DO NOT auto-execute mutating queries
            return res.status(200).json({
                success: true,
                requiresConfirmation: true,
                message: `This ${op.toUpperCase()} query modifies database state. Confirmation required before execution.`,
                data: {
                    question: generated.question,
                    sql: generated.sql,
                    operation: op.toUpperCase(),
                    explanation: generated.explanation,
                    dangerLevel: (op === "drop" || op === "truncate") ? "high" : "moderate",
                    database: database || "ai_sql_assistant",
                    role,
                },
            });
        }

        // 3. Safe SELECT query: Execute immediately without extra confirmation
        const execution = await executeSafeSQL(generated.sql, database);

        let explanation = { answer: generated.explanation || "Query executed successfully." };
        try {
            explanation = await explainQueryResult({
                question: generated.question,
                sql: execution.executedSQL,
                rows: execution.rows,
            });
        } catch (expErr) {
            console.warn("Explanation generation warning:", expErr.message);
        }

        return res.status(200).json({
            success: true,
            requiresConfirmation: false,
            message: "Query executed and explained successfully.",
            data: {
                question: generated.question,
                sql: execution.executedSQL,
                rowCount: execution.rowCount,
                rows: execution.rows,
                explanation: explanation.answer,
                keyInsights: explanation.keyInsights,
                dataSummary: explanation.dataSummary,
                limitations: explanation.limitations,
                rowsAnalyzed: explanation.rowsAnalyzed ?? 0,
                truncated: explanation.truncated ?? false,
            },
        });

    } catch (error) {
        console.error("AI SQL request failed:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message || "Unable to process the request safely.",
        });
    }
});

/**
 * POST /api/execute-confirmed
 * Executes a previously confirmed DML or DDL query (DROP, TRUNCATE, DELETE, UPDATE)
 */
router.post("/execute-confirmed", async (req, res) => {
    try {
        const { sql, operation, database, role = "admin", confirmed } = req.body;

        if (!confirmed) {
            return res.status(400).json({
                success: false,
                message: "Confirmation is required to execute this query.",
            });
        }

        if (!sql || typeof sql !== "string") {
            return res.status(400).json({
                success: false,
                message: "Valid SQL string is required.",
            });
        }

        const result = await executeConfirmedSQL({
            sql,
            operation,
            role,
            targetDb: database,
        });

        return res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    } catch (error) {
        console.error("Confirmed SQL Execution Error:", error.message);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to execute confirmed SQL query.",
        });
    }
});

export default router;
