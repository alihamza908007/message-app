import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, User as UserIcon, Save, Loader2 } from 'lucide-react';
import { User } from '../types';

interface ProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (user: User) => void;
}

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon1',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon2',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon3',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon4',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon5',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon6',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon7',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon8',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon9',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon10',
];

export default function ProfileModal({ user, isOpen, onClose, onUpdate }: ProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar_url || AVATAR_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('neon_token')}`
        },
        body: JSON.stringify({ username, avatar_url: selectedAvatar }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdate(data);
        onClose();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
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
            className="absolute inset-0 bg-neon-bg/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white/5 border border-neon-cyan/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,255,204,0.1)] backdrop-blur-xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-8 ">
              <h2 className="font-headline text-2xl font-bold text-white mb-1">EDIT <span className="text-neon-cyan neon-glow-cyan">IDENTITY</span></h2>
              <p className="font-label text-[10px] uppercase tracking-widest text-white/40">Modify network presence</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-neon-cyan uppercase tracking-widest">Username</label>
                <div className="group relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-neon-cyan transition-colors" size={18} />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-neon-bg border-b-2 border-white/10 focus:border-neon-cyan focus:ring-0 text-white pl-12 pr-4 py-4 transition-all placeholder:text-white/20 font-body"
                    placeholder="New handle..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="font-label text-xs font-bold text-neon-cyan uppercase tracking-widest">Avatar Signature</label>
                <div className="grid grid-cols-5 gap-3">
                  {AVATAR_OPTIONS.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedAvatar(url)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedAvatar === url ? 'border-neon-cyan shadow-[0_0_12px_rgba(0,255,204,0.4)] scale-110' : 'border-white/10 grayscale hover:grayscale-0'}`}
                    >
                      <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                      {selectedAvatar === url && (
                        <div className="absolute inset-0 bg-neon-cyan/20 flex items-center justify-center">
                          <Check size={16} className="text-neon-cyan" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-neon-pink text-xs font-label uppercase">{error}</p>}

              <div className="pt-4 flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 font-label text-[10px] uppercase tracking-widest text-white/40 border border-white/10 hover:bg-white/5 transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-4 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-headline font-bold uppercase tracking-widest hover:bg-neon-cyan hover:text-neon-bg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Save Uplink
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
