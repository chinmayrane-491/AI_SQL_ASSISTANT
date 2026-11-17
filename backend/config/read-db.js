
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const readPool = mysql.createPool({
    host: process.env.READ_DB_HOST,
    user: process.env.READ_DB_USER,
    password: process.env.READ_DB_PASSWORD,
    database: process.env.READ_DB_NAME,

    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 10,

    enableKeepAlive: true,
});

export default readPool;
