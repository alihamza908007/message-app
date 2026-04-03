import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { AtSign, Lock, Eye, EyeOff, Fingerprint, QrCode, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user, data.token);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 pt-24">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-xl border border-neon-pink/30 rounded-xl p-8 shadow-[0_0_40px_rgba(255,45,120,0.1)]"
        >
          <div className="mb-10 space-y-2">
            <h1 className="font-headline text-4xl font-extrabold tracking-tighter text-white">
              ACCESS <span className="text-neon-pink neon-glow-pink">PORTAL</span>
            </h1>
            <p className="font-label text-xs uppercase tracking-widest text-white/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></span> 
              Secure Connection Established
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="font-label text-[10px] uppercase tracking-widest text-neon-cyan font-bold neon-glow-cyan">Email_Address</label>
              <div className="relative group">
                <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-neon-cyan transition-colors" size={18} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border-b border-white/10 focus:border-neon-cyan focus:ring-0 text-white placeholder:text-white/20 font-body py-4 pl-12 pr-4 transition-all outline-none"
                  placeholder="USER@NEON_NETWORK.NET"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="font-label text-[10px] uppercase tracking-widest text-neon-cyan font-bold neon-glow-cyan">Access_Code</label>
                <button type="button" className="font-label text-[9px] uppercase tracking-widest text-white/40 hover:text-neon-pink transition-colors">Forgot_Key?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-neon-cyan transition-colors" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border-b border-white/10 focus:border-neon-cyan focus:ring-0 text-white placeholder:text-white/20 font-body py-4 pl-12 pr-12 transition-all outline-none"
                  placeholder="••••••••••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-neon-cyan"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-neon-pink text-xs font-label uppercase">{error}</p>}

            <div className="pt-4 space-y-4">
              <button 
                type="submit"
                className="group relative w-full overflow-hidden bg-neon-bg border border-neon-pink/50 py-4 font-headline font-bold text-neon-pink uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_24px_rgba(255,45,120,0.4)] active:scale-95"
              >
                <span className="relative z-10 neon-glow-pink">Initialize Session</span>
                <div className="absolute inset-0 bg-neon-pink/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-[1px] flex-grow bg-white/10"></div>
                <span className="font-label text-[10px] text-white/40 uppercase tracking-widest">or</span>
                <div className="h-[1px] flex-grow bg-white/10"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-2 border border-white/10 py-3 px-4 font-label text-[10px] uppercase tracking-widest hover:bg-white/5 transition-colors">
                  <Fingerprint size={14} /> Biometric
                </button>
                <button type="button" className="flex items-center justify-center gap-2 border border-white/10 py-3 px-4 font-label text-[10px] uppercase tracking-widest hover:bg-white/5 transition-colors">
                  <QrCode size={14} /> Terminal
                </button>
              </div>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="font-body text-xs text-white/60">
              New entity? 
              <Link to="/signup" className="text-neon-cyan font-bold hover:underline underline-offset-4 decoration-neon-cyan/30 neon-glow-cyan ml-1 transition-all">Request Uplink</Link>
            </p>
          </div>
        </motion.div>

        <div className="mt-8 grid grid-cols-3 gap-2">
          <div className="bg-white/5 p-3 border-l border-neon-pink/30">
            <div className="font-label text-[8px] uppercase text-white/40 mb-1">Latency</div>
            <div className="font-headline text-xs font-bold text-white">12MS</div>
          </div>
          <div className="bg-white/5 p-3 border-l border-neon-cyan/30">
            <div className="font-label text-[8px] uppercase text-white/40 mb-1">Encrypted</div>
            <div className="font-headline text-xs font-bold text-white">AES-256</div>
          </div>
          <div className="bg-white/5 p-3 border-l border-neon-yellow/30">
            <div className="font-label text-[8px] uppercase text-white/40 mb-1">Nodes</div>
            <div className="font-headline text-xs font-bold text-white">ACTIVE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
