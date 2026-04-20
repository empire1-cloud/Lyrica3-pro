import React, { useState } from "react";
import { generate } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { Flame, UploadCloud, Sparkles, Wind, Heart, Volume2 } from "lucide-react";

const MATRIX = [
  "LA SGV Chicano Heritage",
  "Raw Spanish Corridos",
  "Art Laboe Oldies",
  "Late-Pocket Street Bounce",
  "Late Night Cruising Melancholy",
  "Street-Soft Resilience",
];

const BioDial = ({ label, value, onChange, color = "#f5a524", testId }) => (
  <div data-testid={testId}>
    <div className="flex items-center justify-between mb-2">
      <span className="etched text-[#c9bfae]">{label}</span>
      <span className="font-mono text-[11px] text-[#ffd88a] tabular-nums">{value.toFixed(2)}</span>
    </div>
    <div className="relative h-[6px] bg-[#0d0d10] border border-[#1c1c22] rounded-full overflow-hidden">
      <div className="absolute inset-y-0 left-0 rounded-full"
           style={{ width: `${value*100}%`, background: `linear-gradient(90deg, ${color}, #ff5eac)`,
                    boxShadow: `0 0 10px ${color}` }}/>
    </div>
    <input type="range" min={0} max={100} value={value*100}
           onChange={e => onChange(Number(e.target.value)/100)}
           className="w-full h-[6px] opacity-0 -mt-[6px] cursor-pointer relative z-10"
           aria-label={label}/>
  </div>
);

