import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useCallback, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";
import { streamChat } from "./streamChat.js";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronDown,
    User,
    Settings,
    Zap,
    LogOut,
    HelpCircle,
    ArrowUp,
    Square,
    Sparkles,
    Bot,
    AlertTriangle
} from "lucide-react";

function ChatWindow() {
    const {
        prompt,
        setPrompt,
        currThreadId,
        prevChats,
        setPrevChats,
        setNewChat,
        sendMessageRef,
        loading,
        setLoading,
        user,
        logout,
        theme
    } = useContext(MyContext);

    const [isOpen, setIsOpen] = useState(false);
    const controllerRef = useRef(null);
    const profileRef = useRef(null);
    const inputRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Core send logic: takes the message text and an optional base chat history (used by edits)
    const sendMessage = useCallback(
        async (messageText, baseChatHistory) => {
            const userMessage = messageText.trim();
            if (!userMessage || loading) return; // ignore sends while a reply is streaming

            setPrompt("");
            setNewChat(false);

            const baseChats = baseChatHistory !== undefined ? baseChatHistory : prevChats;

            // Show the user's message plus an empty assistant bubble that tokens fill in
            setPrevChats([
                ...baseChats,
                { role: "user", content: userMessage },
                { role: "assistant", content: "" }
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
                    }
                });
            } catch (err) {
                if (!controller.signal.aborted) {
                    console.log(err);
                    setPrevChats((prev) => {
                        const copy = [...prev];
                        const last = copy[copy.length - 1];
                        if (last?.role === "assistant" && !last.content) {
                            copy[copy.length - 1] = {
                                ...last,
                                content: "Something went wrong. Please try again."
                            };
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
        },
        [prevChats, currThreadId, loading, setPrompt, setNewChat, setPrevChats, setLoading]
    );

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

    // User initials or letter
    const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

    // Spinner only until the first token arrives
    const last = prevChats[prevChats.length - 1];
    const waitingForFirstToken = loading && last?.role === "assistant" && last.content === "";

    return (
        <main className="chatWindow">
            {/* Top Navigation Bar */}
            <header className="navbar">
                <div className="modelSelector">
                    <div className="modelIconBadge">
                        <Sparkles size={14} className="modelSparkle" />
                    </div>
                    <span className="modelName">Nexara</span>
                    <span className="modelVersion">4.0</span>
                    <div className="statusIndicator" title="System Online" />
                    <ChevronDown size={14} className="modelChevron" />
                </div>

                <div className="profileWrapper" ref={profileRef}>
                    <button
                        type="button"
                        className="userIconDiv"
                        onClick={handleProfileClick}
                        aria-label="User Profile Menu"
                    >
                        <span className="userAvatarText">{userInitial}</span>
                    </button>

                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                className="dropDown"
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                            >
                                <div className="dropDownHeader">
                                    <div className="dropDownEmail">
                                        <User size={13} />
                                        <span>{user?.email || "user@nexara.ai"}</span>
                                    </div>
                                    <span className="planBadge">Free Plan</span>
                                </div>
                                <div className="dropDownDivider" />
                                <div className="dropDownItem">
                                    <Settings size={15} />
                                    <span>Settings</span>
                                </div>
                                <div className="dropDownItem upgradeItem">
                                    <Zap size={15} />
                                    <span>Upgrade Plan</span>
                                </div>
                                <div className="dropDownItem">
                                    <HelpCircle size={15} />
                                    <span>Help & FAQ</span>
                                </div>
                                <div className="dropDownDivider" />
                                <div
                                    className="dropDownItem logoutItem"
                                    onClick={() => {
                                        setIsOpen(false);
                                        logout();
                                    }}
                                >
                                    <LogOut size={15} />
                                    <span>Log out</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Chat Conversation Scroll Area */}
            <div className="chatContentArea">
                <Chat />
                {waitingForFirstToken && (
                    <div className="streamingLoaderWrapper">
                        <ScaleLoader
                            color={theme === "light" ? "#7c3aed" : "#8b5cf6"}
                            height={18}
                            width={3}
                            radius={2}
                            margin={2}
                            loading={waitingForFirstToken}
                        />
                        <span className="streamingLoaderText">Nexara is thinking...</span>
                    </div>
                )}
            </div>

            {/* Floating Glass Chat Input */}
            <div className="chatInput">
                <div className="inputBox">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Ask Nexara anything... (Press Enter to send)"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => (e.key === "Enter" ? getReply() : "")}
                        autoComplete="off"
                    />

                    {loading ? (
                        <button
                            type="button"
                            className="inputActionBtn stopBtn"
                            onClick={stopGeneration}
                            title="Stop generating"
                            aria-label="Stop generating"
                        >
                            <Square size={14} fill="currentColor" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={`inputActionBtn sendBtn ${prompt.trim() ? "active" : ""}`}
                            onClick={getReply}
                            disabled={!prompt.trim()}
                            title="Send prompt"
                            aria-label="Send prompt"
                        >
                            <ArrowUp size={18} strokeWidth={2.6} />
                        </button>
                    )}
                </div>

                <p className="info">
                    Nexara can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </main>
    );
}

export default ChatWindow;
