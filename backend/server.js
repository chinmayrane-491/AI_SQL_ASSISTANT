import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import pool from "./config/db.js";
import { askGemini } from "./services/gemini.service.js";
import { askWithLangChain } from "./services/langchain.service.js";
import schemaRoutes from "./routes/schema.routes.js";
import sqlRoutes from "./routes/sql.routes.js";
import executeRoutes from "./routes/execute.routes.js";

dotenv.config();
const app = express();

// 1. HTTP Security Headers with Helmet
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false, // Allows flexible dashboard assets
    })
);

// 2. CORS configuration (Prevent unauthorized cross-origin requests)
const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
].filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, curl, postman) or matching whitelist
            if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
                callback(null, true);
            } else {
                callback(new Error("CORS policy: Not allowed by Access-Control-Allow-Origin"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-user-role"],
        credentials: true,
    })
);

// 3. Body parser size limit (Prevent Memory Exhaustion DoS)
app.use(express.json({ limit: "60kb" }));

// 4. Rate Limiting Protection (Prevent DDoS, Brute Force & LLM API Token Draining)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests from this IP. Please try again after 15 minutes.",
    },
});

const aiSqlLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 AI queries per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Rate limit exceeded for AI queries. Please slow down.",
    },
});

app.use("/api/", generalLimiter);
app.use("/api/ask", aiSqlLimiter);
app.use("/api/execute-confirmed", aiSqlLimiter);

// 5. API Routes
app.use("/api", schemaRoutes);
app.use("/api", sqlRoutes);
app.use("/api", executeRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "AI_SQL_ASSISTANT RUNNING SECURELY",
        timestamp: new Date().toISOString(),
    });
});

app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT NOW() AS currentTime, DATABASE() as databaseName"
        );
        res.status(200).json({
            success: true,
            message: "AI_SQL_ASSISTANT IS CONNECTED SUCCESSFULLY",
            data: rows[0],
        });
    } catch (error) {
        console.error("MYSQL ERROR", error.message);
        res.status(500).json({
            success: false,
            message: "MYSQL Connection Failed",
        });
    }
});

app.post("/api/ai_test", async (req, res) => {
    try {
        const { message } = req.body;
        if (
            typeof message !== "string" ||
            !message.trim() ||
            message.length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid message (max 2000 characters).",
            });
        }

        const result = await askGemini(message.trim());
        res.status(200).json({
            success: true,
            message: "Gemini response generated successfully!",
            data: result,
        });
    } catch (error) {
        console.error("Gemini API Error:", error.message);
        const status = error.httpStatus === 503 ? 503 : 502;
        res.status(status).json({
            success: false,
            message:
                status === 503
                    ? "Gemini service is temporarily unavailable. Please retry."
                    : "Unable to generate Gemini response.",
        });
    }
});

app.post("/api/langchain-test", async (req, res) => {
    try {
        const { message } = req.body;
        if (typeof message !== "string" || !message.trim() || message.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid question.",
            });
        }
        const result = await askWithLangChain(message.trim());
        res.status(200).json({
            success: true,
            message: "LangChain response generated successfully!",
            data: result,
        });
    } catch (error) {
        console.error("LangChain Error:", error);
        res.status(502).json({
            success: false,
            message: "Unable to generate LangChain response.",
        });
    }
});

// Centralized Error Handler (Prevent stack traces leaking in production)
app.use((err, req, res, next) => {
    console.error("Unhandled Server Error:", err.stack || err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "An unexpected internal server error occurred.",
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`AI SQL Assistant Backend running securely on port ${PORT}`);
});
