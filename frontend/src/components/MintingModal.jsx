import React, { useEffect, useState } from "react";
import { Fingerprint, Sparkles, Check } from "lucide-react";

/**
 * Cinematic "Minting DNA" modal shown while a flip is being committed.
 * Runs an animated 5-stage sequence before invoking onComplete().
 */
export default function MintingModal({ parentTrack, newTitle, newGenre, child, onComplete }) {
  const [stage, setStage] = useState(0);
  const stages = [
    { label: "Isolating parent stems",       glyph: "◈" },
    { label: "Routing cultural matrix",      glyph: "◉" },
    { label: "Cryptographic DNA forge",      glyph: "⟡" },
    { label: "Pinning to Empire 1 Ledger",   glyph: "◇" },
    { label: "Soulfire confirmed",           glyph: "✓" },
  ];

  useEffect(() => {
    // advance through stages, then complete once child is present + final stage shown
    const id = setInterval(() => {
      setStage((s) => {
        if (s >= stages.length - 1) { clearInterval(id); return s; }
        return s + 1;
      });
    }, 620);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (stage === stages.length - 1 && child) {
      const t = setTimeout(() => onComplete?.(child), 900);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line
  }, [stage, child]);

  const done = stage === stages.length - 1 && !!child;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" data-testid="minting-modal">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm"/>
      {/* radial glow */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background:
             "radial-gradient(500px 500px at 50% 50%, rgba(245,165,36,0.18), transparent 70%)," +
             "radial-gradient(700px 700px at 30% 70%, rgba(255,94,172,0.12), transparent 70%)," +
             "radial-gradient(600px 600px at 70% 30%, rgba(106,140,255,0.10), transparent 70%)" }}/>
      {/* rotating glyph ring */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[520px] h-[520px] max-w-[90vw] max-h-[90vw] rounded-full border border-[#F5C542]/25 animate-orbit relative">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[#F5C542] text-xl">◈</div>
          <div className="absolute top-1/2 -right-2 -translate-y-1/2 text-[#FF2EBE] text-xl">◉</div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[#00E6FF] text-xl">⟡</div>
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 text-[#00E6FF] text-xl">◇</div>
        </div>
      </div>

      <div className="relative panel rounded-[6px] p-8 md:p-10 w-full max-w-xl text-center">
        <div className="mx-auto w-20 h-20 rounded-full relative flex items-center justify-center mb-5 animate-breathe"
             style={{
               background: "radial-gradient(circle at 40% 35%, #ffcf7a 0%, #F5C542 40%, #6a3a05 80%, #110802 100%)",
               boxShadow: "0 0 60px rgba(245,165,36,0.7), inset 0 2px 10px rgba(255,230,180,0.5), inset 0 -12px 20px rgba(0,0,0,0.9)",
             }}>
          {done ? <Check size={28} className="text-[#05060D]" strokeWidth={3}/> : <Fingerprint size={28} className="text-[#05060D]"/>}
        </div>

        <div className="etched text-[#FF2EBE] mb-1">{done ? "DNA Minted" : "Minting DNA"}</div>
        <h3 className="font-display text-[24px] md:text-[30px] text-[#F5F7FA] tracking-tight leading-[1.1]">
          {newTitle}
        </h3>
        <p className="font-serif italic text-[13px] text-[#9CA3B0] mt-2">
          Flipped from "{parentTrack?.title}" → <span className="text-[#F5C542]">{newGenre}</span>
        </p>

        <div className="mt-6 space-y-2 text-left max-w-sm mx-auto">
          {stages.map((s, i) => {
            const active = stage === i;
            const complete = stage > i || (i === stages.length - 1 && done);
            return (
              <div key={s.label} className="flex items-center gap-3 font-mono text-[12px]">
                <span className="w-5 text-center"
                      style={{ color: complete ? "#00E6FF" : active ? "#F5C542" : "#6B7280" }}>
                  {complete ? "✓" : active ? s.glyph : "◇"}
                </span>
                <span style={{ color: complete ? "#C8CCD8" : active ? "#F5F7FA" : "#6B7280" }}>
                  {s.label}
                </span>
                {active && !complete && (
                  <span className="ml-auto text-[10px] text-[#F5C542] animate-pulse">processing…</span>
                )}
              </div>
            );
          })}
        </div>

        {done && child && (
          <div className="mt-6 pt-5 border-t border-[#0E0F17]">
            <div className="etched text-[#9CA3B0] mb-2">Child DNA · SynthID</div>
            <div className="font-mono text-[13px] text-[#F5C542] break-all bg-[#0E0F17] px-3 py-2 rounded-[3px] border border-[#F5C542]/30">
              {child.dna_tag}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
