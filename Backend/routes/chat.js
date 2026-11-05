import express from "express";
import Thread from "../models/Thread.js";
import { streamOpenAIResponse } from "../utils/openai.js";

// Convert stored messages ({role, parts:[{text}]}) to Groq format
const toGroqMessages = (msgs) =>
    msgs.map((m) => ({
        role: m.role === "model" ? "assistant" : m.role,
        content: (m.parts || []).map((p) => p.text).join(""),
    }));

const router = express.Router();

// Test
router.post("/test", async(req,res) => {
    try{
        const thread = new Thread({
            threadId:"abc",
            title:"Testing New Thread2"
        });
        const response = await thread.save();
        res.send(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to save in Database"});
    }
});

// Get all threads
router.get("/thread", async(req, res) => {
    try{
        const threads = await Thread.find({}).sort({updatedAt: -1});
        // descending order of upadatedAt / most recent data on top
        res.json(threads);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to retrieve threads"});
    }
});

// Send info of particular thread using threadId
router.get("/thread/:threadId", async(req, res) =>{
    const {threadId} = req.params;
    try{
        const thread = await Thread.findOne({threadId});
        if(!thread){
            return res.status(404).json({error:"Thread not found"});
        }
        res.json(thread.messages);
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to get thread"});
    }
});

// Delete route based on specific threadId
router.delete("/thread/:threadId", async(req, res) => {
    const {threadId} = req.params;
    try{
        const deletedthread = await Thread.findOneAndDelete({threadId});
        if(!deletedthread){
            return res.status(404).json({error:"Thread not found"});
        }
        res.status(200).json({success:"Thread deleted successfully"});
    }catch(err){
        console.log(err);
        res.status(500).json({error:"Failed to delete thread"});
    }
});

// Post route for messages
// Post route for messages (streams the reply via Server-Sent Events)
router.post("/chat", async (req, res) => {
    const { threadId, message, truncateTo } = req.body;
    if (!threadId || !message) {
        return res.status(400).json({ error: "Missing required fields." });
    }

    // Phase 1: DB work. Failures here can still return a normal JSON error.
    let thread;
    try {
        thread = await Thread.findOne({ threadId });
        if (!thread) {
            thread = new Thread({ threadId, title: message, messages: [] });
        } else if (Number.isInteger(truncateTo) && truncateTo >= 0) {
            // message edit: drop the old turns from `truncateTo` onwards
            thread.messages = thread.messages.slice(0, truncateTo);
        }
        thread.messages.push({ role: "user", parts: [{ text: message }] });
        thread.updatedAt = new Date();
        await thread.save(); // user turn is saved even if the AI call fails
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Something went wrong." });
    }

    // Phase 2: switch the response into an event stream
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // stops proxies (nginx/Render) from buffering tokens
    });
    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

    // If the browser disconnects (Stop button / tab closed), cancel the Groq call too
    const controller = new AbortController();
    res.on("close", () => {
        if (!res.writableEnded) controller.abort();
    });

    let full = "";
    try {
        const history = toGroqMessages(thread.messages.slice(-20)); // cap context size
        for await (const token of streamOpenAIResponse(history, controller.signal)) {
            full += token;
            send({ token });
        }
        send({ done: true });
    } catch (err) {
        if (err.name !== "AbortError") {
            console.log("Stream error:", err.message);
            send({ error: "The AI service failed. Please try again." });
        }
    } finally {
        // Phase 3: save what was generated (this also keeps partial replies after Stop)
        if (full) {
            try {
                thread.messages.push({ role: "assistant", parts: [{ text: full }] });
                thread.updatedAt = new Date();
                await thread.save();
            } catch (e) {
                console.log("Failed to save assistant message:", e);
            }
        }
        res.end();
    }
});

export default router;