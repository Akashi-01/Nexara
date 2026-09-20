import "./Chat.css";
import { useContext, useState, useEffect } from 'react';
import { MyContext } from "./MyContext.jsx";
import rehypeHighlight from 'rehype-highlight';
import ReactMarkdown from 'react-markdown';
import "highlight.js/styles/github-dark.css";
import CopyButton from "./components/CopyButton.jsx";
import CodeBlock from "./components/CodeBlock.jsx";

function Chat() {
    const { newChat, prevChats, reply, sendMessageRef } = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);
    const [editingIdx, setEditingIdx] = useState(null);
    const [editText, setEditText] = useState("");

    useEffect(() => {
        if (reply === null) {
            setLatestReply(null);
            return;
        }
        if (!prevChats?.length || !reply) return;
        const content = reply.split(" ");
        let idx = 0;
        const interval = setInterval(() => {
            setLatestReply(content.slice(0, idx + 1).join(" "));
            idx++;
            if (idx >= content.length) clearInterval(interval);
        }, 40);
        return () => clearInterval(interval);
    }, [prevChats, reply]);

    const lastMsg = prevChats?.length > 0 ? prevChats[prevChats.length - 1] : null;
    const lastIsAssistant = lastMsg && (lastMsg.role === "assistant" || lastMsg.role === "model");
    const displayChats = lastIsAssistant ? prevChats.slice(0, -1) : prevChats;

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
        <>
            {newChat && <h1>Start a New Chat!</h1>}
            <div className="chats">
                {displayChats?.map((chat, idx) => {
                    const text = chat.content || chat.parts?.[0]?.text || "";
                    const isUser = chat.role === "user";

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
                                            <button className="editSubmitBtn" onClick={() => handleEditSubmit(idx)}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                Send
                                            </button>
                                            <button className="editCancelBtn" onClick={handleEditCancel}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="userMessageContainer">
                                        <div className="userMessageActions">
                                            <button
                                                className="msgActionBtn"
                                                title="Edit"
                                                onClick={() => handleEditStart(idx, text)}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <CopyButton text={text} showLabel={false} />
                                        </div>
                                        <p className="userMessage">{text}</p>
                                    </div>
                                )
                            ) : (
                                <div className="assistantMessageContainer">
                                    <ReactMarkdown
                                        rehypePlugins={[rehypeHighlight]}
                                        components={markdownComponents}
                                    >
                                        {text}
                                    </ReactMarkdown>
                                    <div className="messageActions">
                                        <CopyButton text={text} showLabel={false} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {lastIsAssistant && (
                    <div className="gptDiv" key={"typing"}>
                        {(() => {
                            const fullAssistantText = latestReply !== null 
                                ? latestReply 
                                : (lastMsg?.content || lastMsg?.parts?.[0]?.text || "");

                            return (
                                <div className="assistantMessageContainer">
                                    <ReactMarkdown
                                        rehypePlugins={[rehypeHighlight]}
                                        components={markdownComponents}
                                    >
                                        {fullAssistantText}
                                    </ReactMarkdown>
                                    <div className="messageActions">
                                        <CopyButton text={fullAssistantText} showLabel={false} />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </>
    );
}

export default Chat;
