import express from "express";
import Thread from "../models/Thread.js";
import auth from "../middleware/auth.js";
import { streamOpenAIResponse } from "../utils/openai.js";

// Convert stored messages ({role, parts:[{text}]}) to Groq format
const toGroqMessages = (msgs) =>
    msgs.map((m) => ({
        role: m.role === "model" ? "assistant" : m.role,
        content: (m.parts || []).map((p) => p.text).join(""),
    }));

const router = express.Router();
router.use(auth); // every route below requires login

// Get all threads of the logged-in user
router.get("/thread", async (req, res) => {
    try {
        const threads = await Thread.find({ userId: req.user.id }).sort({ updatedAt: -1 });
        res.json(threads);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to retrieve threads" });
    }
});

// Get the messages of one thread
router.get("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;
    try {
        const thread = await Thread.findOne({ userId: req.user.id, threadId });
        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }
        res.json(thread.messages);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to get thread" });
    }
});

// Delete a thread
router.delete("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;
    try {
        const deleted = await Thread.findOneAndDelete({ userId: req.user.id, threadId });
        if (!deleted) {
            return res.status(404).json({ error: "Thread not found" });
        }
        res.status(200).json({ success: "Thread deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to delete thread" });
    }
});

// Post route for messages (streams the reply via Server-Sent Events)
router.post("/chat", async (req, res) => {
    const { threadId, message, truncateTo } = req.body;

    // Strings only: blocks NoSQL-injection payloads like {"$ne": null}
    if (
        typeof threadId !== "string" || !threadId.trim() ||
        typeof message !== "string" || !message.trim()
    ) {
        return res.status(400).json({ error: "Missing or invalid fields." });
    }
    if (message.length > 8000) {
        return res.status(400).json({ error: "Message is too long." });
    }

    // Phase 1: DB work. Failures here can still return a normal JSON error.
    let thread;
    try {
        thread = await Thread.findOne({ userId: req.user.id, threadId });
        if (!thread) {
            thread = new Thread({
                userId: req.user.id,
                threadId,
                title: message.slice(0, 40),
                messages: [],
            });
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
        "X-Accel-Buffering": "no",
    });
    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

    // If the browser disconnects (Stop button / tab closed), cancel the Groq call too
    const controller = new AbortController();
    res.on("close", () => {
        if (!res.writableEnded) controller.abort();
    });

    let full = "";
    try {
        const history = toGroqMessages(thread.messages.slice(-20));
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
        // Phase 3: save what was generated (keeps partial replies after Stop)
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