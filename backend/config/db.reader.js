
import mysql from "mysql2/promise";

const readerDB = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_READER_USER,
    password: process.env.DB_READER_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 10,

    multipleStatements: false
});

export default readerDB;
