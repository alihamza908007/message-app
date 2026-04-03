import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
}

export default function AudioPlayer({ src }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setIsPlaying(false);
      audio.currentTime = 0;
    };

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('durationchange', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onEnded);

    // Chrome/Webkit workaround for calculating raw Blob duration
    if (audio.duration === Infinity || isNaN(audio.duration)) {
        audio.currentTime = 1e101; 
        audio.ontimeupdate = () => {
            audio.ontimeupdate = null;
            setDuration(audio.duration);
            audio.currentTime = 0;
        };
    }

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('durationchange', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
          playPromise.catch(error => {
              console.error("Playback failed:", error);
              setIsPlaying(false);
          });
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 w-[220px] pt-1">
      <button 
        onClick={togglePlayPause} 
        className="w-10 h-10 shrink-0 flex items-center justify-center bg-neon-cyan text-neon-bg rounded-full shadow-[0_0_10px_rgba(0,255,204,0.4)] hover:bg-white transition-colors"
      >
        {isPlaying ? <Pause fill="currentColor" size={16} /> : <Play fill="currentColor" size={16} className="ml-1" />}
      </button>
      
      <div className="flex flex-col grow">
        <input 
          type="range" 
          min={0} 
          max={duration || 100} 
          value={currentTime} 
          onChange={handleSeek}
          className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer outline-none overflow-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
        />
        <div className="flex justify-between mt-1 px-0.5">
          <span className="text-[9px] text-white/50 font-label tracking-widest">{formatTime(currentTime)}</span>
          <span className="text-[9px] text-white/50 font-label tracking-widest">{formatTime(duration)}</span>
        </div>
      </div>
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
