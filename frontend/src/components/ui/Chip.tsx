import React from 'react';
import { cn } from './Button';
import { motion } from 'motion/react';

interface ChipProps {
  active?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

export function Chip({ active, children, className, onClick, disabled }: ChipProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "px-4 py-2 rounded-full text-xs font-medium border transition-colors",
        active 
          ? "bg-zinc-100 text-zinc-900 border-zinc-100 shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
          : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}
