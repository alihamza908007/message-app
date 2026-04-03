import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Check, Loader2, Plus } from 'lucide-react';
import { User } from '../types';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (group: any) => void;
}

export default function GroupModal({ isOpen, onClose, onCreate }: GroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingFriends, setFetchingFriends] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    setFetchingFriends(true);
    try {
      const res = await fetch('/api/friends', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) {
      console.error('Error fetching friends for group:', err);
    } finally {
      setFetchingFriends(false);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('neon_token')}`
        },
        body: JSON.stringify({ 
          name: groupName, 
          members: selectedFriends 
        }),
      });
      if (res.ok) {
        const group = await res.json();
        onCreate({ ...group, chat_type: 'group', username: group.name });
        onClose();
        setGroupName('');
        setSelectedFriends([]);
      }
    } catch (err) {
      console.error('Error creating group:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (id: number) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neon-bg/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white/5 border border-neon-pink/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(255,45,120,0.1)] backdrop-blur-xl max-h-[80vh] flex flex-col"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-8 shrink-0">
              <h2 className="font-headline text-2xl font-bold text-white mb-1">INITIALIZE <span className="text-neon-pink neon-glow-pink">CHANNEL</span></h2>
              <p className="font-label text-[10px] uppercase tracking-widest text-white/40">Multi-user data synchronization</p>
            </div>

            <div className="space-y-6 overflow-hidden flex flex-col">
              <div className="space-y-2 shrink-0">
                <label className="font-label text-xs font-bold text-neon-pink uppercase tracking-widest">Channel Name</label>
                <div className="group relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-neon-pink transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-neon-bg border-b-2 border-white/10 focus:border-neon-pink focus:ring-0 text-white pl-12 pr-4 py-4 transition-all placeholder:text-white/20 font-body"
                    placeholder="Enter channel frequency..."
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-4 flex flex-col overflow-hidden">
                <label className="font-label text-xs font-bold text-neon-pink uppercase tracking-widest shrink-0">Select Nodes ({selectedFriends.length})</label>
                
                {fetchingFriends ? (
                  <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-neon-pink" size={24} /></div>
                ) : friends.length === 0 ? (
                  <p className="text-center py-10 font-label text-[10px] text-white/20 uppercase tracking-widest">No active connections found</p>
                ) : (
                  <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {friends.map(friend => (
                      <button
                        key={friend.id}
                        onClick={() => toggleFriend(friend.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${selectedFriends.includes(friend.id) ? 'bg-neon-pink/10 border-neon-pink shadow-[inset_0_0_10px_rgba(255,45,120,0.1)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                            <img src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} alt={friend.username} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-body text-sm text-white">{friend.username}</span>
                        </div>
                        {selectedFriends.includes(friend.id) && <Check size={16} className="text-neon-pink" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-4 shrink-0">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 font-label text-[10px] uppercase tracking-widest text-white/40 border border-white/10 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading || !groupName.trim() || selectedFriends.length === 0}
                  className="flex-1 py-4 bg-neon-pink/10 border border-neon-pink text-neon-pink font-headline font-bold uppercase tracking-widest hover:bg-neon-pink hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Bootstrap Channel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
