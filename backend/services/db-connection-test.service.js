
import readerDB from "../config/db.reader.js";
import writerDB from "../config/db.writer.js";
import adminDB from "../config/db.admin.js";

export async function testDatabaseConnections() {
    const connections = [
        { name: "Reader", db: readerDB },
        { name: "Writer", db: writerDB },
        { name: "Admin", db: adminDB }
    ];

    for (const connection of connections) {
        try {
            const [rows] = await connection.db.query(
                "SELECT CURRENT_USER() AS dbUser, DATABASE() AS dbName"
            );

            console.log(`${connection.name} Connected:`, rows[0]);
        } catch (error) {
            console.error(`${connection.name} Connection Failed:`, error.message);
        }
    }
}
