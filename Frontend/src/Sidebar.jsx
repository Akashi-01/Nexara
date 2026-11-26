import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";
import { apiFetch } from "./api.js";
import { motion } from "framer-motion";
import { Plus, MessageSquare, Trash2, Sun, Moon, Sparkles, Heart } from "lucide-react";

function Sidebar() {
    const {
        allThreads,
        setAllThreads,
        currThreadId,
        setNewChat,
        setPrompt,
        setReply,
        setPrevChats,
        setCurrThreadId,
        loading,
        toggleTheme,
        theme
    } = useContext(MyContext);

    const getAllThreads = async () => {
        try {
            const response = await apiFetch("/api/thread");
            if (!response.ok) return;
            const res = await response.json();
            const filteredData = res.map((thread) => ({
                threadId: thread.threadId,
                title: thread.title
            }));
            setAllThreads(filteredData);
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        if (!loading) getAllThreads();
    }, [currThreadId, loading]);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    };

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);

        try {
            const response = await apiFetch(`/api/thread/${newThreadId}`);
            if (!response.ok) return;
            const res = await response.json();
            setPrevChats(res);
            setReply(null);
            setNewChat(false);
        } catch (err) {
            console.log(err);
        }
    };

    const deleteThread = async (threadId) => {
        try {
            const response = await apiFetch(`/api/thread/${threadId}`, { method: "DELETE" });
            if (!response.ok) return;
            setAllThreads((prev) => prev.filter((thread) => thread.threadId !== threadId));
            if (threadId === currThreadId) {
                createNewChat();
            }
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <aside className="sidebar">
            {/* Top Brand & Actions */}
            <div className="sidebarTop">
                {/* Brand Header */}
                <div className="sidebarBrand">
                    <div className="brandLogoIcon">
                        <svg width="22" height="22" viewBox="0 0 42 42" fill="none">
                            <path
                                d="M21 4L37 13v16L21 38 5 29V13L21 4z"
                                stroke="url(#sidebarLogoGrad)"
                                strokeWidth="3"
                                fill="none"
                            />
                            <path
                                d="M21 12L29 17v10l-8 5-8-5V17l8-5z"
                                fill="url(#sidebarLogoGrad)"
                                opacity="0.35"
                            />
                            <circle cx="21" cy="21" r="4.5" fill="url(#sidebarLogoGrad)" />
                            <defs>
                                <linearGradient id="sidebarLogoGrad" x1="0" y1="0" x2="42" y2="42">
                                    <stop offset="0%" stopColor="#8B5CF6" />
                                    <stop offset="50%" stopColor="#3B82F6" />
                                    <stop offset="100%" stopColor="#06B6D4" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="brandTextWrapper">
                        <span className="brandName">Nexara</span>
                        <span className="brandBadge">AI</span>
                    </div>
                </div>

                {/* New Chat Button */}
                <motion.button
                    className="newChatBtn"
                    onClick={createNewChat}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    <div className="newChatContent">
                        <Plus size={18} className="newChatIcon" />
                        <span>New Chat</span>
                    </div>
                    <span className="newChatSparkle">
                        <Sparkles size={14} />
                    </span>
                </motion.button>

                {/* Theme Toggle Pill */}
                <div className="themeToggleContainer">
                    <button
                        className={`themeTogglePill ${theme === "dark" ? "is-dark" : "is-light"}`}
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        type="button"
                    >
                        <div className="themeToggleTrack">
                            <div className="themeIndicator" />
                            <div className="themeOption darkOption">
                                <Moon size={14} />
                                <span>Dark</span>
                            </div>
                            <div className="themeOption lightOption">
                                <Sun size={14} />
                                <span>Light</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* History Section */}
            <div className="historyWrapper">
                <div className="historyHeader">
                    <span className="historyTitle">Recent Chats</span>
                    {allThreads.length > 0 && (
                        <span className="historyCount">{allThreads.length}</span>
                    )}
                </div>

                <ul className="history">
                    {allThreads.length === 0 ? (
                        <li className="historyEmpty">
                            <MessageSquare size={16} />
                            <span>No recent conversations</span>
                        </li>
                    ) : (
                        allThreads.map((thread) => {
                            const isCurrent = thread.threadId === currThreadId;
                            return (
                                <li
                                    key={thread.threadId}
                                    onClick={() => changeThread(thread.threadId)}
                                    className={isCurrent ? "highlighted" : ""}
                                >
                                    <MessageSquare size={15} className="historyItemIcon" />
                                    <span className="threadTitle" title={thread.title}>
                                        {thread.title}
                                    </span>
                                    <button
                                        type="button"
                                        className="threadDeleteBtn"
                                        title="Delete chat"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteThread(thread.threadId);
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>

            {/* Sidebar Footer */}
            <div className="sign">
                <div className="creatorBadge">
                    <span className="creatorText">Created with</span>
                    <Heart size={12} className="heartIcon" />
                    <span className="creatorName">By Akashi</span>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
