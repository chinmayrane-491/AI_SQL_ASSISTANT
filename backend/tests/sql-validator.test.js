
import "dotenv/config";
import { validateSQL } from "../services/sql-validator.service.js";

const testCases = [
    {
        name: "Valid SELECT",
        sql: "SELECT employee_id FROM employees",
        operation: "select",
        shouldPass: true
    },
    {
        name: "Valid DELETE with WHERE",
        sql: "DELETE FROM employees WHERE employee_id = 101",
        operation: "delete",
        shouldPass: true
    },
    {
        name: "DELETE without WHERE",
        sql: "DELETE FROM employees",
        operation: "delete",
        shouldPass: false
    },
    {
        name: "UPDATE with WHERE",
        sql: "UPDATE employees SET employee_id = 102 WHERE employee_id = 101",
        operation: "update",
        shouldPass: true
    },
    {
        name: "UPDATE without WHERE",
        sql: "UPDATE employees SET employee_id = 102",
        operation: "update",
        shouldPass: false
    },
    {
        name: "Operation mismatch",
        sql: "DELETE FROM employees WHERE employee_id = 101",
        operation: "select",
        shouldPass: false
    },
    {
        name: "Multiple SQL statements",
        sql: "SELECT employee_id FROM employees; DELETE FROM employees",
        operation: "select",
        shouldPass: false
    },
    {
        name: "Invalid table",
        sql: "SELECT * FROM unknown_table",
        operation: "select",
        shouldPass: false
    },
    {
        name: "DROP existing table",
        sql: "DROP TABLE employees",
        operation: "drop",
        shouldPass: true
    },
    {
        name: "TRUNCATE existing table",
        sql: "TRUNCATE TABLE employees",
        operation: "truncate",
        shouldPass: true
    }
];

for (const test of testCases) {
    console.log("\n-----------------------------");
    console.log("TEST:", test.name);

    try {
        const result = await validateSQL(
            test.sql,
            test.operation
        );

        console.log("RESULT:", result);
        console.log(
            test.shouldPass ? "PASS" : "FAIL - Expected rejection"
        );

    } catch (error) {
        console.log("BLOCKED:", error.message);
        console.log(
            test.shouldPass ? "FAIL - Unexpected rejection" : "PASS"
        );
    }
}
