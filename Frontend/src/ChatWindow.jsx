import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useCallback, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";
import { streamChat } from "./streamChat.js";

function ChatWindow() {
    const { prompt, setPrompt, currThreadId, prevChats, setPrevChats, setNewChat, sendMessageRef, loading, setLoading } = useContext(MyContext);
    const [isOpen, setIsOpen] = useState(false);
    const controllerRef = useRef(null);

    // Core send logic: takes the message text and an optional base chat history (used by edits)
    const sendMessage = useCallback(async (messageText, baseChatHistory) => {
        const userMessage = messageText.trim();
        if (!userMessage || loading) return; // ignore sends while a reply is streaming

        setPrompt("");
        setNewChat(false);

        const baseChats = baseChatHistory !== undefined ? baseChatHistory : prevChats;

        // Show the user's message plus an empty assistant bubble that tokens fill in
        setPrevChats([
            ...baseChats,
            { role: "user", content: userMessage },
            { role: "assistant", content: "" },
        ]);

        const controller = new AbortController();
        controllerRef.current = controller;
        setLoading(true);

        // Batch tokens: re-rendering react-markdown per token is slow,
        // so flush at most once per animation frame.
        let pending = "";
        let raf = null;
        const flush = () => {
            raf = null;
            if (!pending) return;
            const chunk = pending;
            pending = "";
            if (controller.signal.reason === "thread-switch") return; // don't write into another thread
            setPrevChats((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                copy[copy.length - 1] = { ...last, content: last.content + chunk };
                return copy;
            });
        };

        try {
            await streamChat({
                threadId: currThreadId,
                message: userMessage,
                truncateTo: baseChats.length, // backend trims its history to match (for edits)
                signal: controller.signal,
                onToken: (t) => {
                    pending += t;
                    if (!raf) raf = requestAnimationFrame(flush);
                },
            });
        } catch (err) {
            if (!controller.signal.aborted) {
                console.log(err);
                setPrevChats((prev) => {
                    const copy = [...prev];
                    const last = copy[copy.length - 1];
                    if (last?.role === "assistant" && !last.content) {
                        copy[copy.length - 1] = { ...last, content: "⚠️ Something went wrong. Please try again." };
                    }
                    return copy;
                });
            }
        } finally {
            if (raf) cancelAnimationFrame(raf);
            flush();
            // Stopped before the first token arrived: remove the empty bubble
            if (controller.signal.aborted && controller.signal.reason !== "thread-switch") {
                setPrevChats((prev) => {
                    const last = prev[prev.length - 1];
                    return last?.role === "assistant" && !last.content ? prev.slice(0, -1) : prev;
                });
            }
            if (controllerRef.current === controller) {
                controllerRef.current = null;
                setLoading(false);
            }
        }
    }, [prevChats, currThreadId, loading, setPrompt, setNewChat, setPrevChats, setLoading]);

    const stopGeneration = () => controllerRef.current?.abort("user-stop");

    // Switching / creating / deleting a thread cancels any stream in progress
    useEffect(() => {
        return () => controllerRef.current?.abort("thread-switch");
    }, [currThreadId]);

    // Register sendMessage so Chat.jsx can access it via ref
    useEffect(() => {
        if (sendMessageRef) {
            sendMessageRef.current = sendMessage;
        }
    }, [sendMessage, sendMessageRef]);

    const getReply = () => {
        sendMessage(prompt);
    };

    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    };

    // Spinner only until the first token arrives
    const last = prevChats[prevChats.length - 1];
    const waitingForFirstToken = loading && last?.role === "assistant" && last.content === "";

    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>GPT <i className="fa-solid fa-chevron-down"></i></span>
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>
            {
                isOpen &&
                <div className="dropDown">
                    <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                    <div className="dropDownItem"><i className="fa-solid fa-cloud-arrow-up"></i> Upgrade Plan</div>
                    <div className="dropDownItem"><i className="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
                    <div className="dropDownItem"><i className="fa-solid fa-circle-question"></i> Help & FAQ</div>
                </div>
            }
            <Chat />
            <ScaleLoader color="#fff" loading={waitingForFirstToken} />
            <div className="chatInput">
                <div className="inputBox">
                    <input type="text" placeholder="Ask anything" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" ? getReply() : ""} />
                    {loading ? (
                        <div id="submit" onClick={stopGeneration} title="Stop generating"><i className="fa-solid fa-stop"></i></div>
                    ) : (
                        <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                    )}
                </div>
                <p className="info">
                    GPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    );
}
export default ChatWindow;