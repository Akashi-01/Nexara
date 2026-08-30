import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";

const app = express({ type: "*/*" });
const PORT = 8080;

app.use(express.json());
app.use(cors());
app.use("/api",chatRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
});

const connectDB = async() => {
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to DB");
    }catch(err){
        console.log("Failed to connect to DB" ,err);
    }
}

app.post("/test", async (req, res) => {
    // const model = "gemini-2.5-flash"; // check current model names in AI Studio
    const {msg} = req.body || {};

    if (!msg || typeof msg !== "string" || msg.trim() === "") {
        return res.status(400).send("Request body khaali hai. Body mein apna sawaal likhein.");
    }

    // const model = "gemini-2.5-flash";

    // const options = {
    //     method: "POST",
    //     headers: {
    //         'Content-Type': "application/json",
    //         'x-goog-api-key': process.env.GEMINI_API_KEY,
    //     },
    //     body: JSON.stringify({
    //         contents: [
    //             {
    //                 parts: [
    //                     {text:msg} 
    //                 ]
    //             }
    //         ]
    //     })
    // };

    // try {
    //     const result = await fetch(
    //         `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    //         options
    //     );
    //     const data = await result.json();
    //     // Check if API returned an error
    //     if (!result.ok) {
    //         console.log("Gemini API Error:", data);
    //         return res.status(result.status).send({ error: data.error?.message || "Gemini API error" });
    //     }
    //     const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    //     // console.log("User query:", msg);
    //     // console.log("Gemini reply:", reply);
    //     res.send(reply);
    // } catch (err) {
    //     console.log(err);
    //     res.status(500).send({ error: err.message });
    // }
});