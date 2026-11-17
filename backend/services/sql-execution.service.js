import readPool from "../config/read-db.js";
import { validateSQL } from "./sql-validator.service.js";
import { checkSQLPermission } from "../middleware/rbac.middleware.js";
import { getDatabaseConnection } from "./database-connection.service.js";

const QUERY_TIMEOUT_MS = 5000;
const IDENTIFIER_REGEX = /^[a-zA-Z0-9_]{1,64}$/;

/**
 * Execute Safe SELECT queries on read pool (no mutation allowed)
 */
export async function executeSafeSQL(generatedSQL, targetDb = null) {
    let connection;

    try {
        const validation = await validateSQL(generatedSQL, "select", targetDb);

        connection = await readPool.getConnection();

        await connection.query(
            `SET SESSION max_execution_time = ${QUERY_TIMEOUT_MS}`
        );

        if (targetDb && IDENTIFIER_REGEX.test(targetDb)) {
            await connection.query(`USE \`${targetDb}\``);
        }

        const [rows] = await connection.query(validation.sql);

        return {
            success: true,
            rowCount: Array.isArray(rows) ? rows.length : 0,
            rows: Array.isArray(rows) ? rows : [],
            executedSQL: validation.sql,
            tables: validation.tables,
        };
    } catch (error) {
        console.error("Safe SQL execution failed:", error.message);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Execute Confirmed DML/DDL queries (INSERT, UPDATE, DELETE, DROP, TRUNCATE, etc.)
 * Strictly requires explicit user confirmation, validates AST, checks RBAC permissions.
 */
export async function executeConfirmedSQL({ sql, operation, role = "admin", targetDb = null }) {
    let connection;

    try {
        const op = (operation || "").toLowerCase();
        const userRole = (role || "reader").toLowerCase();

        // 1. RBAC Permission Check
        const permCheck = checkSQLPermission(userRole, op);
        if (!permCheck.allowed) {
            throw new Error(`RBAC Denied: ${permCheck.message}`);
        }

        // 2. Validate AST and operation syntax
        const validation = await validateSQL(sql, op, targetDb);

        // 3. Obtain appropriate connection pool
        const poolToUse = getDatabaseConnection(userRole, op);
        connection = await poolToUse.getConnection();

        await connection.query(
            `SET SESSION max_execution_time = ${QUERY_TIMEOUT_MS}`
        );

        if (targetDb && IDENTIFIER_REGEX.test(targetDb)) {
            await connection.query(`USE \`${targetDb}\``);
        }

        const [result] = await connection.query(validation.sql);

        return {
            success: true,
            operation: op.toUpperCase(),
            affectedRows: result?.affectedRows ?? 0,
            executedSQL: validation.sql,
            tables: validation.tables,
            message: `Successfully executed ${op.toUpperCase()} query. Affected rows: ${result?.affectedRows ?? 0}.`,
        };
    } catch (error) {
        console.error("Confirmed SQL execution failed:", error.message);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
