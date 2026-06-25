import React from 'react';
import { cn } from './Button';
import { motion } from 'motion/react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowOnHover?: boolean;
}

export function Card({ className, glowOnHover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl p-6 transition-all duration-300",
        glowOnHover && "hover:border-zinc-700 hover:shadow-[0_0_30px_rgba(217,70,239,0.1)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
