import "./Chat.css";
import { useContext, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import rehypeHighlight from "rehype-highlight";
import ReactMarkdown from "react-markdown";
import "highlight.js/styles/github-dark.css";
import CopyButton from "./components/CopyButton.jsx";
import CodeBlock from "./components/CodeBlock.jsx";
import { motion } from "framer-motion";
import { Edit3, Check, X, Bot } from "lucide-react";

function Chat() {
    const { newChat, prevChats, sendMessageRef, loading } = useContext(MyContext);
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

    return (
        <div className="chats">
            {newChat ? (
                <motion.div
                    className="emptyChat"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                >
                    <h1 className="startChatTitle">Start a New Chat!</h1>
                </motion.div>
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
