import React from "react";

/**
 * Touch-friendly vertical channel strip fader.
 * Amber tube, animated VU, large invisible hit area for mobile pointer events.
 */
export default function Fader({ label, value, onChange, peak = 0.6, color = "#f5a524", testId }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 w-[66px] md:w-[96px]" data-testid={testId}>
      <div className="etched text-[#c9bfae] text-center leading-tight h-[32px] text-[8px] md:text-[10px] px-0.5">
        {label}
      </div>

      <div className="relative h-[200px] md:h-[260px] w-[52px] md:w-[64px] panel rounded-[6px] flex items-center justify-center overflow-hidden touch-none select-none">
        <div className="hidden md:flex absolute inset-y-2 left-2 flex-col justify-between text-[8px] text-[#5a5246] font-mono">
          {["+6","0","-6","-12","-24","-∞"].map(t => <span key={t}>{t}</span>)}
        </div>
        {/* VU bar */}
        <div className="absolute right-2 md:right-3 bottom-2 w-[5px] md:w-[6px] h-[92%] bg-[#0d0d10] rounded-sm overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 transition-[height] duration-100"
            style={{
              height: `${Math.min(100, peak * 100 * value)}%`,
              background: `linear-gradient(0deg, ${color} 0%, #ff5eac 70%, #59d3ff 100%)`,
              boxShadow: `0 0 10px ${color}`,
            }}
          />
        </div>
        {/* fader slot */}
        <div className="absolute inset-y-4 w-[2.5px] md:w-[3px] bg-[#2a2a30]" />
        {/* thumb (visual) */}
        <div
          className="absolute w-[38px] md:w-[42px] h-[22px] rounded-[3px] left-1/2 -translate-x-1/2 pointer-events-none transition-[bottom] duration-75"
          style={{
            bottom: `calc(${pct}% - 11px)`,
            background: "linear-gradient(180deg, #f5a524 0%, #b77a18 48%, #3a2208 100%)",
            border: "1px solid #1a1a1a",
            boxShadow: "0 0 14px rgba(245,165,36,0.6), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -6px 8px rgba(0,0,0,0.55)",
          }}
        />
        {/* large invisible range input — handles touch + pointer; vertical orientation */}
        <input
          type="range" min={0} max={100} step={1}
          value={pct}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize touch-none"
          style={{
            writingMode: "vertical-lr",
            direction: "rtl",
            WebkitAppearance: "slider-vertical",
          }}
          data-testid={`${testId}-input`}
          aria-label={label}
        />
      </div>

      <div className="font-mono text-[10px] md:text-[11px] text-[#e8c789] tabular-nums">{pct}%</div>
    </div>
  );
}
