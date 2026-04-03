import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './components/Welcome';
import Login from './components/Login';
import Signup from './components/Signup';
import ChatList from './components/ChatList';
import ChatThread from './components/ChatThread';
import { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('neon_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('neon_user', JSON.stringify(userData));
    localStorage.setItem('neon_token', token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('neon_user');
    localStorage.removeItem('neon_token');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('neon_user', JSON.stringify(updatedUser));
  };

  if (loading) return null;

  return (
    <Router>
      <div className="min-h-screen bg-neon-bg relative overflow-hidden">
        <div className="scanline" />
        
        <Routes>
          <Route path="/" element={user ? <Navigate to="/chats" /> : <Welcome />} />
          <Route path="/login" element={user ? <Navigate to="/chats" /> : <Login onLogin={handleLogin} />} />
          <Route path="/signup" element={user ? <Navigate to="/chats" /> : <Signup onLogin={handleLogin} />} />
          
          <Route path="/chats" element={user ? <ChatList user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} /> : <Navigate to="/login" />} />
          <Route path="/chat/:id" element={user ? <ChatThread user={user} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}
