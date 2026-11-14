import "./Chat.css";
import { useContext, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import rehypeHighlight from "rehype-highlight";
import ReactMarkdown from "react-markdown";
import "highlight.js/styles/github-dark.css";
import CopyButton from "./components/CopyButton.jsx";
import CodeBlock from "./components/CodeBlock.jsx";
import { motion } from "framer-motion";
import {
    Sparkles,
    Code2,
    BookOpen,
    HelpCircle,
    ArrowUpRight,
    Edit3,
    Check,
    X,
    Bot
} from "lucide-react";

const SUGGESTIONS = [
    {
        icon: <BookOpen size={18} />,
        title: "Explain a concept",
        prompt: "Explain quantum computing and its future applications in simple terms",
        desc: "Clear explanations & mental models"
    },
    {
        icon: <Code2 size={18} />,
        title: "Generate code",
        prompt: "Write a production-ready debounce hook in React with TypeScript",
        desc: "Clean architecture & algorithms"
    },
    {
        icon: <Sparkles size={18} />,
        title: "Summarize content",
        prompt: "How to summarize complex technical documents efficiently?",
        desc: "Key takeaways & structured summaries"
    },
    {
        icon: <HelpCircle size={18} />,
        title: "Answer questions",
        prompt: "What are the latest breakthroughs in large language models?",
        desc: "Deep knowledge & fast reasoning"
    }
];

function Chat() {
    const { newChat, prevChats, sendMessageRef, loading, setPrompt } = useContext(MyContext);
    const [editingIdx, setEditingIdx] = useState(null);
    const [editText, setEditText] = useState("");

    const markdownComponents = {
        pre: CodeBlock
    };

    const handleEditStart = (idx, text) => {
        setEditingIdx(idx);
        setEditText(text);
    };

    const handleEditCancel = () => {
        setEditingIdx(null);
        setEditText("");
    };

    const handleEditSubmit = (idx) => {
        if (!editText.trim()) return;
        // Trim chat history up to this message (remove this msg and everything after)
        const trimmed = prevChats.slice(0, idx);
        setEditingIdx(null);
        setEditText("");
        // Directly call sendMessage with the edited text and trimmed history
        if (sendMessageRef?.current) {
            sendMessageRef.current(editText.trim(), trimmed);
        }
    };

    const handleSuggestionClick = (promptText) => {
        if (loading) return;
        if (sendMessageRef?.current) {
            sendMessageRef.current(promptText);
        } else if (setPrompt) {
            setPrompt(promptText);
        }
    };

    return (
        <div className="chats">
            {newChat ? (
                <div className="welcomeScreen">
                    <motion.div
                        className="welcomeHero"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        <div className="welcomeLogoBadge">
                            <svg width="36" height="36" viewBox="0 0 42 42" fill="none">
                                <path
                                    d="M21 4L37 13v16L21 38 5 29V13L21 4z"
                                    stroke="url(#welcomeLogoGrad)"
                                    strokeWidth="2.5"
                                    fill="none"
                                />
                                <path
                                    d="M21 12L29 17v10l-8 5-8-5V17l8-5z"
                                    fill="url(#welcomeLogoGrad)"
                                    opacity="0.3"
                                />
                                <circle cx="21" cy="21" r="4" fill="url(#welcomeLogoGrad)" />
                                <defs>
                                    <linearGradient id="welcomeLogoGrad" x1="0" y1="0" x2="42" y2="42">
                                        <stop offset="0%" stopColor="#8B5CF6" />
                                        <stop offset="50%" stopColor="#3B82F6" />
                                        <stop offset="100%" stopColor="#06B6D4" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h1 className="welcomeHeading">How can Nexara help today?</h1>
                        <p className="welcomeSubheading">
                            Supercharged intelligence designed for fast reasoning, deep coding, and creative problem solving.
                        </p>
                    </motion.div>

                    <motion.div
                        className="suggestionsGrid"
                        initial={{ opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                    >
                        {SUGGESTIONS.map((s, i) => (
                            <motion.div
                                key={s.title}
                                className="suggestionCard"
                                onClick={() => handleSuggestionClick(s.prompt)}
                                whileHover={{ y: -3, scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            >
                                <div className="suggestionHeader">
                                    <div className="suggestionIcon">{s.icon}</div>
                                    <ArrowUpRight size={16} className="suggestionArrow" />
                                </div>
                                <div className="suggestionTitle">{s.title}</div>
                                <div className="suggestionDesc">{s.desc}</div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            ) : (
                <div className="messageStream">
                    {prevChats?.map((chat, idx) => {
                        const text = chat.content || chat.parts?.[0]?.text || "";
                        const isUser = chat.role === "user";

                        // Assistant bubble that hasn't received its first token yet: show nothing
                        if (!isUser && !text) return null;

                        return (
                            <div className={isUser ? "userDiv" : "gptDiv"} key={idx}>
                                {isUser ? (
                                    editingIdx === idx ? (
                                        <div className="userEditContainer">
                                            <textarea
                                                className="userEditInput"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleEditSubmit(idx);
                                                    }
                                                    if (e.key === "Escape") handleEditCancel();
                                                }}
                                                autoFocus
                                                rows={3}
                                            />
                                            <div className="userEditActions">
                                                <button
                                                    className="editSubmitBtn"
                                                    onClick={() => handleEditSubmit(idx)}
                                                >
                                                    <Check size={14} />
                                                    <span>Save & Submit</span>
                                                </button>
                                                <button
                                                    className="editCancelBtn"
                                                    onClick={handleEditCancel}
                                                >
                                                    <X size={14} />
                                                    <span>Cancel</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="userMessageContainer">
                                            <div className="userMessageActions">
                                                {!loading && (
                                                    <button
                                                        className="msgActionBtn"
                                                        title="Edit message"
                                                        onClick={() => handleEditStart(idx, text)}
                                                    >
                                                        <Edit3 size={13} />
                                                    </button>
                                                )}
                                                <CopyButton text={text} showLabel={false} />
                                            </div>
                                            <div className="userMessage">{text}</div>
                                        </div>
                                    )
                                ) : (
                                    <div className="assistantMessageContainer">
                                        <div className="assistantHeader">
                                            <div className="assistantAvatar">
                                                <Bot size={15} />
                                            </div>
                                            <span className="assistantName">Nexara</span>
                                        </div>
                                        <div className="assistantMessageBody">
                                            <ReactMarkdown
                                                rehypePlugins={[rehypeHighlight]}
                                                components={markdownComponents}
                                            >
                                                {text}
                                            </ReactMarkdown>
                                        </div>
                                        <div className="messageActions">
                                            <CopyButton text={text} showLabel={false} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default Chat;
