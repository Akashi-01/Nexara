import './App.css';
import Sidebar from './Sidebar.jsx';
import ChatWindow from './ChatWindow.jsx';
import {MyContext} from './MyContext.jsx';
import { useState , useEffect} from 'react';
import {v1 as uuidv1} from 'uuid';

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats,setPrevChats] = useState([]); // stores all prev chats of curr threads
  const [newChat,setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const providerValues = { 
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    theme, toggleTheme
  };
  
  return (
    <div className='app'>
      <MyContext.Provider value={providerValues}>
      <Sidebar />
      <ChatWindow />
      </MyContext.Provider>
    </div>
  )
}

export default App
