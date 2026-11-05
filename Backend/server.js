import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing in .env");
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 8080;

// Needed on Render/Railway so secure cookies work behind their proxy
app.set("trust proxy", 1);

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);

// Auth routes first, then chat routes
app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to DB");
    } catch (err) {
        console.log("Failed to connect to DB", err);
    }
};

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});