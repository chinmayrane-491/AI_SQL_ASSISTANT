
import { classifySQL } from "../services/sql-classifier.service.js";

const testQueries = [
    "SELECT * FROM employees",

    `UPDATE employees
     SET salary = 60000
     WHERE id = 5`,

    "DELETE FROM employees WHERE id = 5",

    `INSERT INTO employees (name)
     VALUES ('Rahul')`,

    `CREATE TABLE projects (
        id INT PRIMARY KEY
    )`
];

for (const sql of testQueries) {
    try {
        const result = classifySQL(sql);

        console.log({
            sql,
            operation: result.operation,
            isReadOnly: result.isReadOnly,
            requiresWritePermission:
                result.requiresWritePermission,
            requiresAdminPermission:
                result.requiresAdminPermission
        });

    } catch (error) {
        console.error(error.message);
    }
}
