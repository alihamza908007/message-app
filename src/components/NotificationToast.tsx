import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare } from 'lucide-react';

interface NotificationToastProps {
  notification: {
    id: string;
    senderName: string;
    senderAvatar: string;
    content: string;
    type: string;
  } | null;
  onClose: () => void;
  onClick: () => void;
}

export default function NotificationToast({ notification, onClose, onClick }: NotificationToastProps) {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-100 w-full max-w-[340px] bg-neon-bg/60 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(0,255,204,0.1)] cursor-pointer overflow-hidden group"
          onClick={onClick}
        >
          {/* Animated Background Pulse */}
          <div className="absolute inset-0 bg-linear-to-r from-neon-cyan/5 to-neon-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative flex items-center gap-4">
             <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <img 
                      src={notification.senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.senderName}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                    />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-neon-cyan text-neon-bg p-1 rounded-lg shadow-lg border border-neon-bg">
                    <MessageSquare size={10} />
                </div>
             </div>
             
             <div className="grow overflow-hidden">
                <div className="flex justify-between items-start mb-0.5">
                   <p className="font-headline text-[10px] font-black text-white/90 tracking-[0.2em] uppercase truncate">{notification.senderName}</p>
                   <span className="font-label text-[8px] text-white/30 uppercase tracking-widest mt-0.5">Just Now</span>
                </div>
                <p className="font-body text-xs text-white/60 truncate leading-relaxed">
                    {notification.type === 'text' ? notification.content : `Uploaded a ${notification.type} pulse...`}
                </p>
             </div>
             
             <button 
               onClick={(e) => { e.stopPropagation(); onClose(); }} 
               className="text-white/20 hover:text-neon-pink p-1 transition-colors shrink-0"
             >
                <X size={16} />
             </button>
          </div>
          
          {/* Glowing bottom line */}
          <div className="absolute bottom-0 left-0 h-[1.5px] bg-linear-to-r from-transparent via-neon-cyan to-transparent w-full opacity-30 shadow-[0_0_8px_rgba(0,255,204,0.5)]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
