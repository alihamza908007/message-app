import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, Shield, ShieldAlert, ArrowLeft } from 'lucide-react';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: {
    id: number;
    username: string;
    avatar_url: string;
    members: {
        id: number;
        username: string;
        avatar_url: string;
        status: string;
        role: string;
    }[];
    role: string;
  };
  onLeave: () => void;
  onRefresh: () => void;
}

export default function GroupInfoModal({ isOpen, onClose, group, onLeave, onRefresh }: GroupInfoModalProps) {
  const [isTransferring, setIsTransferring] = React.useState(false);

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to forcibly terminate this node\'s connection?')) return;
    try {
      const res = await fetch(`/api/groups/${group.id}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` }
      });
      if (res.ok) onRefresh();
    } catch (err) { console.error(err); }
  };

  const handleTransferOwnership = async (newAdminId: number) => {
    try {
      const res = await fetch(`/api/groups/${group.id}/members/${newAdminId}/role`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('neon_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'admin' })
      });
      if (res.ok) {
        // After transferring, leave the group
        const leaveRes = await fetch(`/api/groups/${group.id}/decline`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` }
        });
        if (leaveRes.ok) {
            onLeave();
            onClose();
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleLeaveClick = async () => {
    if (group.role === 'admin' && group.members.filter(m => m.status === 'accepted').length > 1) {
      setIsTransferring(true);
      return;
    }
    
    if (!confirm('Are you sure you want to terminate this synchronization? You will lose access to this channel immediately.')) return;
    try {
      const res = await fetch(`/api/groups/${group.id}/decline`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('neon_token')}` }
      });
      if (res.ok) {
        onLeave();
        onClose();
      }
    } catch (err) {
      console.error('Error leaving group:', err);
    }
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
            className="absolute inset-0 bg-neon-bg/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white/5 border border-neon-pink/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(255,45,120,0.15)] flex flex-col max-h-[85vh] overflow-hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center mb-8 shrink-0">
               <div className="w-24 h-24 rounded-2xl border-2 border-neon-pink shadow-[0_0_30px_rgba(255,45,120,0.3)] overflow-hidden mb-4 p-1">
                  <div className="w-full h-full rounded-xl overflow-hidden">
                    <img 
                        src={group.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${group.username}`} 
                        alt={group.username} 
                        className="w-full h-full object-cover" 
                    />
                  </div>
               </div>
               <h2 className="font-headline text-2xl font-black text-white tracking-widest uppercase text-center">{group.username}</h2>
               <p className="font-label text-[10px] text-neon-pink uppercase tracking-[0.3em] mt-1 text-center">Multi-User Frequency</p>
            </div>

            <div className="flex flex-col overflow-hidden mb-8 grow">
              {isTransferring ? (
                <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setIsTransferring(false)} className="text-neon-pink hover:text-white transition-colors">
                      <ArrowLeft size={16} />
                    </button>
                    <span className="font-label text-[10px] text-white/60 uppercase tracking-[0.2em]">Select New Admin</span>
                  </div>
                  <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {group.members.filter(m => m.role !== 'admin' && m.status === 'accepted').map(member => (
                       <button 
                        key={member.id} 
                        onClick={() => handleTransferOwnership(member.id)}
                        className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all text-left"
                       >
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                                <img src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} alt={member.username} className="w-full h-full object-cover" />
                             </div>
                             <span className="font-body text-sm text-white">{member.username}</span>
                          </div>
                       </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4 px-2 shrink-0">
                    <span className="font-label text-[10px] text-white/40 uppercase tracking-[0.2em]">Connected_Entities</span>
                    <span className="font-label text-[10px] text-neon-cyan tracking-widest">{group.members.length} NODES</span>
                  </div>
                  <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {group.members.map(member => (
                       <div key={member.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 group-hover:border-neon-cyan/50 transition-colors">
                                <img src={member.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`} alt={member.username} className="w-full h-full object-cover" />
                             </div>
                             <div className="flex flex-col">
                                <span className="font-body text-sm text-white group-hover:text-neon-cyan transition-colors">
                                  {member.role === 'admin' ? (
                                    <span className="flex items-center gap-2">
                                      <span className="text-neon-pink font-label text-[10px] tracking-widest bg-neon-pink/10 px-1.5 py-0.5 rounded border border-neon-pink/20">ADMIN</span>
                                      {member.username}
                                    </span>
                                  ) : member.username}
                                </span>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {group.role === 'admin' && member.role !== 'admin' && (
                              <button 
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-1.5 text-white/20 hover:text-neon-pink hover:bg-neon-pink/10 rounded transition-all transform hover:scale-110"
                                title="Terminate Node"
                              >
                                <X size={14} />
                              </button>
                            )}
                            {member.status === 'accepted' ? (
                              <div className="flex items-center gap-1.5 text-neon-cyan/40 text-[8px] font-label uppercase tracking-widest">
                                  <Shield size={12} />
                                  <span>Active</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-neon-yellow/40 text-[8px] font-label uppercase tracking-widest">
                                  <ShieldAlert size={12} className="animate-pulse" />
                                  <span>Pending</span>
                              </div>
                            )}
                          </div>
                       </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={handleLeaveClick}
              className="w-full py-4 bg-neon-pink/10 border border-neon-pink/50 text-neon-pink font-headline font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-neon-pink hover:text-white transition-all flex items-center justify-center gap-3 group shrink-0 shadow-[0_0_15px_rgba(255,45,120,0.1)]"
            >
              <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
              Terminate Link
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
