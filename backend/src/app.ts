import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

dotenv.config({
  path: "./.env",
});

app.use(express.static("temp"));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

import userRoute from "./routes/user.routes";

// User Route
app.use("/api/users", userRoute);

export { app };
