import parserPackage from "node-sql-parser";
const { Parser } = parserPackage;
const parser = new Parser();

const SUPPORTED_OPERATIONS = [
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
    "truncate"
];

export function classifySQL(sql) {

    if (!sql || typeof sql !== "string") {
        throw new Error("Invalid SQL input");
    }

    let ast;

    try {
        ast = parser.astify(sql, {
            database: "MySQL"
        });
    } catch (error) {
        throw new Error("Invalid SQL syntax");
    }

    // Reject multiple SQL statements
    if (Array.isArray(ast)) {
        throw new Error("Multiple SQL statements are not allowed");
    }

    const operation = ast.type?.toLowerCase();

    if (!SUPPORTED_OPERATIONS.includes(operation)) {
        throw new Error(
            `Unsupported SQL operation: ${operation}`
        );
    }

    return {
        operation,
        sql,
        isReadOnly: ["select", "show", "desc", "describe"].includes(operation),
        requiresWritePermission:
            ["insert", "update", "delete"].includes(operation),
        requiresAdminPermission:
            ["create", "alter", "drop", "truncate"].includes(operation)
    };
}
