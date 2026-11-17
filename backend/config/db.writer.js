
import mysql from "mysql2/promise";

const writerDB = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_WRITER_USER,
    password: process.env.DB_WRITER_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 3,
    queueLimit: 10
});

export default writerDB;

