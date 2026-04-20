import React, { useEffect, useState } from "react";
import { getTracks, getWallet } from "../lib/api";
import { useAuth } from "../lib/auth";
import StemMixer from "../components/StemMixer";
import { Activity, Fingerprint, Zap, Wind, Heart } from "lucide-react";

const Dial = ({ label, value, unit = "", color = "#f5a524", testId }) => {
  const pct = Math.min(100, Math.max(0, value * 100));
  const circ = 2 * Math.PI * 34;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex items-center gap-4" data-testid={testId}>
      <div className="relative w-[80px] h-[80px]">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r="34" stroke="#1a1a20" strokeWidth="5" fill="none"/>
          <circle cx="40" cy="40" r="34" stroke={color} strokeWidth="5" fill="none"
                  strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
                  style={{ filter: `drop-shadow(0 0 6px ${color})` }}/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[13px] text-[#f3ece1] tabular-nums">
          {value.toFixed(2)}{unit}
        </div>
      </div>
      <div className="flex-1">
        <div className="etched text-[#8a8278]">{label}</div>
        <div className="text-[11px] font-mono text-[#c9bfae] mt-1">
          <span className="text-[#59d3ff]">■</span> live telemetry
        </div>
      </div>
    </div>
  );
};

export default function StemDeck() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [active, setActive] = useState(null);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    getTracks().then(ts => { setTracks(ts); setActive(ts[0]); });
    getWallet().then(setWallet).catch(() => {});
  }, []);

  if (!active) {
    return <div className="p-12 text-[#8a8278] font-mono">Priming Empire 1 Ledger…</div>;
  }

  const b = active.biometrics;
  const setStems = (stems) => setActive({ ...active, stems });

  return (
    <div className="min-h-screen p-8 lg:p-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="etched text-[#8a8278]">// CONSOLE</div>
          <h2 className="font-display text-[40px] text-[#f3ece1] tracking-tight leading-[1.05] mt-1">
            Sonance Pro <span className="text-[#f5a524]">Stem Deck</span>
          </h2>
          <p className="font-serif italic text-[#8a8278] mt-2 text-[14px]">
            Elite-mode SSL console · analog warmth · cyberpunk ledger sync
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="tube-glow w-3 h-3 rounded-full animate-breathe"/>
          <div className="text-right">
            <div className="etched text-[#c9bfae]">Wallet · Sovereign</div>
            <div className="font-mono text-[13px] text-[#ffd88a] mt-1">
              ${wallet?.balance_usd?.toFixed(4) ?? "0.0000"}
            </div>
          </div>
        </div>
      </div>

      {/* Track selector ribbon */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2" data-testid="track-ribbon">
        {tracks.map(t => (
          <button
            key={t.dna_tag}
            onClick={() => setActive(t)}
            data-testid={`ribbon-${t.dna_tag}`}
            className={`shrink-0 px-4 py-2 rounded-[3px] border text-[11px] uppercase tracking-[0.16em] transition
              ${active.dna_tag === t.dna_tag
                ? "bg-[#f5a524]/15 border-[#f5a524]/60 text-[#ffd88a]"
                : "bg-[#0d0d10] border-[#22222a] text-[#8a8278] hover:text-[#f3ece1]"}`}>
            <span className="font-display">{t.title}</span>
            <span className="text-[#6b6257] mx-2">·</span>
            <span className="font-mono">{t.dna_tag}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Track + Mixer */}
        <div className="col-span-12 lg:col-span-8">
          <div className="panel rounded-[6px] p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="etched text-[#8a8278]">Now Loaded</div>
                <h3 className="font-display text-[28px] text-[#f3ece1] mt-1 tracking-tight">{active.title}</h3>
                <div className="text-[12px] font-mono text-[#8a8278] mt-1">
                  {active.cultural_matrix} · <span className="text-[#f5a524]">{active.dna_tag}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="etched text-[#8a8278]">Creator</div>
                <div className="font-mono text-[13px] text-[#c9bfae] mt-1">{active.creator}</div>
              </div>
            </div>
          </div>
          <StemMixer stems={active.stems} onStemsChange={setStems}/>
        </div>

        {/* Biometric panel */}
        <div className="col-span-12 lg:col-span-4 space-y-5" data-testid="biometrics-panel">
          <div className="panel rounded-[6px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Fingerprint size={14} className="text-[#ff5eac]"/>
              <span className="etched text-[#ff5eac]">Biometrics · Human Pipes</span>
            </div>
            <div className="space-y-5">
              <Dial label="Vulnerability Index" value={b.vulnerability_index} color="#ff5eac" testId="dial-vuln"/>
              <Dial label="Lung Capacity" value={b.lung_capacity} color="#6a8cff" testId="dial-lung"/>
              <Dial label="Throat Resonance" value={b.throat_resonance} color="#59d3ff" testId="dial-throat"/>
            </div>
          </div>

          <div className="panel rounded-[6px] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-[#f5a524]"/>
              <span className="etched text-[#f5a524]">Aether-Voice Mapping</span>
            </div>
            <div className="font-mono text-[10px] text-[#6b6257] uppercase tracking-[0.18em] mb-2">Phonation</div>
            <div className="text-[14px] text-[#f3ece1] mb-4">{b.phonation_type}</div>

            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="bg-[#0d0d10] rounded-[3px] p-3 border border-[#1c1c22]">
                <div className="text-[#6b6257] uppercase tracking-[0.16em] text-[9px] mb-1">Swing Delay</div>
                <div className="text-[#ffd88a] text-[16px]">+{b.swing_delay_ms}ms <span className="text-[10px] text-[#8a8278]">late</span></div>
              </div>
              <div className="bg-[#0d0d10] rounded-[3px] p-3 border border-[#1c1c22]">
                <div className="text-[#6b6257] uppercase tracking-[0.16em] text-[9px] mb-1">Emotional Cracks</div>
                <div className="text-[#ff5eac] text-[16px]">{b.emotional_cracks} <span className="text-[10px] text-[#8a8278]">/ 30s</span></div>
              </div>
              <div className="col-span-2 bg-[#0d0d10] rounded-[3px] p-3 border border-[#1c1c22]">
                <div className="text-[#6b6257] uppercase tracking-[0.16em] text-[9px] mb-1">Aether Map</div>
                <div className="text-[#59d3ff] text-[22px] tracking-[0.3em]">{b.aether_voice_map}</div>
              </div>
            </div>
          </div>

          <div className="panel rounded-[6px] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-[#ffd88a]"/>
              <span className="etched text-[#ffd88a]">DNA · SynthID</span>
            </div>
            <div className="font-mono text-[11px] text-[#ffd88a] break-all bg-[#0d0d10] p-3 rounded-[3px] border border-[#f5a524]/20">
              {active.dna_tag}
            </div>
            <div className="text-[10px] font-mono text-[#6b6257] mt-2 uppercase tracking-[0.18em]">
              Immutable · Pinned to Empire 1 Ledger
            </div>
          </div>
        </div>
      </div>

      {/* LML payload */}
      {active.lml && (
        <div className="panel rounded-[6px] p-6 mt-6" data-testid="lml-viewer">
          <div className="flex items-center gap-2 mb-3">
            <Heart size={14} className="text-[#ff5eac]"/>
            <span className="etched text-[#ff5eac]">Lyric Markup Language · LML Payload</span>
          </div>
          <pre className="font-mono text-[12px] text-[#c9bfae] whitespace-pre-wrap leading-relaxed bg-[#0d0d10] p-4 rounded-[3px] border border-[#1c1c22] max-h-[280px] overflow-y-auto">
{active.lml}
          </pre>
        </div>
      )}
    </div>
  );
}
