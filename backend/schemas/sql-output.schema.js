
import { z } from "zod";

export const sqlOutputSchema = z.object({

    operation: z.enum([
        "select",
        "show",
        "desc",
        "describe",
        "insert",
        "update",
        "delete",
        "create",
        "alter",
        "drop",
        "truncate",
        "none"
    ]).describe(
        "The intended SQL operation. Return none when clarification is required or SQL cannot be generated."
    ),

    sql: z.string().describe(
        "Exactly one MySQL SQL statement. Return an empty string if SQL cannot safely be generated."
    ),

    explanation: z.string().describe(
        "A simple explanation of what the SQL statement does."
    ),

    tables_used: z.array(z.string()).describe(
        "Names of database tables referenced by the generated SQL."
    ),

    confidence: z.enum([
        "high",
        "medium",
        "low"
    ]).describe(
        "Confidence that the SQL matches the user's request and supplied schema."
    ),

    needs_clarification: z.boolean().describe(
        "True if the request is ambiguous or cannot be safely answered."
    ),

    clarification_question: z.string().nullable().describe(
        "A short clarification question when needed. Otherwise null."
    )

}).strict();
