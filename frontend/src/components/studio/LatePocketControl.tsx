import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3 } from 'lucide-react';

interface LatePocketControlProps {
  onSwingChange?: (ms: number) => void;
  initialMs?: number;
}

export default function LatePocketControl({ onSwingChange, initialMs = 12 }: LatePocketControlProps) {
  const [swingMs, setSwingMs] = useState<number>(initialMs);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSwingMs(val);
    onSwingChange?.(val);
  };

  // Map 10-15ms to a descriptive feel
  const feel =
    swingMs <= 10 ? 'Tight Pocket'
    : swingMs <= 12 ? 'Late Feel'
    : swingMs <= 13 ? 'Cruising Lag'
    : swingMs <= 14 ? 'Dilla Drag'
    : 'Lazy Pocket';

  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <Clock3 className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Late-Pocket Control</h3>
          <p className="text-xs text-slate-400">Snare drag — human groove offset</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-300 font-medium">Swing Delay</span>
          <div className="flex items-center gap-2">
            <motion.span
              key={swingMs}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-amber-400 font-mono text-sm font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20"
            >
              {swingMs}ms
            </motion.span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{feel}</span>
          </div>
        </div>

        <input
          type="range"
          min={10}
          max={15}
          step={1}
          value={swingMs}
          onChange={handleChange}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-neutral-800"
        />

        <div className="flex justify-between text-[10px] text-slate-600 font-mono">
          <span>10ms</span>
          <span>12ms</span>
          <span>15ms</span>
        </div>
      </div>
    </div>
  );
}
