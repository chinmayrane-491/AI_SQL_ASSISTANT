
import "dotenv/config";
import { getDatabaseConnection } from "../services/database-connection.service.js";
async function testConnection(role, operation) {
    try {
        const db = getDatabaseConnection(role, operation);

        const [rows] = await db.query(
            "SELECT CURRENT_USER() AS dbUser"
        );

        console.log(
            `${role} + ${operation}:`,
            rows[0].dbUser
        );
    } catch (error) {
        console.log(
            `${role} + ${operation}: BLOCKED -`,
            error.message
        );
    }
}

await testConnection("user", "select");
await testConnection("admin", "update");
await testConnection("admin", "create");
await testConnection("user", "delete");
