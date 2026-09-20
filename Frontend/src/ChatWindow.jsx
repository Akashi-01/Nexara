import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useCallback, useEffect } from "react";
import {ScaleLoader} from "react-spinners";

function ChatWindow() {
    const { prompt, setPrompt, reply, setReply, currThreadId, prevChats, setPrevChats, newChat, setNewChat, sendMessageRef } = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // set default false value

    // Core send logic — takes the message text and an optional base chat history
    const sendMessage = useCallback(async (messageText, baseChatHistory) => {
        const userMessage = messageText.trim();
        if (!userMessage) return;

        setPrompt("");
        setNewChat(false);

        // Use provided base history (for edits) or current prevChats
        const baseChats = baseChatHistory !== undefined ? baseChatHistory : prevChats;

        // Instantly display user's message in the chat
        setPrevChats([
            ...baseChats,
            { role: "user", content: userMessage }
        ]);

        setLoading(true);
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: userMessage,
                threadId: currThreadId
            })
        };
        try {
            const response = await fetch('http://localhost:8080/api/chat', options);
            const res = await response.json();
            console.log(res);
            setReply(res.reply);
            
            // Display assistant's reply in the chat
            setPrevChats(prev => [
                ...prev,
                { role: "assistant", content: res.reply }
            ]);
        } catch (err) {
            console.log(err);
        }
        setLoading(false);
    }, [prevChats, currThreadId, setPrompt, setNewChat, setPrevChats, setReply]);

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
    }
    
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
            <ScaleLoader color="#fff" loading={loading} />
            <div className="chatInput">
                <div className="inputBox">
                    <input type="text" placeholder="Ask anything" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" ? getReply() : ""} />
                    <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>
                <p className="info">
                    GPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    )
}
export default ChatWindow;