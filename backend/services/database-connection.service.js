
import readerDB from "../config/db.reader.js";
import writerDB from "../config/db.writer.js";
import adminDB from "../config/db.admin.js";

const READ_OPERATIONS = [
    "select",
    "show",
    "desc",
    "describe"
];

const WRITE_OPERATIONS = [
    "insert",
    "update",
    "delete"
];

const ADMIN_OPERATIONS = [
    "create",
    "alter",
    "drop",
    "truncate"
];

export function getDatabaseConnection(role, operation) {

    const normalizedRole = (role || "reader").toLowerCase();
    const normalizedOperation = (operation || "select").toLowerCase();

    // Reader or User: READ only
    if (
        (normalizedRole === "user" || normalizedRole === "reader") &&
        READ_OPERATIONS.includes(normalizedOperation)
    ) {
        return readerDB;
    }

    // Writer: READ (uses reader pool)
    if (
        normalizedRole === "writer" &&
        READ_OPERATIONS.includes(normalizedOperation)
    ) {
        return readerDB;
    }

    // Writer: INSERT, UPDATE, DELETE (uses writer pool)
    if (
        normalizedRole === "writer" &&
        WRITE_OPERATIONS.includes(normalizedOperation)
    ) {
        return writerDB;
    }

    // Admin: READ
    if (
        normalizedRole === "admin" &&
        READ_OPERATIONS.includes(normalizedOperation)
    ) {
        return readerDB;
    }

    // Admin: INSERT, UPDATE, DELETE
    if (
        normalizedRole === "admin" &&
        WRITE_OPERATIONS.includes(normalizedOperation)
    ) {
        return writerDB;
    }

    // Admin: CREATE, ALTER, DROP, TRUNCATE
    if (
        normalizedRole === "admin" &&
        ADMIN_OPERATIONS.includes(normalizedOperation)
    ) {
        return adminDB;
    }

    throw new Error(
        `Database access denied for role: "${role}", operation: "${operation.toUpperCase()}".`
    );
}
