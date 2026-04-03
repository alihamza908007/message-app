import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MessageSquare, LogIn, HelpCircle, Fingerprint, Key, Cloud } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center justify-center p-4 mb-6 rounded-xl border border-neon-pink/30 bg-white/5 shadow-[inset_0_0_12px_rgba(255,45,120,0.1)]">
          <MessageSquare className="text-neon-pink w-12 h-12" />
        </div>
        <h1 className="font-headline font-black text-6xl md:text-8xl tracking-tighter text-neon-pink neon-glow-pink mb-4">
          NEON_CHAT
        </h1>
        <p className="font-label text-neon-cyan uppercase tracking-[0.3em] text-sm md:text-base neon-glow-cyan">
          Encrypted. Electric. Evolution.
        </p>
      </motion.div>

      <div className="w-full max-w-md grid grid-cols-1 gap-4">
        <Link to="/signup" className="group relative w-full py-5 rounded-lg border border-neon-pink/50 bg-transparent overflow-hidden transition-all duration-300 hover:shadow-[0_0_24px_rgba(255,45,120,0.3)] active:scale-95 text-center">
          <span className="relative font-headline font-bold text-xl text-neon-pink neon-glow-pink uppercase tracking-widest">
            Get Started
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-4">
          <Link to="/login" className="flex flex-col items-center justify-center p-6 rounded-lg border border-white/10 bg-white/5 hover:border-neon-cyan/50 hover:bg-white/10 transition-all group">
            <LogIn className="text-white/60 group-hover:text-neon-cyan group-hover:drop-shadow-[0_0_8px_rgba(0,255,204,0.6)] mb-2 transition-all" />
            <span className="font-label text-xs uppercase tracking-wider text-white/60 group-hover:text-white">Login</span>
          </Link>
          <button className="flex flex-col items-center justify-center p-6 rounded-lg border border-white/10 bg-white/5 hover:border-neon-yellow/50 hover:bg-white/10 transition-all group">
            <HelpCircle className="text-white/60 group-hover:text-neon-yellow group-hover:drop-shadow-[0_0_8px_rgba(255,224,74,0.6)] mb-2 transition-all" />
            <span className="font-label text-xs uppercase tracking-wider text-white/60 group-hover:text-white">Support</span>
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center">
          <span className="font-label text-[10px] text-white/40 uppercase tracking-widest mb-4">Securely Connect With</span>
          <div className="flex gap-6 opacity-40">
            <Fingerprint className="hover:text-neon-cyan transition-colors cursor-pointer" size={20} />
            <Key className="hover:text-neon-cyan transition-colors cursor-pointer" size={20} />
            <Cloud className="hover:text-neon-cyan transition-colors cursor-pointer" size={20} />
          </div>
        </div>
      </div>

      <footer className="absolute bottom-0 w-full p-8 flex flex-col md:flex-row justify-between items-center gap-4 opacity-60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-cyan shadow-[0_0_8px_#00ffcc]"></div>
          <span className="font-label text-[10px] text-white uppercase tracking-widest">Network Status: Optimized</span>
        </div>
        <div className="flex gap-8">
          <span className="font-label text-[10px] text-white uppercase tracking-widest hover:text-neon-cyan transition-colors cursor-pointer">Privacy_Protocol</span>
          <span className="font-label text-[10px] text-white uppercase tracking-widest hover:text-neon-cyan transition-colors cursor-pointer">Terms_Of_Pulse</span>
        </div>
      </footer>
    </div>
  );
}
