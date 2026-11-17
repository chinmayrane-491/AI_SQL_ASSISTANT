import pool from "../config/db.js";

const DEFAULT_DB_NAME = process.env.DB_NAME || "ai_sql_assistant";

const IDENTIFIER_REGEX = /^[a-zA-Z0-9_]{1,64}$/;

export async function getDatabaseSchema(targetDb = DEFAULT_DB_NAME) {
    const dbToUse = targetDb && IDENTIFIER_REGEX.test(targetDb) ? targetDb : DEFAULT_DB_NAME;

    try {
        const [tables] = await pool.query(
            `
            SELECT
                TABLE_NAME,
                TABLE_TYPE,
                ENGINE
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = ?
                AND TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
            `,
            [dbToUse]
        );

        const [columns] = await pool.query(
            `SELECT
                TABLE_NAME,
                COLUMN_NAME,
                DATA_TYPE,
                COLUMN_TYPE,
                IS_NULLABLE,
                COLUMN_KEY,
                EXTRA,
                ORDINAL_POSITION
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ?
            ORDER BY TABLE_NAME, ORDINAL_POSITION
            `,
            [dbToUse]
        );

        const [foreignKeys] = await pool.query(
            `
            SELECT
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = ?
            AND REFERENCED_TABLE_NAME IS NOT NULL
            ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION
            `,
            [dbToUse]
        );

        const tableMap = new Map();

        for (const table of tables) {
            tableMap.set(table.TABLE_NAME, {
                tableName: table.TABLE_NAME,
                tableType: table.TABLE_TYPE,
                engine: table.ENGINE,
                columns: [],
            });
        }

        for (const column of columns) {
            const table = tableMap.get(column.TABLE_NAME);
            if (!table) continue;
            table.columns.push({
                name: column.COLUMN_NAME,
                dataType: column.DATA_TYPE,
                columnType: column.COLUMN_TYPE,
                nullable: column.IS_NULLABLE === "YES",
                isPrimaryKey: column.COLUMN_KEY === "PRI",
                isUnique: column.COLUMN_KEY === "UNI",
                isIndexed: ["PRI", "UNI", "MUL"].includes(column.COLUMN_KEY),
                extra: column.EXTRA,
            });
        }

        for (const fk of foreignKeys) {
            const table = tableMap.get(fk.TABLE_NAME);
            if (!table) continue;

            const column = table.columns.find((item) => item.name === fk.COLUMN_NAME);
            if (column) {
                column.foreignKey = {
                    constraintName: fk.CONSTRAINT_NAME,
                    referencedTable: fk.REFERENCED_TABLE_NAME,
                    referencedColumn: fk.REFERENCED_COLUMN_NAME,
                };
            }
        }

        const schema = Array.from(tableMap.values());

        return {
            database: dbToUse,
            totalTables: schema.length,
            tables: schema,
        };
    } catch (error) {
        console.error("Schema Reader Error:", error.message);
        throw new Error(`Unable to read database schema for ${dbToUse}: ${error.message}`);
    }
}

/**
 * Creates a new MySQL database safely.
 */
export async function createDatabaseService(databaseName) {
    const cleanName = databaseName?.trim();
    if (!cleanName || !IDENTIFIER_REGEX.test(cleanName)) {
        throw new Error("Invalid database name. Use only letters, numbers, and underscores (max 64 chars).");
    }

    try {
        await pool.query(`CREATE DATABASE IF NOT EXISTS \`${cleanName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        return {
            success: true,
            database: cleanName,
            message: `Database "${cleanName}" created successfully in MySQL.`,
        };
    } catch (error) {
        console.error("Create Database Error:", error.message);
        throw new Error(`Failed to create database "${cleanName}": ${error.message}`);
    }
}

/**
 * Drops a MySQL database safely (Admin only).
 */
export async function deleteDatabaseService(databaseName) {
    const cleanName = databaseName?.trim();
    if (!cleanName || !IDENTIFIER_REGEX.test(cleanName)) {
        throw new Error("Invalid database name.");
    }

    const protectedDbs = ["ai_sql_assistant", "information_schema", "mysql", "performance_schema", "sys"];
    if (protectedDbs.includes(cleanName.toLowerCase())) {
        throw new Error(`Database "${cleanName}" is protected and cannot be deleted.`);
    }

    try {
        await pool.query(`DROP DATABASE IF EXISTS \`${cleanName}\``);
        return {
            success: true,
            database: cleanName,
            message: `Database "${cleanName}" deleted successfully from MySQL.`,
        };
    } catch (error) {
        console.error("Drop Database Error:", error.message);
        throw new Error(`Failed to delete database "${cleanName}": ${error.message}`);
    }
}

