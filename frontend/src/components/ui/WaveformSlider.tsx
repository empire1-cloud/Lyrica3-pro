import React from 'react';
import { cn } from './Button';
import { motion } from 'motion/react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color?: 'cyan' | 'magenta' | 'purple' | 'fuchsia';
}

export function WaveformSlider({ label, value, onChange, color = 'cyan' }: SliderProps) {
  const bars = 24;
  const randomOffsets = React.useMemo(() => Array.from({ length: bars }, () => Math.random() * 10), [bars]);
  
  const colorMap = {
    cyan: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]',
    magenta: 'bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]',
    purple: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]',
    fuchsia: 'bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.8)]',
  };

  const mutedMap: Record<string, string> = {
    cyan: 'bg-zinc-800',
    magenta: 'bg-zinc-800',
    purple: 'bg-zinc-800',
    fuchsia: 'bg-zinc-800',
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs text-zinc-400 font-medium tracking-wider uppercase">
        <span>{label}</span>
        <span className="text-zinc-500">{value}%</span>
      </div>
      
      <div 
        className="relative h-12 flex items-center justify-between cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
          onChange(Math.round(percent));
        }}
      >
        {Array.from({ length: bars }).map((_, i) => {
          const percent = (i / (bars - 1)) * 100;
          const isActive = percent <= value;
          const height = 20 + Math.sin(i * 0.5) * 15 + randomOffsets[i];
          
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{
                height: `${height}%`,
                opacity: isActive ? 1 : 0.3
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "w-1 rounded-full transition-colors",
                isActive ? colorMap[color] : mutedMap[color]
              )}
            />
          );
        })}
        
        {/* Playhead / Dragger visual */}
        <motion.div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-full bg-white/10 border border-white/30 rounded backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.2)] pointer-events-none"
          animate={{ left: `calc(${value}% - 8px)` }}
          transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
        />
      </div>
    </div>
  );
}
