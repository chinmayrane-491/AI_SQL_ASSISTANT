
import mysql from "mysql2/promise";

const adminDB = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_ADMIN_USER,
    password: process.env.DB_ADMIN_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 5
});

export default adminDB;
