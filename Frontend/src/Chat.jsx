import "./Chat.css";
import { useContext, useState, useEffect } from 'react';
import { MyContext } from "./MyContext.jsx";
import rehypeHighlight from 'rehype-highlight';
import ReactMarkdown from 'react-markdown';
import "highlight.js/styles/github-dark.css";
import CopyButton from "./components/CopyButton.jsx";
import CodeBlock from "./components/CodeBlock.jsx";

function Chat() {
    const { newChat, prevChats, reply } = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);

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
                                <p className="userMessage">{text}</p>
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
