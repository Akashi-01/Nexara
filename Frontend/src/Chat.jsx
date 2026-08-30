import "./Chat.css";
import { useContext, useState, useEffect } from 'react';
import { MyContext } from "./MyContext.jsx";
import rehypeHighlight from 'rehype-highlight'
import ReactMarkdown from 'react-markdown';
import "highlight.js/styles/github-dark.css";

// react-markdown
// rehype-highlight

function Chat() {
    const { newChat, prevChats, reply } = useContext(MyContext);
    const [latestReply, setLatesReply] = useState(null);

    useEffect(() => {
        if (reply === null) {
            setLatesReply(null);
            return;
        }
        // latestReply separate => typing effect creation
        if (!prevChats?.length || !reply) return;
        const content = reply.split(" "); // individual words
        let idx = 0;
        const interval = setInterval(() => {
            setLatesReply(content.slice(0, idx + 1).join(" "));
            idx++;
            if (idx >= content.length) clearInterval(interval);
        }, 40);
        return () => clearInterval(interval);
    }, [prevChats, reply])

    // Determine if the last message is from assistant (for typing effect)
    const lastMsg = prevChats?.length > 0 ? prevChats[prevChats.length - 1] : null;
    const lastIsAssistant = lastMsg && (lastMsg.role === "assistant" || lastMsg.role === "model");

    // If last message is assistant, show all except last in main loop (last gets typing effect)
    // If last message is user, show ALL messages normally
    const displayChats = lastIsAssistant ? prevChats.slice(0, -1) : prevChats;

    return (
        <>
            {newChat && <h1>Start a New Chat!</h1>}
            <div className="chats">
                {
                    displayChats?.map((chat, idx) => {
                        const text = chat.content || chat.parts?.[0]?.text || "";
                        return (
                            <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
                                {
                                    chat.role == "user" ?
                                        <p className="userMessage">{text}</p> :
                                        <ReactMarkdown rehypePlugins={rehypeHighlight}>
                                            {text}
                                        </ReactMarkdown>
                                }
                            </div>
                        );
                    })
                }
                {
                    lastIsAssistant &&
                    <>
                        {latestReply !== null ? (
                            <div className="gptDiv" key={"typing"}>
                                <ReactMarkdown rehypePlugins={rehypeHighlight}>
                                    {latestReply}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <div className="gptDiv" key={"typing"}>
                                <ReactMarkdown rehypePlugins={rehypeHighlight}>
                                    {lastMsg?.content || lastMsg?.parts?.[0]?.text}
                                </ReactMarkdown>
                            </div>
                        )}
                    </>
                }
            </div>
        </>
    )
}
export default Chat;