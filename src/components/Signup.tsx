import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { User as UserIcon, AtSign, Mail, Lock, ArrowRight, Info, ChevronLeft } from 'lucide-react';
import { User } from '../types';

interface SignupProps {
  onLogin: (user: User, token: string) => void;
}

export default function Signup({ onLogin }: SignupProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-24">
      <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="hidden lg:flex flex-col space-y-8 relative">
          <div className="relative z-10">
            <h1 className="font-headline text-6xl font-extrabold leading-tight tracking-tighter">
              JOIN THE <span className="text-neon-pink neon-glow-pink">PULSE</span> OF THE CITY.
            </h1>
            <p className="mt-6 text-white/60 text-xl max-w-md leading-relaxed">
              Encryption meets aesthetics. Secure your identity in the neon-lit corridors of next-gen communication.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 border border-neon-pink/20 p-6 rounded-xl">
              <Lock className="text-neon-pink mb-4" />
              <h3 className="font-headline font-bold text-lg mb-2">END-TO-END</h3>
              <p className="text-sm text-white/60">Military grade encryption protocols for every message packet.</p>
            </div>
            <div className="bg-white/5 border border-neon-cyan/20 p-6 rounded-xl">
              <Mail className="text-neon-cyan mb-4" />
              <h3 className="font-headline font-bold text-lg mb-2">SQL CLOUD</h3>
              <p className="text-sm text-white/60">Your data is securely indexed on high-performance PostgreSQL tiers.</p>
            </div>
          </div>
        </div>

        <div className="relative w-full max-w-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-neon-pink/30 rounded-xl p-8 shadow-2xl"
          >
            <div className="mb-8">
              <h2 className="font-headline text-3xl font-bold text-white mb-2">Initialize Profile</h2>
              <p className="font-label text-xs uppercase tracking-widest text-white/60">Create unique identifier for the network</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-neon-pink uppercase tracking-widest flex justify-between">
                  Username
                  <span className="text-white/20 font-normal">REQUIRED</span>
                </label>
                <div className="group relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-neon-cyan transition-colors" size={18} />
                  <input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-neon-bg border-0 border-b-2 border-white/10 focus:border-neon-cyan focus:ring-0 text-white pl-12 pr-4 py-4 rounded-t-lg transition-all placeholder:text-white/20 font-body"
                    placeholder="CYBER_GHOST_99"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-neon-pink uppercase tracking-widest">Email Address</label>
                <div className="group relative">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-neon-cyan transition-colors" size={18} />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neon-bg border-0 border-b-2 border-white/10 focus:border-neon-cyan focus:ring-0 text-white pl-12 pr-4 py-4 rounded-t-lg transition-all placeholder:text-white/20 font-body"
                    placeholder="neural@uplink.io"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-label text-xs font-bold text-neon-pink uppercase tracking-widest flex justify-between">
                  Password
                  <span className="text-neon-yellow neon-glow-yellow font-bold">SECURE</span>
                </label>
                <div className="group relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-neon-cyan transition-colors" size={18} />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neon-bg border-0 border-b-2 border-white/10 focus:border-neon-cyan focus:ring-0 text-white pl-12 pr-4 py-4 rounded-t-lg transition-all placeholder:text-white/20 font-body"
                    placeholder="••••••••••••"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-neon-pink text-xs font-label uppercase">{error}</p>}

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full group bg-white/5 border border-neon-pink/50 text-white py-4 rounded-lg font-headline font-bold tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-neon-pink hover:text-white transition-all duration-300"
                >
                  Create Account
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3">
              <Info className="text-neon-cyan text-sm shrink-0" size={16} />
              <p className="text-[11px] text-white/60 leading-relaxed">
                Data integrity verified. Your profile and message hashes are securely stored on a high-availability <span className="text-neon-cyan font-bold">free PostgreSQL tier</span>, optimized for low-latency neural retrieval.
              </p>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <Link to="/login" className="text-white/60 hover:text-white transition-colors text-xs font-label uppercase tracking-widest flex items-center gap-2 group">
                <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={14} />
                Back to Login
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