/**
 * Creates a new table inside a target database safely.
 */
export async function createTableService({ databaseName, tableName, ddlQuery, columns }) {
    const dbToUse = databaseName?.trim() || DEFAULT_DB_NAME;
    if (!IDENTIFIER_REGEX.test(dbToUse)) {
        throw new Error("Invalid database name.");
    }

    // Option A: Raw DDL Query passed
    if (ddlQuery && typeof ddlQuery === "string" && ddlQuery.trim()) {
        const cleanDDL = ddlQuery.trim();
        if (!cleanDDL.toUpperCase().startsWith("CREATE TABLE")) {
            throw new Error("Only CREATE TABLE statements are permitted.");
        }

        try {
            await pool.query(`USE \`${dbToUse}\``);
            await pool.query(cleanDDL);
            return {
                success: true,
                database: dbToUse,
                executedSQL: cleanDDL,
                message: "Table created successfully.",
            };
        } catch (error) {
            console.error("Raw DDL Execution Error:", error.message);
            throw new Error(`Failed to execute CREATE TABLE: ${error.message}`);
        }
    }

    // Option B: Structured column definitions passed
    const cleanTable = tableName?.trim();
    if (!cleanTable || !IDENTIFIER_REGEX.test(cleanTable)) {
        throw new Error("Invalid table name. Use alphanumeric characters and underscores.");
    }

    if (!Array.isArray(columns) || columns.length === 0) {
        throw new Error("At least one column definition is required.");
    }

    const columnDefs = [];
    const primaryKeys = [];

    for (const col of columns) {
        const colName = col.name?.trim();
        if (!colName || !IDENTIFIER_REGEX.test(colName)) {
            throw new Error(`Invalid column name: "${col.name}"`);
        }

        let type = col.type?.trim().toUpperCase() || "VARCHAR(255)";
        let def = `\`${colName}\` ${type}`;

        if (!col.nullable) {
            def += " NOT NULL";
        }
        if (col.autoIncrement) {
            def += " AUTO_INCREMENT";
        }
        if (col.defaultValue !== undefined && col.defaultValue !== "") {
            def += ` DEFAULT '${col.defaultValue.replace(/'/g, "''")}'`;
        }

        columnDefs.push(def);

        if (col.isPrimaryKey) {
            primaryKeys.push(`\`${colName}\``);
        }
    }

    if (primaryKeys.length > 0) {
        columnDefs.push(`PRIMARY KEY (${primaryKeys.join(", ")})`);
    }

    const builtSQL = `CREATE TABLE IF NOT EXISTS \`${dbToUse}\`.\`${cleanTable}\` (\n  ${columnDefs.join(",\n  ")}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

    try {
        await pool.query(builtSQL);
        return {
            success: true,
            database: dbToUse,
            table: cleanTable,
            executedSQL: builtSQL,
            message: `Table "${cleanTable}" created successfully in "${dbToUse}".`,
        };
    } catch (error) {
        console.error("Create Table Error:", error.message);
        throw new Error(`Failed to create table "${cleanTable}": ${error.message}`);
    }
}

/**
 * Lists all non-system databases from MySQL.
 */
export async function listDatabasesService() {
    try {
        const [rows] = await pool.query(
            `
            SELECT SCHEMA_NAME as dbName
            FROM INFORMATION_SCHEMA.SCHEMATA
            WHERE SCHEMA_NAME NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
            ORDER BY SCHEMA_NAME
            `
        );
        return rows.map((r) => r.dbName);
    } catch (error) {
        console.error("List Databases Error:", error.message);
        return [DEFAULT_DB_NAME, "ai_sql_warehouse"];
    }
}
