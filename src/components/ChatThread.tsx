import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, MoreVertical, Terminal, Download, Play, Mic, Smile, Paperclip, Image as ImageIcon, Gift, Send, Plus, Loader2, X, User as UserIcon, Trash2 } from 'lucide-react';
import { User, Message } from '../types';
import { io, Socket } from 'socket.io-client';
import AudioPlayer from './AudioPlayer';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiMenuRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiMenuRef.current && !emojiMenuRef.current.contains(e.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(e.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredMessages = messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const purgeChat = async () => {
    if (!confirm('Are you sure you want to permanently purge this transmission log?')) return;
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` }
      });
      if (res.ok) {
        navigate('/chats');
      }
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` },
        body: formData
      });
      if (res.ok) {
        const { url } = await res.json();
        socketRef.current?.emit('send_message', {
          senderId: user.id, receiverId: Number(id), content: url, type
        });
      }
    } catch (err) { console.error(err); }
    finally { 
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      
      mediaRecorder.onstop = async () => {
        const activeMimeType = mediaRecorder.mimeType || 'audio/webm';
        const fileExt = activeMimeType.includes('mp4') ? 'mp4' : 'webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: activeMimeType });
        const formData = new FormData();
        formData.append('file', audioBlob, `voicenote.${fileExt}`);
        setUploading(true);
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` },
            body: formData
          });
          if (res.ok) {
            const { url } = await res.json();
            socketRef.current?.emit('send_message', {
              senderId: user.id, receiverId: Number(id), content: url, type: 'voice'
            });
          }
        } catch (err) { console.error(err); }
        finally { setUploading(false); }
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) { console.error('Mic error:', err); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setInput(prev => prev + emojiData.emoji);
  };

  const isOnlyEmoji = (str: string) => {
    if (!str || !str.trim()) return false;
    // Regular expression to match emojis (basic implementation)
    const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|[ \t\n\r])*$/;
    const match = str.match(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g);
    // If it's only emojis and we have between 1 and 3 emojis, make them big
    return emojiRegex.test(str) && match && match.length <= 3;
  };

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
        <div className="flex items-center gap-6 relative">
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`transition-all ${isSearchOpen ? 'text-neon-cyan' : 'text-white/40 hover:text-white'}`}>
            <Search size={20} />
          </button>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={`transition-all ${isMenuOpen ? 'text-neon-pink' : 'text-white/40 hover:text-white'}`}>
              <MoreVertical size={20} />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-4 w-56 bg-neon-bg/95 backdrop-blur-xl border border-neon-pink/30 rounded-xl shadow-[0_0_20px_rgba(255,45,120,0.2)] overflow-hidden flex flex-col z-50 origin-top-right"
                >
                  <button 
                    onClick={() => { setIsProfileModalOpen(true); setIsMenuOpen(false); }} 
                    className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors border-b border-white/5 font-headline text-sm"
                  >
                    <UserIcon size={16} /> View Entity Identity
                  </button>
                  <button 
                    onClick={() => { purgeChat(); setIsMenuOpen(false); }} 
                    className="flex items-center gap-3 px-4 py-3 text-neon-pink/80 hover:text-white hover:bg-neon-pink transition-colors font-headline text-sm"
                  >
                    <Trash2 size={16} /> Purge Local Log
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed top-[72px] w-full z-30 bg-neon-bg/90 backdrop-blur-md border-b border-neon-cyan/30 flex items-center px-6 py-3 shadow-[0_4px_20px_rgba(0,255,204,0.1)]"
          >
            <Search size={16} className="text-neon-cyan mr-3 shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FILTER_TRANSMISSIONS..."
              className="bg-transparent border-none text-white w-full focus:ring-0 focus:outline-none font-label text-xs uppercase tracking-widest"
              autoFocus
            />
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-white/40 hover:text-white ml-3 shrink-0 transition-colors">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isProfileModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-neon-bg border border-neon-cyan/30 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-8 relative shadow-[0_0_30px_rgba(0,255,204,0.15)]"
            >
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-neon-pink transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="w-24 h-24 rounded-full border border-neon-cyan overflow-hidden shadow-[0_0_15px_rgba(0,255,204,0.3)] mb-4">
                <img src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.username}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <h2 className="font-headline font-black text-2xl text-white mb-1">{otherUser?.username}</h2>
              <p className="font-label text-xs uppercase tracking-widest text-white/40 mb-6 bg-white/5 px-3 py-1 rounded-full border border-white/10">Entity_ID: {otherUser?.id}</p>
              
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center p-3 border border-white/5 rounded-lg bg-white/5">
                  <span className="font-label text-[10px] uppercase text-white/50 tracking-widest">Status</span>
                  <span className="font-label text-[10px] uppercase text-neon-cyan tracking-widest">Active_Node</span>
                </div>
                <div className="flex justify-between items-center p-3 border border-white/5 rounded-lg bg-white/5">
                  <span className="font-label text-[10px] uppercase text-white/50 tracking-widest">Packets</span>
                  <span className="font-label text-[10px] uppercase text-white tracking-widest">{messages.length}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

        {filteredMessages.map((msg, i) => (
          <motion.div 
            key={msg.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-1.5 max-w-[85%] ${msg.sender_id === user.id ? 'items-end ml-auto' : 'items-start'}`}
          >
            <div className={`p-4 rounded-xl ${msg.sender_id === user.id ? 'bg-neon-pink/10 rounded-br-none border border-neon-pink/30' : 'bg-white/5 rounded-bl-none border border-white/10'}`}>
              {msg.type === 'image' ? (
                <img src={msg.content} alt="Transmission" className="max-w-[250px] w-full rounded-lg border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
              ) : msg.type === 'file' ? (
                <a href={msg.content} download target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-3 rounded-lg border ${msg.sender_id === user.id ? 'bg-neon-pink/20 border-neon-pink/40 hover:bg-neon-pink/30' : 'bg-white/10 border-white/20 hover:bg-white/20'} transition-colors group`}>
                  <Download size={20} className={msg.sender_id === user.id ? 'text-neon-pink group-hover:drop-shadow-[0_0_8px_rgba(255,45,120,0.8)]' : 'text-neon-cyan group-hover:drop-shadow-[0_0_8px_rgba(0,255,204,0.8)]'} />
                  <span className="font-label text-xs uppercase tracking-widest text-white truncate max-w-[150px]">Encrypted_Payload</span>
                </a>
              ) : msg.type === 'voice' ? (
                <AudioPlayer src={msg.content} />
              ) : (
                <p className={`${isOnlyEmoji(msg.content) ? 'text-4xl py-2' : 'text-sm leading-relaxed'} text-white selection:bg-neon-cyan selection:text-neon-bg transition-all`}>
                  {msg.content}
                </p>
              )}
            </div>
            <span className="font-label text-[8px] text-white/30 uppercase tracking-widest">
              {msg.sender_id === user.id ? 'LOCAL' : 'REMOTE'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </motion.div>
        ))}
        <div ref={scrollRef} />
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-40 bg-neon-bg/90 backdrop-blur-lg border-t border-neon-pink/20 pb-safe">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto px-4 py-4 flex items-end gap-3 relative">
          <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
          <input type="file" ref={fileInputRef} className="hidden" accept="*/*" onChange={(e) => handleFileUpload(e, 'file')} />

          <div className="relative" ref={attachmentMenuRef}>
            <button 
              type="button" 
              onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
              className={`p-2 transition-all mb-1 hidden sm:block ${isAttachmentMenuOpen ? 'text-neon-pink rotate-45' : 'text-white/40 hover:text-neon-cyan'}`}
            >
              <Plus size={24} />
            </button>
            <AnimatePresence>
              {isAttachmentMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute bottom-full left-0 mb-4 w-48 bg-neon-bg/95 backdrop-blur-xl border border-neon-pink/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,45,120,0.2)]"
                >
                  <button 
                    type="button"
                    onClick={() => { imageInputRef.current?.click(); setIsAttachmentMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors border-b border-white/5 font-label text-xs uppercase"
                  >
                    <ImageIcon size={18} /> Upload Image
                  </button>
                  <button 
                    type="button"
                    onClick={() => { fileInputRef.current?.click(); setIsAttachmentMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors font-label text-xs uppercase"
                  >
                    <Paperclip size={18} /> Attach File
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className={`grow flex items-end px-3 py-2 rounded-xl border transition-all ${isRecording ? 'bg-red-500/10 border-red-500/50 shadow-[inset_0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/10 focus-within:border-neon-pink/50 focus-within:shadow-[0_0_20px_rgba(255,45,120,0.1)]'}`}>
            <div className="relative" ref={emojiMenuRef}>
              <button 
                type="button" 
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className={`p-2 transition-colors hidden sm:block ${isEmojiPickerOpen ? 'text-neon-yellow shadow-[0_0_8px_rgba(255,255,0,0.4)]' : 'text-white/40 hover:text-neon-yellow'}`}
              >
                <Smile size={20} />
              </button>
              <AnimatePresence>
                {isEmojiPickerOpen && (
                  <div className="absolute bottom-full left-0 mb-4 z-50">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="shadow-2xl"
                    >
                      <EmojiPicker 
                        onEmojiClick={onEmojiClick}
                        theme={Theme.DARK}
                        width={300}
                        height={400}
                      />
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isRecording || uploading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              className="grow bg-transparent border-none focus:ring-0 text-sm text-white py-2 resize-none placeholder:text-white/20 font-body disabled:opacity-50" 
              placeholder={uploading ? "UPLOADING_DATA..." : isRecording ? `RECORDING AUDIO... ${recordingTime}s` : "Inject pulse..."} 
              rows={1}
            />
          </div>

          <button 
            type={input.trim() ? "submit" : "button"}
            onClick={input.trim() ? undefined : (isRecording ? stopRecording : startRecording)}
            disabled={uploading}
            className={`w-12 h-12 rounded-xl border transition-all mb-1 flex items-center justify-center disabled:opacity-50 ${input.trim() ? 'bg-neon-pink/10 border-neon-pink text-neon-pink shadow-[0_0_16px_rgba(255,45,120,0.4)] hover:bg-neon-pink hover:text-white' : isRecording ? 'bg-red-500 text-white border-red-500 shadow-[0_0_16px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-white/5 border-white/10 text-white/20 hover:text-neon-cyan hover:border-neon-cyan/50'}`}
          >
            {input.trim() ? <Send size={20} /> : (isRecording ? <Terminal size={20} /> : <Mic size={20} />)}
          </button>
        </form>
      </footer>
    </div>
  );
}
