import express from "express";
import {
    getDatabaseSchema,
    createDatabaseService,
    deleteDatabaseService,
    createTableService,
    listDatabasesService,
} from "../services/schema.service.js";

const router = express.Router();

/**
 * GET /api/schema
 * Optional query parameter: ?database=my_db
 */
router.get("/schema", async (req, res) => {
    try {
        const targetDb = req.query.database;
        const schema = await getDatabaseSchema(targetDb);
        return res.status(200).json({
            success: true,
            message: "Database schema retrieved successfully",
            data: schema,
        });
    } catch (error) {
        console.error("Schema API Error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message || "Unable to retrieve database schema",
        });
    }
});

/**
 * GET /api/databases
 * Returns list of user databases in MySQL
 */
router.get("/databases", async (req, res) => {
    try {
        const dbs = await listDatabasesService();
        return res.status(200).json({
            success: true,
            message: "Databases retrieved successfully",
            data: dbs,
        });
    } catch (error) {
        console.error("List Databases API Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to list databases",
        });
    }
});

/**
 * POST /api/database/create
 * Body: { databaseName: "my_db" }
 */
router.post("/database/create", async (req, res) => {
    try {
        const { databaseName } = req.body;
        if (!databaseName) {
            return res.status(400).json({
                success: false,
                message: "databaseName is required.",
            });
        }
        const result = await createDatabaseService(databaseName);
        return res.status(201).json({
            success: true,
            message: result.message,
            data: result,
        });
    } catch (error) {
        console.error("Create DB API Error:", error.message);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create database",
        });
    }
});

/**
 * POST /api/database/delete
 * Body: { databaseName: "my_db" }
 */
router.post("/database/delete", async (req, res) => {
    try {
        const { databaseName } = req.body;
        if (!databaseName) {
            return res.status(400).json({
                success: false,
                message: "databaseName is required.",
            });
        }
        const result = await deleteDatabaseService(databaseName);
        return res.status(200).json({
            success: true,
            message: result.message,
            data: result,
        });
    } catch (error) {
        console.error("Delete DB API Error:", error.message);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to delete database",
        });
    }
});

/**
 * POST /api/table/create
 * Body: { databaseName, tableName, columns, ddlQuery }
 */
router.post("/table/create", async (req, res) => {
    try {
        const { databaseName, tableName, columns, ddlQuery } = req.body;
        const result = await createTableService({ databaseName, tableName, columns, ddlQuery });
        return res.status(201).json({
            success: true,
            message: result.message,
            data: result,
        });
    } catch (error) {
        console.error("Create Table API Error:", error.message);
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to create table",
        });
    }
});

export default router;
