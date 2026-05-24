import React, { useEffect, useState } from "react";
import { generate, apiGet, getVibes } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { Flame, UploadCloud, Sparkles, Volume2, Check, ChevronDown, ChevronUp } from "lucide-react";

const FALLBACK_GROUPS = {
  genre_groups: [
    { title: "LA · SGV · Chicano",
      items: ["SGV Oldies","LA Heritage","Art Laboe Sunday Dedication","SGV Backyard Party",
              "Nahuatl Ancestry","West Coast G-Funk Piano","Acoustic Requinto Weeping",
              "Corridos","Oldies","Street Bounce","Cruising","Resilience"] },
    { title: "Urban · Contemporary",
      items: ["R&B","Trap Soul","Hip Hop","Rap","Drill"] },
    { title: "Global",
      items: ["Afrobeats","UK Garage","Jersey Club","Bossa Nova"] },
  ],
  mood_groups: [
    { title: "Chicano/Oldies Lineage",
      items: ["Late-Night Honesty","Sunday Dedication","Porch-Light Grief","Requinto Lament","Ancestral Fire","Lowrider Calm"] },
    { title: "Street / Bounce",
      items: ["Street Resilience","Defiant Bloom","Backyard Euphoria","Soft Menace"] },
    { title: "Intimate",
      items: ["Cruising Melancholy","After-Hours Prayer"] },
  ],
};

