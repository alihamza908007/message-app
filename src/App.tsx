import { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Welcome from './components/Welcome';
import Login from './components/Login';
import Signup from './components/Signup';
import ChatList from './components/ChatList';
import ChatThread from './components/ChatThread';
import NotificationToast from './components/NotificationToast';
import { User, Notification, Message } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const [activeChat, setActiveChat] = useState<{ id: number; isGroup: boolean } | null>(null);
  const activeChatRef = useRef<{ id: number; isGroup: boolean } | null>(null);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    const savedUser = localStorage.getItem('neon_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      // Connect to global socket
      socketRef.current = io(window.location.origin.replace('5173', '3000'), {
        transports: ['websocket']
      });

      socketRef.current.emit('join', user.id);

      socketRef.current.on('receive_message', (message: Message) => {
        // Use the ref to check active chat without re-triggering this effect
        const currentChat = activeChatRef.current;
        const isCurrent = currentChat && (
          (message.group_id && currentChat.isGroup && currentChat.id === message.group_id) ||
          (!message.group_id && !currentChat.isGroup && currentChat.id === message.sender_id)
        );

        if (!isCurrent) {
          setNotification({
            id: String(message.id),
            // ... (keep the same payload)
            senderName: message.sender_username || "Unknown Node",
            senderAvatar: message.sender_avatar || "",
            content: message.content,
            type: message.type || "text",
            chatId: message.group_id || message.sender_id || 0,
            isGroup: !!message.group_id
          });
          setTotalUnread(prev => prev + 1);
        }
      });

      socketRef.current.on('messages_read', () => {
        fetchUnread();
      });

      fetchUnread();
    } else {
      socketRef.current?.disconnect();
    }

    return () => { socketRef.current?.disconnect(); };
  }, [user]); // Removed activeChat from dependencies

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` }
      });
      if (res.ok) {
        const chats = await res.json();
        const total = chats.reduce((acc: number, chat: any) => acc + (Number(chat.unread_count) || 0), 0);
        setTotalUnread(total);
      }
    } catch (err) { console.error(err); }
  }, [user]);

  const handleLogin = useCallback((userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('neon_user', JSON.stringify(userData));
    localStorage.setItem('neon_token', token);
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('neon_user');
    localStorage.removeItem('neon_token');
  }, []);

  const handleUpdateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('neon_user', JSON.stringify(updatedUser));
  }, []);

  const handleEnterList = useCallback(() => setActiveChat(null), []);
  const handleEnterChatDM = useCallback((uid: any) => setActiveChat({ id: Number(uid), isGroup: false }), []);
  const handleEnterChatGroup = useCallback((gid: any) => setActiveChat({ id: Number(gid), isGroup: true }), []);

  if (loading) return null;

  return (
    <Router>
      <AppContent 
        user={user} 
        notification={notification} 
        setNotification={setNotification}
        totalUnread={totalUnread}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        handleUpdateUser={handleUpdateUser}
        handleEnterList={handleEnterList}
        handleEnterChatDM={handleEnterChatDM}
        handleEnterChatGroup={handleEnterChatGroup}
        fetchUnread={fetchUnread}
        socket={socketRef.current}
      />
    </Router>
  );
}

function AppContent({ 
  user, notification, setNotification, totalUnread, 
  handleLogin, handleLogout, handleUpdateUser, 
  handleEnterList, handleEnterChatDM, handleEnterChatGroup, fetchUnread,
  socket
}: any) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neon-bg relative overflow-hidden">
      <div className="scanline" />
      
      <NotificationToast 
        notification={notification} 
        onClose={() => setNotification(null)}
        onClick={() => {
          if (notification) {
              const url = notification.isGroup ? `/group/${notification.chatId}` : `/chat/${notification.chatId}`;
              navigate(url);
              setNotification(null);
          }
        }}
      />

      <Routes>
        <Route path="/" element={user ? <Navigate to="/chats" /> : <Welcome />} />
        <Route path="/login" element={user ? <Navigate to="/chats" /> : <Login onLogin={handleLogin} />} />
        <Route path="/signup" element={user ? <Navigate to="/chats" /> : <Signup onLogin={handleLogin} />} />
        
        <Route path="/chats" element={
          user ? <ChatList user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} totalUnread={totalUnread} onEnterList={handleEnterList} socket={socket} /> : <Navigate to="/login" />
        } />
        
        <Route path="/chat/:id" element={
          user ? <ChatThread user={user} onEnterChat={handleEnterChatDM} onRefreshUnread={fetchUnread} socket={socket} /> : <Navigate to="/login" />
        } />
        
        <Route path="/group/:id" element={
          user ? <ChatThread user={user} isGroup onEnterChat={handleEnterChatGroup} onRefreshUnread={fetchUnread} socket={socket} /> : <Navigate to="/login" />
        } />
      </Routes>
    </div>
  );
}
