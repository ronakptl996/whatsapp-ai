import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import { generalRateLimit } from "./middleware/rateLimiter";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler";
import whatsAppRoute from "./routes/whatsApp.routes";

const app = express();

dotenv.config({
  path: "./.env",
});

// Create necessary directories
if (!fs.existsSync("./sessions")) {
  fs.mkdirSync("./sessions", { recursive: true });
}
if (!fs.existsSync("./temp")) {
  fs.mkdirSync("./temp", { recursive: true });
}
if (!fs.existsSync("./logs")) {
  fs.mkdirSync("./logs", { recursive: true });
}

// Middleware
app.use(express.static("temp"));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Apply general rate limiting
app.use(generalRateLimit);

// Routes
app.use("/api/whatsapp", whatsAppRoute);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

export { app };