const ChipGroupGrid = ({ groups, value, onChange, color = "#F5C542", testId }) => {
  const [open, setOpen] = useState(() => groups.map((_, i) => i === 0));
  return (
    <div className="space-y-3" data-testid={testId}>
      {groups.map((g, gi) => (
        <div key={g.title} className="border border-[#0E0F17] rounded-[4px] bg-[#0a0a0c]">
          <button
            type="button"
            onClick={() => setOpen((o) => o.map((v, i) => (i === gi ? !v : v)))}
            className="w-full px-3 py-2.5 flex items-center justify-between text-left">
            <span className="etched text-[#C8CCD8]">{g.title}</span>
            <span className="text-[#6B7280]">
              {open[gi] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            </span>
          </button>
          {open[gi] && (
            <div className="px-3 pb-3 flex flex-wrap gap-2">
              {g.items.map((o) => {
                const on = value === o;
                return (
                  <button key={o} type="button" onClick={() => onChange(o)}
                    className={`px-3 py-1.5 rounded-full border text-[10.5px] uppercase tracking-[0.12em] transition-all
                      ${on
                        ? "text-[#05060D] border-transparent"
                        : "text-[#C8CCD8] border-[#0E0F17] bg-[#0E0F17] hover:border-[#F5C542]/40 hover:text-[#F5F7FA]"}`}
                    style={on ? { background: `linear-gradient(180deg, ${color} 0%, ${color}aa 100%)`, boxShadow: `0 0 16px ${color}66` } : undefined}>
                    {on && <Check size={10} className="inline mr-1 -translate-y-[1px]"/>}
                    {o}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function MutationEngine() {
  const nav = useNavigate();
  const [lyrics, setLyrics] = useState("");
  const [title, setTitle] = useState("");
  const [ghost, setGhost] = useState("");
  const [genreGroups, setGenreGroups] = useState(FALLBACK_GROUPS.genre_groups);
  const [moodGroups, setMoodGroups]   = useState(FALLBACK_GROUPS.mood_groups);
  const [genre, setGenre] = useState(FALLBACK_GROUPS.genre_groups[0].items[0]);
  const [mood, setMood]   = useState(FALLBACK_GROUPS.mood_groups[0].items[0]);
  const [igniting, setIgniting] = useState(false);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    getVibes().then((v) => {
      if (v?.genre_groups?.length) { setGenreGroups(v.genre_groups); setGenre(v.genre_groups[0].items[0]); }
      if (v?.mood_groups?.length)  { setMoodGroups(v.mood_groups);   setMood(v.mood_groups[0].items[0]); }
    }).catch(() => {});
  }, []);

  const stages = [
    "Routing vibe matrix",
    "Tuning vocal presence",
    "Mutating ghost transients",
    "Layering soulfire",
    "Minting DNA on Empire 1",
  ];

  const onFile = (e) => { const f = e.target.files?.[0]; if (f) setGhost(f.name); };

  const ignite = async () => {
    if (!lyrics.trim()) { setErr("Raw lyric seed required for ignition."); return; }
    setErr(""); setIgniting(true); setResult(null);
    let alive = true;
    (async () => {
      for (const s of stages) { if (!alive) break; setStage(s); await new Promise((r) => setTimeout(r, 900)); }
    })();
    try {
      const t = await generate({ lyrics, genre, mood, title: title || null, ghost_audio_name: ghost || null });
      alive = false; setResult(t);
    } catch (e) {
      alive = false;
      setErr(e?.response?.data?.detail || "Soulfire misfired.");
    } finally { setIgniting(false); setStage(""); }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3 flex-wrap">
        <div>
          <div className="etched text-[#9CA3B0]">// S2 ENGINE</div>
          <h2 className="font-display text-[28px] md:text-[40px] text-[#F5F7FA] tracking-tight leading-[1.05] mt-1">
            Mutation Engine <span className="text-[#F5C542]">·</span> Ignite Soulfire
          </h2>
          <p className="font-serif italic text-[#9CA3B0] mt-1 md:mt-2 text-[12px] md:text-[14px]">
            Ingest raw pain · route through vibe matrix · mint sovereign DNA
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-7 space-y-4 md:space-y-5">
          <div className="panel rounded-[6px] p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-[#F5C542]"/>
              <span className="etched text-[#F5C542]">Raw Lyric Seed</span>
            </div>
            <textarea
              value={lyrics} onChange={(e) => setLyrics(e.target.value)}
              data-testid="lyrics-input"
              placeholder="East of the freeway, wildflowers bloom in the cracks&#10;abuelita's name carried like a prayer&#10;tape hiss hold me tonight…"
              className="w-full h-[150px] md:h-[170px] bg-[#0E0F17] border border-[#0E0F17] focus:border-[#F5C542] rounded-[3px] px-4 py-3 text-[#F5F7FA] font-mono text-[13px] outline-none leading-relaxed resize-y"/>

            <div className="mt-5">
              <div className="etched text-[#C8CCD8] mb-3">Title · optional</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                data-testid="title-input"
                placeholder="Auto-forged if blank"
                className="w-full bg-[#0E0F17] border border-[#0E0F17] focus:border-[#F5C542] rounded-[3px] px-3 py-2.5 text-[#F5F7FA] font-mono text-[13px] outline-none"/>
            </div>
          </div>

          <div className="panel rounded-[6px] p-4 md:p-6" data-testid="ghost-zone">
            <div className="flex items-center gap-2 mb-4">
              <UploadCloud size={14} className="text-[#00E6FF]"/>
              <span className="etched text-[#00E6FF]">Ghost Audio Artifact · VHS / Voicemail</span>
            </div>
            <label className="block border-2 border-dashed border-[#0E0F17] hover:border-[#00E6FF]/60 rounded-[4px] p-6 md:p-8 text-center cursor-pointer transition-colors">
              <input type="file" accept="audio/*,video/*" className="hidden" onChange={onFile} data-testid="ghost-input"/>
              <UploadCloud size={28} className="mx-auto text-[#00E6FF] mb-2" strokeWidth={1.2}/>
              <div className="font-mono text-[12px] text-[#C8CCD8]">
                {ghost ? <>Loaded: <span className="text-[#F5C542]">{ghost}</span></> : "Drop grainy voicemail or VHS rip"}
              </div>
              <div className="text-[10px] font-mono text-[#6B7280] uppercase tracking-[0.16em] mt-1">
                Mutated into drum transients on mint
              </div>
            </label>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-4 md:space-y-5">
          <div className="panel rounded-[6px] p-4 md:p-6">
            <div className="etched text-[#C8CCD8] mb-3">Genre · Cultural Matrix</div>
            <ChipGroupGrid groups={genreGroups} value={genre} onChange={setGenre} color="#F5C542" testId="genre-chips"/>
          </div>

          <div className="panel rounded-[6px] p-4 md:p-6">
            <div className="etched text-[#C8CCD8] mb-3">Mood · Emotional Register</div>
            <ChipGroupGrid groups={moodGroups} value={mood} onChange={setMood} color="#FF2EBE" testId="mood-chips"/>
          </div>

          <div className="panel rounded-[6px] p-4 md:p-6 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-40"
                 style={{ background: "radial-gradient(circle at 50% 50%, rgba(245,165,36,0.25), transparent 70%)" }}/>
            <button
              onClick={ignite}
              disabled={igniting}
              data-testid="ignite-btn"
              className="relative w-full py-5 md:py-6 rounded-[4px] border-2 border-[#FF2EBE]
                         bg-gradient-to-b from-[#F5C542] via-[#e07a14] to-[#6b2a04]
                         text-[#05060D] uppercase tracking-[0.26em] md:tracking-[0.32em] text-[12px] md:text-[14px] font-bold
                         animate-ignite hover:brightness-110 transition
                         disabled:opacity-70 disabled:cursor-not-allowed">
              <Flame size={16} className="inline mr-2 md:mr-3 -translate-y-[1px]"/>
              {igniting ? (stage || "Igniting…") : "Ignite Soulfire"}
            </button>
            {err && <div className="mt-3 text-[12px] text-[#FF2EBE] font-mono text-center">{err}</div>}
            {igniting && (
              <div className="mt-4 space-y-1.5" data-testid="ignite-pipeline">
                {stages.map((s) => (
                  <div key={s} className="flex items-center gap-2 font-mono text-[11px]">
                    <span className={stage === s ? "text-[#F5C542]" : stages.indexOf(stage) > stages.indexOf(s) ? "text-[#00E6FF]" : "text-[#6B7280]"}>
                      {stages.indexOf(stage) > stages.indexOf(s) ? "✓" : stage === s ? "◉" : "◇"}
                    </span>
                    <span className={stage === s ? "text-[#F5F7FA]" : "text-[#6B7280]"}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="panel rounded-[6px] p-4 md:p-6 mt-5 md:mt-6 border-[#F5C542]/40" data-testid="ignite-result">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="etched text-[#F5C542]">⚡ Soulfire Minted</div>
              <h3 className="font-display text-[22px] md:text-[28px] text-[#F5F7FA] mt-1 tracking-tight">{result.title}</h3>
              <div className="text-[12px] font-mono text-[#F5C542] mt-1">{result.dna_tag}</div>
              <div className="text-[11px] md:text-[12px] text-[#9CA3B0] mt-1">
                {genre} · <span className="text-[#FF2EBE]">{mood}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => nav("/deck")}
                className="px-3 md:px-4 py-2 rounded-[3px] border border-[#0E0F17] text-[#C8CCD8] hover:text-[#F5F7FA] hover:border-[#F5C542]/50 uppercase text-[10px] md:text-[11px] tracking-[0.2em]">
                <Volume2 size={12} className="inline mr-1"/> Load on Stem Deck
              </button>
              <button onClick={() => nav("/feed")}
                className="px-3 md:px-4 py-2 rounded-[3px] border border-[#FF2EBE]/60 bg-[#F5C542]/10 text-[#F5C542] uppercase text-[10px] md:text-[11px] tracking-[0.2em]">
                View in Feed
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {["Vocal Resonance", "Expressive Range", "Vulnerability", "Breath Profile"].map((k, i) => {
              const v = [result.biometrics?.resonance_quality, result.biometrics?.expressive_range,
                         result.biometrics?.vulnerability_level, result.biometrics?.breath_profile][i] || "—";
              const c = ["#00E6FF", "#F5C542", "#FF2EBE", "#00E6FF"][i];
              return (
                <div key={k} className="bg-[#0E0F17] border border-[#0E0F17] rounded-[4px] p-3">
                  <div className="etched text-[#6B7280] text-[9px] mb-1">{k}</div>
                  <div className="font-display text-[14px] md:text-[15px]" style={{ color: c }}>{v}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