export default function MutationEngine() {
  const nav = useNavigate();
  const [lyrics, setLyrics] = useState("");
  const [matrix, setMatrix] = useState(MATRIX[0]);
  const [title, setTitle] = useState("");
  const [ghost, setGhost] = useState("");
  const [bio, setBio] = useState({ lung: 0.78, throat: 0.66, fry: 0.82, crack: 0.71 });
  const [igniting, setIgniting] = useState(false);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const stages = [
    "Parsing LML seed",
    "Routing cultural matrix",
    "Mutating ghost transients",
    "Injecting biometric tags",
    "Minting DNA on Empire 1",
  ];

  const onFile = (e) => { const f = e.target.files?.[0]; if (f) setGhost(f.name); };

  const ignite = async () => {
    if (!lyrics.trim()) { setErr("Seed lyrics required for ignition."); return; }
    setErr(""); setIgniting(true); setResult(null);
    // staged animation while LLM works
    let alive = true;
    (async () => {
      for (const s of stages) { if (!alive) break; setStage(s); await new Promise(r => setTimeout(r, 900)); }
    })();
    try {
      const t = await generate({
        lyrics, cultural_matrix: matrix, title: title || null,
        ghost_audio_name: ghost || null,
        lung_capacity: bio.lung, throat_resonance: bio.throat,
        vocal_fry: bio.fry, emotional_cracks: bio.crack,
      });
      alive = false; setResult(t);
    } catch (e) {
      alive = false;
      setErr(e?.response?.data?.detail || "Soulfire misfired.");
    } finally { setIgniting(false); setStage(""); }
  };

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="etched text-[#8a8278]">// S2 ENGINE</div>
          <h2 className="font-display text-[40px] text-[#f3ece1] tracking-tight leading-[1.05] mt-1">
            Mutation Engine <span className="text-[#f5a524]">·</span> Ignite Soulfire
          </h2>
          <p className="font-serif italic text-[#8a8278] mt-2 text-[14px]">
            Ingest raw pain · route through cultural matrix · mint sovereign DNA
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Input console */}
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <div className="panel rounded-[6px] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-[#f5a524]"/>
              <span className="etched text-[#f5a524]">Raw Lyric Seed · LML Ingestion</span>
            </div>
            <textarea
              value={lyrics} onChange={e=>setLyrics(e.target.value)}
              data-testid="lyrics-input"
              placeholder="East of the freeway, wildflowers bloom in the cracks&#10;abuelita's name carried like a prayer&#10;tape hiss hold me tonight…"
              className="w-full h-[160px] bg-[#0d0d10] border border-[#22222a] focus:border-[#f5a524] rounded-[3px] px-4 py-3 text-[#f3ece1] font-mono text-[13px] outline-none leading-relaxed resize-y"/>

            <div className="grid grid-cols-2 gap-4 mt-5">
              <div>
                <div className="etched text-[#c9bfae] mb-2">Cultural Matrix</div>
                <select value={matrix} onChange={e=>setMatrix(e.target.value)}
                  data-testid="matrix-select"
                  className="w-full bg-[#0d0d10] border border-[#22222a] focus:border-[#f5a524] rounded-[3px] px-3 py-2.5 text-[#f3ece1] font-mono text-[12px] outline-none">
                  {MATRIX.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <div className="etched text-[#c9bfae] mb-2">Title · optional</div>
                <input value={title} onChange={e=>setTitle(e.target.value)}
                  data-testid="title-input"
                  placeholder="Auto-forged if blank"
                  className="w-full bg-[#0d0d10] border border-[#22222a] focus:border-[#f5a524] rounded-[3px] px-3 py-2.5 text-[#f3ece1] font-mono text-[12px] outline-none"/>
              </div>
            </div>
          </div>

          {/* Ghost audio */}
          <div className="panel rounded-[6px] p-6" data-testid="ghost-zone">
            <div className="flex items-center gap-2 mb-4">
              <UploadCloud size={14} className="text-[#59d3ff]"/>
              <span className="etched text-[#59d3ff]">Ghost Audio Artifact · VHS / Voicemail</span>
            </div>
            <label className="block border-2 border-dashed border-[#22222a] hover:border-[#59d3ff]/60 rounded-[4px] p-8 text-center cursor-pointer transition-colors">
              <input type="file" accept="audio/*,video/*" className="hidden" onChange={onFile} data-testid="ghost-input"/>
              <UploadCloud size={32} className="mx-auto text-[#59d3ff] mb-3" strokeWidth={1.2}/>
              <div className="font-mono text-[12px] text-[#c9bfae]">
                {ghost ? <>Loaded: <span className="text-[#ffd88a]">{ghost}</span></> : "Drop grainy voicemail or VHS rip"}
              </div>
              <div className="text-[10px] font-mono text-[#6b6257] uppercase tracking-[0.16em] mt-1">
                Mathematically mutated into drum transients
              </div>
            </label>
          </div>
        </div>

        {/* Biometrics + Ignite */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          <div className="panel rounded-[6px] p-6">
            <div className="flex items-center gap-2 mb-5">
              <Heart size={14} className="text-[#ff5eac]"/>
              <span className="etched text-[#ff5eac]">Human Pipes · Biometric Dials</span>
            </div>
            <div className="space-y-5">
              <BioDial label="Lung Capacity" value={bio.lung}  onChange={v=>setBio({...bio, lung:v})} color="#6a8cff" testId="bio-lung"/>
              <BioDial label="Throat Resonance" value={bio.throat} onChange={v=>setBio({...bio, throat:v})} color="#59d3ff" testId="bio-throat"/>
              <BioDial label="Vocal Fry Depth" value={bio.fry} onChange={v=>setBio({...bio, fry:v})} color="#f5a524" testId="bio-fry"/>
              <BioDial label="Emotional Cracks" value={bio.crack} onChange={v=>setBio({...bio, crack:v})} color="#ff5eac" testId="bio-crack"/>
            </div>
          </div>

          {/* IGNITE button */}
          <div className="panel rounded-[6px] p-6 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-40"
                 style={{ background: "radial-gradient(circle at 50% 50%, rgba(245,165,36,0.25), transparent 70%)" }}/>
            <button
              onClick={ignite}
              disabled={igniting}
              data-testid="ignite-btn"
              className="relative w-full py-6 rounded-[4px] border-2 border-[#ff8a3d]
                         bg-gradient-to-b from-[#f5a524] via-[#e07a14] to-[#6b2a04]
                         text-[#1a0e00] uppercase tracking-[0.32em] text-[14px] font-bold
                         animate-ignite hover:brightness-110 transition
                         disabled:opacity-70 disabled:cursor-not-allowed">
              <Flame size={18} className="inline mr-3 -translate-y-[1px]"/>
              {igniting ? (stage || "Igniting…") : "Ignite Soulfire"}
            </button>
            {err && <div className="mt-3 text-[12px] text-[#ff5eac] font-mono text-center">{err}</div>}
            {igniting && (
              <div className="mt-4 space-y-1.5" data-testid="ignite-pipeline">
                {stages.map(s => (
                  <div key={s} className="flex items-center gap-2 font-mono text-[11px]">
                    <span className={stage === s ? "text-[#ffd88a]" : stages.indexOf(stage) > stages.indexOf(s) ? "text-[#59d3ff]" : "text-[#6b6257]"}>
                      {stages.indexOf(stage) > stages.indexOf(s) ? "✓" : stage === s ? "◉" : "◇"}
                    </span>
                    <span className={stage === s ? "text-[#f3ece1]" : "text-[#6b6257]"}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="panel rounded-[6px] p-6 mt-6 border-[#f5a524]/40" data-testid="ignite-result">
          <div className="flex items-start justify-between">
            <div>
              <div className="etched text-[#f5a524]">⚡ Soulfire Minted</div>
              <h3 className="font-display text-[28px] text-[#f3ece1] mt-1 tracking-tight">{result.title}</h3>
              <div className="text-[12px] font-mono text-[#ffd88a] mt-1">{result.dna_tag}</div>
              <div className="text-[12px] text-[#8a8278] mt-1">{result.cultural_matrix}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>nav("/deck")}
                className="px-4 py-2 rounded-[3px] border border-[#22222a] text-[#c9bfae] hover:text-[#f3ece1] hover:border-[#f5a524]/50 uppercase text-[11px] tracking-[0.2em]">
                <Volume2 size={12} className="inline mr-1"/> Load on Stem Deck
              </button>
              <button onClick={()=>nav("/feed")}
                className="px-4 py-2 rounded-[3px] border border-[#ff8a3d]/60 bg-[#f5a524]/10 text-[#ffd88a] uppercase text-[11px] tracking-[0.2em]">
                View in Feed
              </button>
            </div>
          </div>
          {result.cultural_subtext && (
            <p className="font-serif italic text-[#c9bfae] mt-4 text-[14px] leading-relaxed max-w-3xl">
              "{result.cultural_subtext}"
            </p>
          )}
          {result.lml && (
            <pre className="font-mono text-[12px] text-[#c9bfae] whitespace-pre-wrap leading-relaxed bg-[#0d0d10] p-4 rounded-[3px] border border-[#1c1c22] mt-4 max-h-[320px] overflow-y-auto">
{result.lml}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
