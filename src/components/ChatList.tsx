import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, MessageSquare, Users, User as UserIcon, LogOut, Check, X, UserSearch, Loader2, Send, Trash2 } from 'lucide-react';
import { User, Chat, Friendship } from '../types';
import ProfileModal from './ProfileModal';

interface ChatListProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

type Tab = 'chats' | 'friends' | 'search';

export default function ChatList({ user, onLogout, onUpdateUser }: ChatListProps) {
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [chats, setChats] = useState<Chat[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pending, setPending] = useState<Friendship[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` }
      });
      const data = await res.json();
      if (res.ok) setChats(data);
    } catch (err) { console.error(err); }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/friends', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` }
      });
      const data = await res.json();
      if (res.ok) setFriends(data);

      const resPending = await fetch('/api/friends/pending', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` }
      });
      const dataPending = await resPending.json();
      if (resPending.ok) setPending(dataPending);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchChats();
    fetchFriends();
  }, [activeTab]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?query=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` }
      });
      const data = await res.json();
      if (res.ok) setSearchResults(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const sendFriendRequest = async (friendId: number) => {
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('neon_token')}` 
        },
        body: JSON.stringify({ friendId })
      });
      if (res.ok) {
        setSearchResults(prev => prev.map(u => u.id === friendId ? { ...u, friendship_status: 'pending' } : u));
      }
    } catch (err) { console.error(err); }
  };

  const removeFriend = async (friendId: number) => {
    try {
      const res = await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('neon_token')}` 
        },
        body: JSON.stringify({ friendId })
      });
      if (res.ok) {
        fetchFriends(); // refreshed after remove
      }
    } catch (err) { console.error(err); }
  };

  const acceptFriend = async (friendId: number) => {
    try {
      const res = await fetch('/api/friends/accept', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('neon_token')}` 
        },
        body: JSON.stringify({ friendId })
      });
      if (res.ok) {
        fetchFriends();
      }
    } catch (err) { console.error(err); }
  };

  const deleteChat = async (otherUserId: number) => {
    if (!confirm('Are you sure you want to permanently delete this transmission log?')) return;
    try {
      const res = await fetch(`/api/messages/${otherUserId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('neon_token')}` 
        }
      });
      if (res.ok) {
        fetchChats();
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen pb-32">
      <header className="fixed top-0 w-full z-40 bg-neon-bg/80 backdrop-blur-md border-b border-neon-pink/30 shadow-[inset_0_0_12px_rgba(255,45,120,0.1)] transition-all">
        <div className="flex justify-between items-center px-6 py-4 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-neon-pink/50 overflow-hidden shadow-[0_0_10px_rgba(255,45,120,0.3)] cursor-pointer" onClick={() => setIsProfileOpen(true)}>
              <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
               <h1 className="font-headline font-black text-xl tracking-tight text-neon-pink neon-glow-pink leading-none">NEON_CHAT</h1>
               <p className="font-label text-[9px] uppercase tracking-widest text-neon-cyan mt-1">{user.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('search')} className={`transition-all ${activeTab === 'search' ? 'text-neon-cyan neon-glow-cyan' : 'text-white/40 hover:text-white'}`}>
                <UserSearch size={22} />
            </button>
            <button onClick={onLogout} className="text-white/40 hover:text-neon-pink transition-all"><LogOut size={22} /></button>
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'chats' && (
            <motion.div 
              key="chats"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              <div className="flex justify-between items-end mb-4">
                  <h2 className="font-headline font-bold text-white/60 tracking-widest uppercase text-xs">Direct_Transmissions</h2>
                  <span className="font-label text-[10px] text-neon-cyan">{chats.length} ACTIVE</span>
              </div>

              {chats.length === 0 && (
                  <div className="py-20 text-center border border-dashed border-white/10 rounded-xl">
                      <MessageSquare className="mx-auto text-white/20 mb-4" size={40} />
                      <p className="font-label text-xs uppercase tracking-widest text-white/40">No active transmissions found</p>
                      <button onClick={() => setActiveTab('friends')} className="mt-4 text-neon-pink font-bold text-xs uppercase underline underline-offset-4 decoration-neon-pink/30">Connect with entities</button>
                  </div>
              )}

              {chats.map(chat => (
                <div key={chat.id} className="relative group overflow-hidden bg-white/5 backdrop-blur-md p-2 rounded-xl border border-white/10 hover:border-neon-pink/30 transition-all duration-300 flex items-center justify-between pr-3">
                  <Link 
                    to={`/chat/${chat.id}`}
                    className="flex items-center gap-4 grow p-2 min-w-0 z-10"
                  >
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10">
                        <img src={chat.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.username}`} alt={chat.username} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="grow min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-headline font-bold text-white truncate">{chat.username}</h3>
                        <span className="font-label text-[10px] text-white/40 group-hover:hidden transition-all duration-300">
                          {chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </span>
                      </div>
                      <p className="font-body text-sm text-white/60 truncate pr-4 group-hover:pr-10 transition-all duration-300">{chat.last_message || 'Start transmission...'}</p>
                    </div>
                  </Link>
                  <button 
                      onClick={(e) => { e.preventDefault(); deleteChat(chat.id); }} 
                      className="p-3 bg-neon-pink/5 text-neon-pink/60 rounded-lg border border-neon-pink/30 hover:bg-neon-pink hover:text-white hover:border-neon-pink transition-all flex items-center shrink-0 z-20"
                      title="Clear Transmission Log"
                  >
                      <Trash2 size={16} />
                  </button>
                  <div className="absolute inset-0 bg-linear-to-r from-neon-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'friends' && (
            <motion.div 
               key="friends"
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 10 }}
               className="space-y-6"
            >
              {pending.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-headline font-bold text-neon-yellow neon-glow-yellow tracking-widest uppercase text-xs">Incoming_Requests</h2>
                  {pending.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-neon-yellow/5 border border-neon-yellow/30 p-4 rounded-xl backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <img src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`} className="w-10 h-10 rounded-full border border-neon-yellow/30" />
                            <span className="font-headline font-medium text-white">{p.username}</span>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => acceptFriend(p.id)} className="p-2 bg-neon-yellow text-neon-bg rounded-lg hover:shadow-[0_0_12px_rgba(255,224,74,0.6)] transition-all">
                               <Check size={18} />
                           </button>
                           <button className="p-2 bg-white/5 text-white/40 rounded-lg hover:text-neon-pink transition-colors">
                               <X size={18} />
                           </button>
                        </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <h2 className="font-headline font-bold text-neon-cyan neon-glow-cyan tracking-widest uppercase text-xs">Network_Nodes</h2>
                {friends.length === 0 && (
                     <div className="py-10 text-center border border-dashed border-white/10 rounded-xl">
                        <p className="font-label text-[10px] uppercase tracking-widest text-white/40">No active nodes in network</p>
                    </div>
                )}
                <div className="grid grid-cols-1 gap-2">
                    {friends.map(f => (
                        <div key={f.id} className="flex flex-col sm:flex-row items-center justify-between bg-white/5 border border-white/10 p-2 pl-3 rounded-xl hover:border-neon-cyan/30 transition-all gap-3 relative">
                             <Link to={`/chat/${f.id}`} className="flex items-center gap-3 w-full grow group">
                                <img src={f.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`} className="w-10 h-10 rounded-full border border-white/10" />
                                <span className="font-headline font-bold text-white group-hover:text-neon-cyan transition-colors">{f.username}</span>
                                <MessageSquare className="text-neon-cyan opacity-40 group-hover:opacity-100 ml-auto mr-2" size={18} />
                            </Link>
                            <button 
                                onClick={(e) => { e.preventDefault(); removeFriend(f.id); }} 
                                className="p-2 sm:px-3 sm:py-2 bg-neon-pink/5 text-neon-pink/60 rounded-lg border border-neon-pink/30 hover:bg-neon-pink hover:text-white hover:border-neon-pink transition-all flex items-center gap-2 shrink-0 z-10 font-label text-[10px] uppercase tracking-wider"
                                title="Sever Connection"
                            >
                                <X size={14} /> <span className="hidden sm:inline">Unlink</span>
                            </button>
                        </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'search' && (
            <motion.div 
               key="search"
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 10 }}
               className="space-y-6"
            >
               <form onSubmit={handleSearch} className="flex gap-2">
                 <div className="group relative grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-neon-cyan transition-colors" size={20} />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearch(e as any);
                        }
                      }}
                      placeholder="SCAN_USERS_BY_ID_OR_ALIAS..."
                      className="w-full bg-white/5 border border-white/10 focus:border-neon-cyan focus:ring-0 text-white pl-12 pr-4 py-4 rounded-xl transition-all font-label text-sm tracking-widest uppercase"
                    />
                 </div>
                 <button 
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="bg-neon-cyan/10 border border-neon-cyan text-neon-cyan px-6 py-4 rounded-xl font-headline font-bold uppercase tracking-widest hover:bg-neon-cyan hover:text-neon-bg transition-all flex items-center justify-center min-w-[100px]"
                 >
                   {loading ? <Loader2 className="animate-spin" size={20} /> : 'SCAN'}
                 </button>
               </form>

               <div className="space-y-3">
                 {searchResults.length > 0 ? (
                   searchResults.map(res => (
                     <div key={res.id} className="flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-xl hover:border-neon-pink/30 transition-all">
                        <div className="flex items-center gap-3">
                           <img src={res.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${res.username}`} className="w-12 h-12 rounded-lg border border-white/10" />
                           <span className="font-headline font-bold text-white">{res.username}</span>
                        </div>
                        {res.friendship_status === 'accepted' ? (
                          <div className="flex items-center gap-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan px-4 py-2 rounded-lg font-label text-[10px] uppercase tracking-widest cursor-default">
                            <Check size={14} /> Connected
                          </div>
                        ) : res.friendship_status === 'pending' ? (
                          <div className="flex items-center gap-2 bg-neon-yellow/10 border border-neon-yellow text-neon-yellow px-4 py-2 rounded-lg font-label text-[10px] uppercase tracking-widest cursor-default">
                            <Loader2 size={14} className="animate-spin" /> Pending
                          </div>
                        ) : (
                          <button 
                             onClick={() => sendFriendRequest(res.id)}
                             className="flex items-center gap-2 bg-neon-pink/10 border border-neon-pink text-neon-pink px-4 py-2 rounded-lg font-label text-[10px] uppercase tracking-widest hover:bg-neon-pink hover:text-white transition-all"
                          >
                             <Plus size={14} /> Request_Uplink
                          </button>
                        )}
                     </div>
                   ))
                 ) : searchQuery && !loading ? (
                   <p className="text-center font-label text-[10px] uppercase text-white/40 py-10 tracking-[0.2em]">No entities found in grid</p>
                 ) : null}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-neon-bg/90 backdrop-blur-lg border-t border-neon-pink/30 shadow-[0_-4px_20px_rgba(255,45,120,0.15)] flex justify-around items-center h-20 px-4 pb-safe z-40">
        <button 
            onClick={() => setActiveTab('chats')} 
            className={`flex flex-col items-center justify-center transition-all ${activeTab === 'chats' ? 'text-neon-pink drop-shadow-[0_0_10px_rgba(255,45,120,0.6)] font-bold scale-110' : 'text-white/40 hover:text-white'}`}
        >
          <MessageSquare size={24} />
          <span className="font-label text-[9px] uppercase tracking-widest mt-1">Chat_LOG</span>
        </button>
        <button 
            onClick={() => setActiveTab('friends')} 
            className={`flex flex-col items-center justify-center transition-all ${activeTab === 'friends' ? 'text-neon-cyan drop-shadow-[0_0_10px_rgba(0,255,204,0.6)] font-bold scale-110' : 'text-white/40 hover:text-white'}`}
        >
          <Users size={24} />
          <span className="font-label text-[9px] uppercase tracking-widest mt-1">Network</span>
        </button>
        <button 
            onClick={() => setIsProfileOpen(true)}
            className="flex flex-col items-center justify-center text-white/40 hover:text-neon-yellow transition-all"
        >
          <UserIcon size={24} />
          <span className="font-label text-[9px] uppercase tracking-widest mt-1">Entity</span>
        </button>
      </nav>

      <ProfileModal 
         user={user} 
         isOpen={isProfileOpen} 
         onClose={() => setIsProfileOpen(false)} 
         onUpdate={onUpdateUser}
      />
    </div>
  );
}
