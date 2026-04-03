import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { User } from '../types';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  currentMembers: number[];
  onInviteSuccess: () => void;
}

export default function InviteModal({ isOpen, onClose, groupId, currentMembers, onInviteSuccess }: InviteModalProps) {
  const [friends, setFriends] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      setSelectedIds([]);
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/friends', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out those already in the group
        setFriends(data.filter((f: User) => !currentMembers.includes(f.id)));
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (selectedIds.length === 0) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('neon_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userIds: selectedIds })
      });
      if (res.ok) {
        onInviteSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error inviting:', err);
    } finally {
      setInviting(false);
    }
  };

  const filtered = friends.filter(f => f.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neon-bg/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white/5 border border-neon-cyan/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,255,204,0.15)] flex flex-col max-h-[80vh] overflow-hidden"
          >
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="font-headline text-xl font-black text-white tracking-widest uppercase">Invite Nodes</h2>
              <button
                onClick={onClose}
                className="p-2 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input
                type="text"
                placeholder="Search Network..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-neon-cyan shadow-[inset_0_0_10px_rgba(255,255,255,0.02)] transition-colors"
              />
            </div>

            <div className="grow overflow-y-auto space-y-2 pr-1 custom-scrollbar mb-6">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="text-neon-cyan animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center py-10 font-label text-[10px] text-white/20 uppercase tracking-[0.2em] leading-loose px-4">
                  No compatible entities <br /> detected in network.
                </p>
              ) : (
                filtered.map(f => {
                  const isSelected = selectedIds.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedIds(prev => isSelected ? prev.filter(id => id !== f.id) : [...prev, f.id])}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 group ${isSelected ? 'bg-neon-cyan/10 border-neon-cyan shadow-[0_0_15px_rgba(0,255,204,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/8'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg border border-white/10 overflow-hidden">
                          <img src={f.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`} alt={f.username} className="w-full h-full object-cover" />
                        </div>
                        <span className={`font-body text-sm transition-colors ${isSelected ? 'text-neon-cyan' : 'text-white'}`}>{f.username}</span>
                      </div>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all duration-300 ${isSelected ? 'bg-neon-cyan border-neon-cyan text-neon-bg scale-110' : 'border-white/20 group-hover:border-white/40'}`}>
                        {isSelected && <Check size={12} />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <button
              onClick={handleInvite}
              disabled={selectedIds.length === 0 || inviting}
              className="w-full py-4 bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan font-headline font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-neon-cyan hover:text-neon-bg transition-all disabled:opacity-20 disabled:pointer-events-none flex items-center justify-center gap-3 group shrink-0 shadow-[0_0_20px_rgba(0,255,204,0.1)]"
            >
              {inviting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
              )}
              Initialize Link {selectedIds.length > 0 && `(${selectedIds.length})`}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
