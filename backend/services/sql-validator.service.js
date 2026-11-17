
import parserPackage from "node-sql-parser";
import { getDatabaseSchema } from "./schema.service.js";

const { Parser } = parserPackage;
const parser = new Parser();

const MAX_ROWS = 100;

const ALLOWED_OPERATIONS = new Set([
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
]);

const READ_OPERATIONS = new Set([
    "select",
    "show",
    "desc",
    "describe"
]);

function getTableNames(sql) {
    const references = parser.tableList(sql, {
        database: "MySQL"
    });

    return references.map((reference) => {
        const parts = reference.split("::");
        return parts[2];
    }).filter(Boolean);
}

function containsColumnReference(node) {
    if (!node || typeof node !== "object") {
        return false;
    }

    if (Array.isArray(node)) {
        return node.some(containsColumnReference);
    }

    if (node.type === "column_ref") {
        return true;
    }

    return Object.values(node).some(containsColumnReference);
}

function isUnsafeWhere(where) {
    if (!where) {
        return true;
    }

    // WHERE TRUE / WHERE 1=1 सारख्या conditions reject करा.
    if (!containsColumnReference(where)) {
        return true;
    }

    return false;
}

function getLimitNumber(limit) {
    if (!limit || !Array.isArray(limit.value)) {
        return null;
    }

    if (limit.value.length !== 1) {
        return null;
    }

    const value = limit.value[0];

    if (value.type !== "number") {
        return null;
    }

    return Number(value.value);
}

export async function validateSQL(sql, expectedOperation = "select", targetDb = null) {

    // 1. Input validation
    if (typeof sql !== "string" || !sql.trim()) {
        throw new Error("SQL query is empty.");
    }

    if (sql.length > 10000) {
        throw new Error("SQL query is too long.");
    }

    if (
        typeof expectedOperation !== "string" ||
        !ALLOWED_OPERATIONS.has(expectedOperation.toLowerCase())
    ) {
        throw new Error("Invalid or unsupported SQL operation.");
    }

    const normalizedSQL = sql.trim();

    // 2. SQL parsing
    let ast;

    try {
        ast = parser.astify(normalizedSQL, {
            database: "MySQL"
        });
    } catch {
        throw new Error("Invalid SQL syntax.");
    }

    // 3. Multiple statement protection
    if (Array.isArray(ast)) {
        if (ast.length !== 1) {
            throw new Error("Multiple SQL statements are not allowed.");
        }

        ast = ast[0];
    }

    if (!ast || typeof ast.type !== "string") {
        throw new Error("Unable to identify SQL operation.");
    }

    // 4. Actual operation detection
    const actualOperation = ast.type.toLowerCase();

    if (!ALLOWED_OPERATIONS.has(actualOperation)) {
        throw new Error(
            `SQL operation is not supported: ${actualOperation}`
        );
    }

    // 5. AI operation vs actual SQL operation
    if (actualOperation !== expectedOperation.toLowerCase()) {
        const isBothRead = READ_OPERATIONS.has(actualOperation) && READ_OPERATIONS.has(expectedOperation.toLowerCase());
        if (!isBothRead) {
            throw new Error(
                `Operation mismatch. Expected ${expectedOperation}, but SQL contains ${actualOperation}.`
            );
        }
    }

    // 6. SELECT-specific security
    if (actualOperation === "select") {

        if (ast.into?.position) {
            throw new Error("SELECT INTO is not allowed.");
        }

        if (ast.locking_read) {
            throw new Error("Locking reads are not allowed.");
        }
    }

    // 7. UPDATE / DELETE WHERE validation
    if (
        actualOperation === "update" ||
        actualOperation === "delete"
    ) {
        if (isUnsafeWhere(ast.where)) {
            throw new Error(
                `${actualOperation.toUpperCase()} requires a meaningful WHERE condition.`
            );
        }
    }

    // 8. Load database schema
    const schema = await getDatabaseSchema(targetDb);

    const allowedTables = new Set(
        schema.tables.map((table) =>
            table.tableName.toLowerCase()
        )
    );

    // 9. Table validation
    let tables = [];

    if (actualOperation === "create") {

        // सध्या फक्त CREATE TABLE support.
        if (ast.keyword?.toLowerCase() !== "table") {
            throw new Error("Only CREATE TABLE is supported.");
        }

        // CREATE TABLE AS SELECT सध्या reject.
        if (ast.query_expr) {
            throw new Error("CREATE TABLE AS SELECT is not supported.");
        }

        tables = (ast.table || [])
            .map((item) => item.table)
            .filter(Boolean);

    } else if (actualOperation === "show" || actualOperation === "desc" || actualOperation === "describe") {
        const showKeyword = ast.keyword?.toLowerCase();
        if (showKeyword === "tables" || showKeyword === "databases") {
            // SHOW TABLES / SHOW DATABASES - safe metadata inspection
            tables = [];
        } else {
            let showTable = null;
            if (ast.table) {
                showTable = typeof ast.table === "string" ? ast.table : ast.table.table;
            } else if (ast.from && Array.isArray(ast.from) && ast.from[0]?.table) {
                showTable = ast.from[0].table;
            }

            if (showTable) {
                if (!allowedTables.has(showTable.toLowerCase())) {
                    throw new Error(`Table is not allowed: ${showTable}`);
                }
                tables = [showTable];
            } else {
                tables = [];
            }
        }
    } else {

        tables = getTableNames(normalizedSQL);

        if (tables.length === 0) {
            throw new Error("No valid table reference found.");
        }

        for (const tableName of tables) {
            if (!allowedTables.has(tableName.toLowerCase())) {
                throw new Error(
                    `Table is not allowed: ${tableName}`
                );
            }
        }
    }

    // 10. SELECT row limit
    let validatedSQL = normalizedSQL.replace(/;+$/, "");

    if (actualOperation === "select") {

        const limitNumber = getLimitNumber(ast.limit);

        if (ast.limit) {
            if (limitNumber === null) {
                throw new Error("Only numeric SELECT LIMIT is allowed.");
            }

            if (limitNumber > MAX_ROWS) {
                throw new Error(
                    `Maximum allowed rows is ${MAX_ROWS}.`
                );
            }
        } else {
            validatedSQL = `${validatedSQL} LIMIT ${MAX_ROWS}`;
        }
    }

    // 11. Return validation result
    return {
        valid: true,
        operation: actualOperation,
        sql: validatedSQL,
        maxRows: actualOperation === "select" ? MAX_ROWS : null,
        tables
    };
}
