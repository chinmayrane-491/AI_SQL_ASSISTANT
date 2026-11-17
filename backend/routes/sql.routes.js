import express from "express";
import { generateSQL } from "../services/sql-generation.service.js";


const router = express.Router();

router.post("/generate-sql", async (req, res) => {
    try {
        const { question } = req.body;
        if (
            typeof question !== "string" ||
            !question.trim() ||
            question.length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid question (max 2000 characters).",
            });
        }
        const result = await generateSQL(question);

        return res.status(200).json({
            success: true,
            message: "SQL generation completed.",
            data: result,
        });
    }
    catch (error) {

        console.error("SQL Generation Error:", error);

        return res.status(502).json({
            success: false,
            message: "Unable to generate SQL. Please try again.",
        });

    }
});

export default router;
