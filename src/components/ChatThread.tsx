import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Search, MoreVertical, Terminal, Download, Play, Mic, Smile, Paperclip, Image as ImageIcon, Gift, Send, Plus, Loader2 } from 'lucide-react';
import { User, Message } from '../types';
import { io, Socket } from 'socket.io-client';

interface ChatThreadProps {
  user: User;
}

export default function ChatThread({ user }: ChatThreadProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('neon_token');
        const [userRes, msgRes] = await Promise.all([
          fetch(`/api/users/${id}`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`/api/messages/${id}`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        if (userRes.ok) setOtherUser(await userRes.json());
        if (msgRes.ok) setMessages(await msgRes.json());
      } catch (err) {
        console.error('Error fetching chat data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    socketRef.current = io();
    socketRef.current.emit('join', user.id);

    socketRef.current.on('receive_message', (message: Message) => {
      if (message.sender_id === Number(id) || message.receiver_id === Number(id)) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    socketRef.current.on('message_sent', (message: Message) => {
      if (message.receiver_id === Number(id)) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [id, user.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    socketRef.current?.emit('send_message', {
      senderId: user.id,
      receiverId: Number(id),
      content: input,
      type: 'text'
    });
    setInput('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="text-neon-pink animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 w-full z-40 bg-neon-bg/80 backdrop-blur-md border-b border-neon-pink/30 flex justify-between items-center px-6 py-4 shadow-[inset_0_0_12px_rgba(255,45,120,0.1)]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white/60 hover:text-neon-cyan transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full border border-neon-pink/50 overflow-hidden shadow-[0_0_8px_rgba(255,45,120,0.4)]">
              <img src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.username}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-neon-cyan rounded-full border-2 border-neon-bg shadow-[0_0_6px_rgba(0,255,204,1)]"></div>
          </div>
          <div>
            <h1 className="text-lg font-black text-neon-pink neon-glow-pink font-headline tracking-tighter leading-none">{otherUser?.username}</h1>
            <p className="font-label text-[9px] uppercase tracking-[0.2em] text-neon-cyan neon-glow-cyan mt-1">Uplink_Secured</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-white/40 hover:text-white transition-all"><Search size={20} /></button>
          <button className="text-white/40 hover:text-white transition-all"><MoreVertical size={20} /></button>
        </div>
      </header>

      <main className="grow pt-24 pb-32 px-4 md:max-w-3xl md:mx-auto w-full space-y-4 overflow-y-auto">
        <div className="flex justify-center mb-8">
          <span className="font-label text-[9px] uppercase tracking-[0.3em] text-white/20 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
            Transmission_Protocol: E2E_AES_256
          </span>
        </div>

        {messages.length === 0 && (
            <div className="py-20 text-center opacity-20">
                <Terminal className="mx-auto mb-4" />
                <p className="font-label text-xs uppercase tracking-widest">Awaiting first data packet...</p>
            </div>
        )}

        {messages.map((msg, i) => (
          <motion.div 
            key={msg.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-1.5 max-w-[85%] ${msg.sender_id === user.id ? 'items-end ml-auto' : 'items-start'}`}
          >
            <div className={`p-4 rounded-xl ${msg.sender_id === user.id ? 'bg-neon-pink/10 rounded-br-none border border-neon-pink/30' : 'bg-white/5 rounded-bl-none border border-white/10'}`}>
              <p className="text-sm leading-relaxed text-white selection:bg-neon-cyan selection:text-neon-bg">{msg.content}</p>
            </div>
            <span className="font-label text-[8px] text-white/30 uppercase tracking-widest">
              {msg.sender_id === user.id ? 'LOCAL' : 'REMOTE'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </motion.div>
        ))}
        <div ref={scrollRef} />
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-40 bg-neon-bg/90 backdrop-blur-lg border-t border-neon-pink/20 pb-safe">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto px-4 py-4 flex items-end gap-3">
          <button type="button" className="p-2 text-white/40 hover:text-neon-cyan transition-all mb-1">
            <Plus size={24} />
          </button>
          
          <div className="grow bg-white/5 rounded-xl border border-white/10 focus-within:border-neon-pink/50 focus-within:shadow-[0_0_20px_rgba(255,45,120,0.1)] transition-all flex items-end px-3 py-2">
            <button type="button" className="p-2 text-white/40 hover:text-neon-yellow transition-colors">
              <Smile size={20} />
            </button>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              className="grow bg-transparent border-none focus:ring-0 text-sm text-white py-2 resize-none placeholder:text-white/10 font-body" 
              placeholder="Inject pulse..." 
              rows={1}
            />
            <div className="flex items-center gap-1">
              <button type="button" className="p-2 text-white/40 hover:text-neon-cyan transition-colors"><Paperclip size={18} /></button>
              <button type="button" className="p-2 text-white/40 hover:text-neon-cyan transition-colors"><ImageIcon size={18} /></button>
            </div>
          </div>

          <button 
            type="submit"
            className={`w-12 h-12 rounded-xl border transition-all mb-1 flex items-center justify-center ${input.trim() ? 'bg-neon-pink/10 border-neon-pink text-neon-pink shadow-[0_0_16px_rgba(255,45,120,0.4)] hover:bg-neon-pink hover:text-white' : 'bg-white/5 border-white/10 text-white/20'}`}
          >
            {input.trim() ? <Send size={20} /> : <Mic size={20} />}
          </button>
        </form>
      </footer>
    </div>
  );
}
