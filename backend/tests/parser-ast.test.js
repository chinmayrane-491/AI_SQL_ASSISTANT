
import parserPackage from "node-sql-parser";

const { Parser } = parserPackage;
const parser = new Parser();

const queries = [
    "SELECT employee_id FROM employees",

    "INSERT INTO employees (employee_id) VALUES (101)",

    "UPDATE employees SET employee_id = 102 WHERE employee_id = 101",

    "DELETE FROM employees WHERE employee_id = 101",

    "CREATE TABLE test_table (id INT)",

    "ALTER TABLE employees ADD COLUMN test_column VARCHAR(100)",

    "DROP TABLE employees",

    "TRUNCATE TABLE employees",

    "SELECT * FROM employees; DELETE FROM employees"
];

for (const sql of queries) {
    console.log("\n================================");
    console.log("SQL:", sql);

    try {
        const ast = parser.astify(sql, {
            database: "MySQL"
        });

        console.log("AST:");
        console.dir(ast, { depth: 8 });

        const tables = parser.tableList(sql, {
            database: "MySQL"
        });

        console.log("TABLE LIST:");
        console.dir(tables, { depth: 5 });

    } catch (error) {
        console.log("PARSER ERROR:", error.message);
    }
}
