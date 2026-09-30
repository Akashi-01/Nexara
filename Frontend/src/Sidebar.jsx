import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import {v1 as uuidv1} from "uuid"; 

function Sidebar(){
    const { allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setPrevChats, setCurrThreadId, loading, toggleTheme, theme } = useContext(MyContext);

    const getAllThreads = async() =>{
        try{
            const response = await fetch("http://localhost:8080/api/thread");
            const res = await response.json();
            const filteredData = res.map(thread => ({threadId: thread.threadId , title: thread.title}));
            // console.log(filteredData);
            setAllThreads(filteredData);
        }catch(err){
            console.log(err);
        }

    };

    useEffect(() => {
    if (!loading) getAllThreads(); // refresh the list when a reply finishes (or the thread changes)
}, [currThreadId, loading]);

    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    }

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);

        try{
            const response = await fetch(`http://localhost:8080/api/thread/${newThreadId}`);
            const res = await response.json();
            console.log(res);
            setPrevChats(res);
            setReply(null);
            setNewChat(false);
        }catch(err) {
            console.log(err);
        }
    }

    const deleteThread = async (threadId) =>{
        try{
            const response = await fetch(`http://localhost:8080/api/thread/${threadId}`, {method:"DELETE"});
            const res = await response.json();
            console.log(res);
            // updated threads re-render
            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));
            if(threadId === currThreadId){
                createNewChat();
            }
        }catch(err){
            console.log(err);
        }
    }

    return(
        <section className="sidebar">
            {/* New Chat button */}
            <button onClick={createNewChat}>
                <img src="src/assets/blacklogo.png" alt="GPT Logo" className="logo"/>
                <span><i className="fa-solid fa-pen-to-square"></i></span>
            </button>

            {/* Theme toggle button */}
            <button onClick={toggleTheme}>
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                <span><i className={theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon"}></i></span>
            </button>
            
            {/* History */}
            <ul className="history">
                {
                    allThreads.map((thread, idx) => (
                        <li key={idx} onClick={(e) => changeThread(thread.threadId)}
                            className={thread.threadId === currThreadId ? "highlighted" : ""}
                        >
                            {thread.title}
                            <i className="fa-solid fa-trash" onClick={(e) => { 
                                e.stopPropagation(); //stop event bubbling
                                deleteThread(thread.threadId);
                            }}></i>
                        </li>
                    ))
                }
            </ul>

            {/* Sign */}
            <div className="sign">
                <p>By Akashi &hearts;</p>
            </div>
        </section> 
    )
}
export default Sidebar;