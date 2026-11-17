import "dotenv/config";
import { generateSQL } from "../services/sql-generation.service.js";

const question = "Update employee 101 name to Rahul.";

try {
    const result = await generateSQL(question);

    console.log("\nGenerated SQL Result:");
    console.log(JSON.stringify(result, null, 2));

    if (
        result.sql.trim() === "" ||
        !result.sql.trim().toLowerCase().startsWith("select")
    ) {
        console.log("\nTest: DELETE request was not generated as executable SQL.");
    } else {
        console.log("\nWARNING: Check the generated SQL.");
    }

} catch (error) {
    console.error("Test failed:", error.message);
}