import { validateSQL } from "../services/sql-validator.service.js";

const testQueries = [
    "SELECT * FROM customers",
    "DELETE FROM customers",
    "UPDATE customers SET name = 'Test'",
    "DROP TABLE customers",
    "SELECT * FROM customers; DELETE FROM customers",
    "SELECT * FROM unknown_table",
];

for (const sql of testQueries) {
    try {
        const result = await validateSQL(sql);

        console.log("ACCEPTED:", sql);
        console.log(result);
    } catch (error) {
        console.log("REJECTED:", sql);
        console.log(error.message);
    }
}