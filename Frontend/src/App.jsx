import './App.css';
import Sidebar from './Sidebar.jsx';
import ChatWindow from './ChatWindow.jsx';
import Auth from './Auth.jsx';
import { MyContext } from './MyContext.jsx';
import { useState, useEffect, useRef, useCallback } from 'react';
import { v1 as uuidv1 } from 'uuid';
import { ScaleLoader } from 'react-spinners';
import { API_URL, setUnauthorizedHandler } from './api.js';

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]); // stores all prev chats of curr threads
  const [newChat, setNewChat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [allThreads, setAllThreads] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const sendMessageRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setSendMessage = (fn) => {
    sendMessageRef.current = fn;
  };

  // Clears the user and all chat state (used by logout and by expired sessions)
  const resetSession = useCallback(() => {
    setUser(null);
    setAllThreads([]);
    setPrevChats([]);
    setPrompt("");
    setReply(null);
    setNewChat(true);
    setLoading(false);
    setCurrThreadId(uuidv1());
  }, []);

  // Any 401 from apiFetch sends the user back to the login screen
  useEffect(() => {
    setUnauthorizedHandler(resetSession);
  }, [resetSession]);

  // Restore the session on page load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setUser(data.user);
        }
      } catch (err) {
        console.log(err);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch (err) {
      console.log(err);
    }
    resetSession();
  };

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    theme, toggleTheme,
    sendMessageRef, setSendMessage,
    loading, setLoading,
    user, setUser, logout
  };

  if (authLoading) {
    return (
      <div className="authLoading">
        <ScaleLoader color="#888" />
      </div>
    );
  }

  if (!user) {
    return <Auth onAuth={setUser} />;
  }

  return (
    <div className='app'>
      <MyContext.Provider value={providerValues}>
        <Sidebar />
        <ChatWindow />
      </MyContext.Provider>
    </div>
  );
}

export default App;