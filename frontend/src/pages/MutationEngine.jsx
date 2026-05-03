import React, { useCallback, useEffect, useState } from "react";
import { generate, soulCompose, getVibes, getAxes } from "../lib/api";
import { useNavigate } from "react-router-dom";
import {
  Flame, UploadCloud, Sparkles, Volume2, Check, ChevronDown, ChevronUp,
  Info, Plus, Minus, Waves, Layers, Zap, Dna,
} from "lucide-react";

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

// -----------------------------------------------------------
// Chip group accordion (reused from earlier MutationEngine)
// -----------------------------------------------------------
const ChipGroupGrid = ({ groups, value, onChange, color = "#f5a524", testId }) => {
  const [open, setOpen] = useState(() => groups.map((_, i) => i === 0));
  return (
    <div className="space-y-3" data-testid={testId}>
      {groups.map((g, gi) => (
        <div key={g.title} className="border border-[#1c1c22] rounded-[4px] bg-[#0a0a0c]">
          <button
            type="button"
            onClick={() => setOpen((o) => o.map((v, i) => (i === gi ? !v : v)))}
            className="w-full px-3 py-2.5 flex items-center justify-between text-left">
            <span className="etched text-[#c9bfae]">{g.title}</span>
            <span className="text-[#6b6257]">
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
                        ? "text-[#1a0e00] border-transparent"
                        : "text-[#c9bfae] border-[#22222a] bg-[#0d0d10] hover:border-[#f5a524]/40 hover:text-[#f3ece1]"}`}
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

// -----------------------------------------------------------
// EMSS Multi-Axis Selector (Phase 2)
// -----------------------------------------------------------
const AxisPicker = ({ label, color, options, value, onChange, testId }) => (
  <div className="border border-[#1c1c22] rounded-[4px] bg-[#0a0a0c] p-3" data-testid={testId}>
    <div className="flex items-center justify-between mb-2">
      <span className="etched" style={{ color }}>{label}</span>
      {value && (
        <button type="button" onClick={() => onChange("")}
                className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b6257] hover:text-[#ff5eac]">
          clear
        </button>
      )}
    </div>
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value === o.id;
        return (
          <button key={o.id} type="button" onClick={() => onChange(on ? "" : o.id)}
            data-testid={`axis-${testId}-${o.id}`}
            title={o.tag}
            className={`px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-[0.1em] transition-all
              ${on ? "text-[#0a0a0c] border-transparent" : "text-[#c9bfae] border-[#22222a] bg-[#0d0d10] hover:border-[#c9bfae]/60"}`}
            style={on ? { background: color, boxShadow: `0 0 12px ${color}88` } : undefined}>
            {o.label}
          </button>
        );
      })}
    </div>
  </div>
);

// -----------------------------------------------------------
// Performer DNA Slider w/ tooltip (Phase 3)
// -----------------------------------------------------------
const DNA_TOOLTIPS = {
  vulnerability:   "How emotionally exposed the singer sounds. Higher = close-mic, trembling, visible pain.",
  raspiness:       "Grit and edge in the voice. Higher = rougher, torn texture; lower = smooth, polished.",
  warmth:          "Lower-mid body (200-500Hz). Higher = wood-and-wire analog warmth; lower = airy and clean.",
  breath:          "Lung capacity / phrase length. Higher = long sustained held notes; lower = short gasping phrases.",
  breathiness:     "Airflow audible in the tone. Higher = whispery, breathy; lower = tight and closed.",
  clarity:         "Articulation and diction. Higher = crisp consonants; lower = slurred intimate delivery.",
  resonance:       "Throat/chest depth. Higher = deep cavernous resonance; lower = thin, mirror-close resonance.",
  glottal_tension: "Pressure at the vocal cords on climactic lines. Triggers the 'broken smile' crack.",
};
const DnaSlider = ({ name, value, onChange, color = "#59d3ff" }) => {
  const [hover, setHover] = useState(false);
  const pct = Math.round(value * 100);
  return (
    <div className="relative" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
         data-testid={`dna-slider-${name}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#c9bfae]">{name.replace(/_/g, " ")}</span>
          <Info size={10} className="text-[#6b6257]"/>
        </div>
        <span className="font-mono text-[10px] tabular-nums" style={{ color }}>{pct}</span>
      </div>
      <input
        type="range" min="0" max="100" value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        data-testid={`dna-slider-input-${name}`}
        className="w-full h-[4px] rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(90deg, ${color} ${pct}%, #1c1c22 ${pct}%)`,
          outline: "none",
        }}
      />
      {hover && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-[#0a0a0c] border border-[#2a2a34] rounded-[3px] p-2
                        font-mono text-[9.5px] text-[#c9bfae] leading-snug shadow-[0_6px_18px_rgba(0,0,0,0.8)]"
             data-testid={`dna-tooltip-${name}`}>
          {DNA_TOOLTIPS[name]}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------
// Harmony Layer row (Phase 3)
// -----------------------------------------------------------
const HarmonyRow = ({ idx, layer, onChange, onRemove }) => {
  const patch = (p) => onChange({ ...layer, ...p });
  return (
    <div className="bg-[#0d0d10] border border-[#22222a] rounded-[3px] p-3 space-y-2"
         data-testid={`harmony-layer-${idx}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={12} className="text-[#ff5eac]"/>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ffd88a]">Layer {idx + 1}</span>
        </div>
        <button type="button" onClick={onRemove}
                data-testid={`harmony-remove-${idx}`}
                className="text-[#6b6257] hover:text-[#ff5eac]">
          <Minus size={14}/>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b6257] mb-1">Interval</div>
          <div className="flex gap-1">
            {[3, 5, 7].map((n) => (
              <button key={n} type="button" onClick={() => patch({ interval: n })}
                data-testid={`harmony-${idx}-interval-${n}`}
                className={`flex-1 py-1 rounded-[3px] border text-[10px] font-mono
                  ${layer.interval === n ? "border-[#ff5eac] bg-[#ff5eac]/20 text-[#ff5eac]"
                                          : "border-[#22222a] text-[#8a8278] hover:border-[#ff5eac]/40"}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b6257] mb-1">Direction</div>
          <div className="flex gap-1">
            {["above", "below"].map((d) => (
              <button key={d} type="button" onClick={() => patch({ direction: d })}
                data-testid={`harmony-${idx}-dir-${d}`}
                className={`flex-1 py-1 rounded-[3px] border text-[10px] font-mono uppercase tracking-[0.1em]
                  ${layer.direction === d ? "border-[#59d3ff] bg-[#59d3ff]/20 text-[#59d3ff]"
                                           : "border-[#22222a] text-[#8a8278] hover:border-[#59d3ff]/40"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
      {[
        ["intensity", "Intensity",   "#f5a524"],
        ["dry_wet",   "Dry / Wet",   "#59d3ff"],
      ].map(([k, lbl, c]) => (
        <div key={k}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b6257]">{lbl}</span>
            <span className="font-mono text-[9px] tabular-nums" style={{ color: c }}>
              {Math.round(layer[k] * 100)}
            </span>
          </div>
          <input type="range" min="0" max="100" value={Math.round(layer[k] * 100)}
            data-testid={`harmony-${idx}-${k}`}
            onChange={(e) => patch({ [k]: Number(e.target.value) / 100 })}
            className="w-full h-[3px] rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(90deg, ${c} ${layer[k]*100}%, #1c1c22 ${layer[k]*100}%)` }}/>
        </div>
      ))}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b6257]">Timing (ms)</span>
          <span className="font-mono text-[9px] tabular-nums text-[#c9bfae]">
            {layer.timing_ms > 0 ? `+${layer.timing_ms}` : layer.timing_ms}
          </span>
        </div>
        <input type="range" min="-50" max="50" value={layer.timing_ms}
          data-testid={`harmony-${idx}-timing`}
          onChange={(e) => patch({ timing_ms: Number(e.target.value) })}
          className="w-full h-[3px] rounded-full appearance-none cursor-pointer bg-[#1c1c22]"/>
      </div>
    </div>
  );
};

// -----------------------------------------------------------
// Main Mutation Engine
// -----------------------------------------------------------
const DEFAULT_DNA = {
  vulnerability: 0.75, raspiness: 0.5, warmth: 0.6, breath: 0.6,
  breathiness: 0.5, clarity: 0.7, resonance: 0.65, glottal_tension: 0.4,
};

/** SoulComposer emotional arc — drives MMA heartbeat + optional mood hint server-side */
const EMOTIONAL_ARCS = [
  { id: "neutral", label: "Neutral", sub: "You steer mood & axes" },
  { id: "grief", label: "Grief", sub: "Heavy pocket · slower heart" },
  { id: "intimacy", label: "Intimacy", sub: "Close mic · breath" },
  { id: "defiance", label: "Defiance", sub: "Forward lean · harder kick" },
];

export default function MutationEngine() {
  const nav = useNavigate();
  const [lyrics, setLyrics] = useState("");
  const [title, setTitle] = useState("");
  const [ghost, setGhost] = useState("");
  const [genreGroups, setGenreGroups] = useState(FALLBACK_GROUPS.genre_groups);
  const [moodGroups, setMoodGroups]   = useState(FALLBACK_GROUPS.mood_groups);
  const [genre, setGenre] = useState(FALLBACK_GROUPS.genre_groups[0].items[0]);
  const [mood, setMood]   = useState(FALLBACK_GROUPS.mood_groups[0].items[0]);

  // EMSS Multi-Axis (Phase 2)
  const [axes, setAxes] = useState({ rhythm: "", melody: "", instrumentation: "", emotion: "" });
  const [axisCatalog, setAxisCatalog] = useState({ rhythm: [], melody: [], instrumentation: [], emotion: [] });
  const [axisOpen, setAxisOpen] = useState(true);

  // Performer DNA & Harmony (Phase 3)
  const [performerDna, setPerformerDna] = useState(DEFAULT_DNA);
  const [dnaOpen, setDnaOpen] = useState(false);
  const [harmonyLayers, setHarmonyLayers] = useState([]);
  const [harmonyOpen, setHarmonyOpen] = useState(false);
  const [splicer, setSplicer] = useState(false);
  const [bridge, setBridge] = useState(false);

  /** SoulComposer emotional arc → MMA heartbeat + optional mood alignment */
  const [emotionalArc, setEmotionalArc] = useState("neutral");
  /** Instrumental target length (seconds). Lyria stitches 30s segments; Replicate caps ~30s. */
  const [targetDurationSec, setTargetDurationSec] = useState(240);

  const [igniting, setIgniting] = useState(false);
  const [stage, setStage] = useState("");
  const [result, setResult] = useState(null);
  const [soulPlan, setSoulPlan] = useState(null);
  const [err, setErr] = useState("");

  const loadCatalogs = useCallback(() => {
    getVibes().then((v) => {
      if (v?.genre_groups?.length) { setGenreGroups(v.genre_groups); setGenre(v.genre_groups[0].items[0]); }
      if (v?.mood_groups?.length)  { setMoodGroups(v.mood_groups);   setMood(v.mood_groups[0].items[0]); }
    }).catch((err) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("getVibes failed", err);
      }
    });
    getAxes().then((a) => {
      if (a?.rhythm) setAxisCatalog(a);
    }).catch((err) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("getAxes failed", err);
      }
    });
  }, []);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  const pipelineStages = [
    "SoulComposer · CCNA / EPD / MMA",
    "Routing vibe matrix",
    "Fusing multi-axis recipe",
    "Tuning performer DNA",
    "Stacking harmony layers",
    "Minting DNA on Empire 1",
  ];

  const onFile = (e) => { const f = e.target.files?.[0]; if (f) setGhost(f.name); };

  const patchDna = (k, v) => setPerformerDna((d) => ({ ...d, [k]: v }));
  const addHarmony = () => setHarmonyLayers((h) =>
    h.length >= 4 ? h : [...h, { interval: 3, direction: "above", intensity: 0.5, dry_wet: 0.4, timing_ms: 0 }]);
  const updateHarmony = (i, newLayer) =>
    setHarmonyLayers((h) => h.map((x, idx) => (idx === i ? newLayer : x)));
  const removeHarmony = (i) =>
    setHarmonyLayers((h) => h.filter((_, idx) => idx !== i));

  const buildSoulComposeBody = useCallback(() => ({
    narrative: lyrics.trim(),
    genre,
    mood,
    title: title || null,
    ghost_audio_name: ghost || null,
    emotional_arc: emotionalArc,
    axes: {
      rhythm: axes.rhythm || null,
      melody: axes.melody || null,
      instrumentation: axes.instrumentation || null,
      emotion: axes.emotion || null,
    },
    performer_dna: performerDna,
    harmony_layers: harmonyLayers,
    subtextual_splicer: splicer,
    bridge_enabled: bridge,
    apply_arc_mood_hint: true,
    target_duration_seconds: targetDurationSec,
  }), [lyrics, genre, mood, title, ghost, emotionalArc, targetDurationSec, axes, performerDna, harmonyLayers, splicer, bridge]);

  const ignite = async () => {
    if (!lyrics.trim()) { setErr("Raw lyric seed required for ignition."); return; }
    setErr(""); setIgniting(true); setResult(null); setSoulPlan(null);
    let interval = null;
    try {
      setStage(pipelineStages[0]);
      const plan = await soulCompose(buildSoulComposeBody());
      setSoulPlan(plan);

      let idx = 1;
      const advance = () => {
        if (idx < pipelineStages.length) setStage(pipelineStages[idx++]);
      };
      advance();
      interval = setInterval(advance, 900);

      const t = await generate(plan.generate_request);
      setResult(t);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Soulfire misfired.");
    } finally {
      if (interval) clearInterval(interval);
      setIgniting(false);
      setStage("");
    }
  };

  const axisActiveCount = Object.values(axes).filter(Boolean).length;

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3 flex-wrap">
        <div>
          <div className="etched text-[#8a8278]">// EMSS ENGINE</div>
          <h2 className="font-display text-[28px] md:text-[40px] text-[#f3ece1] tracking-tight leading-[1.05] mt-1">
            Mutation Engine <span className="text-[#f5a524]">·</span> Ignite Soulfire
          </h2>
          <p className="font-serif italic text-[#8a8278] mt-1 md:mt-2 text-[12px] md:text-[14px]">
            El Monte Soul-Somatic · multi-axis · performer DNA · harmony stacks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* LEFT COLUMN — lyric + ghost */}
        <div className="col-span-12 lg:col-span-7 space-y-4 md:space-y-5">
          <div className="panel rounded-[6px] p-4 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-[#f5a524]"/>
              <span className="etched text-[#f5a524]">Raw Lyric Seed</span>
            </div>
            <textarea
              value={lyrics} onChange={(e) => setLyrics(e.target.value)}
              data-testid="lyrics-input"
              placeholder="East of the freeway, wildflowers bloom in the cracks&#10;abuelita's name carried like a prayer&#10;tape hiss hold me tonight…"
              className="w-full h-[150px] md:h-[170px] bg-[#0d0d10] border border-[#22222a] focus:border-[#f5a524] rounded-[3px] px-4 py-3 text-[#f3ece1] font-mono text-[13px] outline-none leading-relaxed resize-y"/>

            <div className="mt-5">
              <div className="etched text-[#c9bfae] mb-3">Title · optional</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                data-testid="title-input"
                placeholder="Auto-forged if blank"
                className="w-full bg-[#0d0d10] border border-[#22222a] focus:border-[#f5a524] rounded-[3px] px-3 py-2.5 text-[#f3ece1] font-mono text-[13px] outline-none"/>
            </div>
          </div>

          {/* EMSS Multi-Axis Control — Phase 2 */}
          <div className="panel rounded-[6px] p-4 md:p-6" data-testid="emss-axes-panel">
            <button type="button" onClick={() => setAxisOpen((o) => !o)}
                    className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves size={14} className="text-[#59d3ff]"/>
                <span className="etched text-[#59d3ff]">EMSS Multi-Axis Control</span>
                {axisActiveCount > 0 && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#ffd88a] bg-[#ffd88a]/10 border border-[#ffd88a]/30 rounded-full px-2 py-0.5">
                    {axisActiveCount}/4
                  </span>
                )}
              </div>
              {axisOpen ? <ChevronUp size={14} className="text-[#6b6257]"/> : <ChevronDown size={14} className="text-[#6b6257]"/>}
            </button>
            <div className="font-mono text-[10px] text-[#6b6257] uppercase tracking-[0.18em] mt-1 mb-3">
              Stack rhythm + melody + instruments + emotion as independent dimensions
            </div>
            {axisOpen && (
              <div className="space-y-2.5">
                <AxisPicker label="Rhythm · Structure"   color="#f5a524"
                  options={axisCatalog.rhythm}         value={axes.rhythm}
                  onChange={(v) => setAxes((a) => ({ ...a, rhythm: v }))}    testId="rhythm"/>
                <AxisPicker label="Melody · Phrasing"    color="#ff5eac"
                  options={axisCatalog.melody}          value={axes.melody}
                  onChange={(v) => setAxes((a) => ({ ...a, melody: v }))}    testId="melody"/>
                <AxisPicker label="Instrumentation"      color="#59d3ff"
                  options={axisCatalog.instrumentation} value={axes.instrumentation}
                  onChange={(v) => setAxes((a) => ({ ...a, instrumentation: v }))} testId="instrumentation"/>
                <AxisPicker label="Emotional Delivery"   color="#ffd88a"
                  options={axisCatalog.emotion}         value={axes.emotion}
                  onChange={(v) => setAxes((a) => ({ ...a, emotion: v }))}   testId="emotion"/>
              </div>
            )}
          </div>

          {/* Performer DNA — Phase 3 */}
          <div className="panel rounded-[6px] p-4 md:p-6" data-testid="performer-dna-panel">
            <button type="button" onClick={() => setDnaOpen((o) => !o)}
                    className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dna size={14} className="text-[#ff5eac]"/>
                <span className="etched text-[#ff5eac]">Performer DNA · Vocal Engine</span>
              </div>
              {dnaOpen ? <ChevronUp size={14} className="text-[#6b6257]"/> : <ChevronDown size={14} className="text-[#6b6257]"/>}
            </button>
            <div className="font-mono text-[10px] text-[#6b6257] uppercase tracking-[0.18em] mt-1 mb-3">
              Hover a label for its effect · all values drive the vocal recipe
            </div>
            {dnaOpen && (
              <div className="grid grid-cols-2 md:grid-cols-2 gap-x-5 gap-y-4">
                {Object.keys(DEFAULT_DNA).map((k, i) => (
                  <DnaSlider key={k} name={k} value={performerDna[k]}
                             onChange={(v) => patchDna(k, v)}
                             color={["#59d3ff","#ff5eac","#ffd88a","#f5a524","#a78bfa","#59d3ff","#ff5eac","#ff8a3d"][i % 8]}/>
                ))}
              </div>
            )}
          </div>

          {/* Harmony Layers — Phase 3 */}
          <div className="panel rounded-[6px] p-4 md:p-6" data-testid="harmony-panel">
            <button type="button" onClick={() => setHarmonyOpen((o) => !o)}
                    className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-[#ffd88a]"/>
                <span className="etched text-[#ffd88a]">Harmony Layers</span>
                {harmonyLayers.length > 0 && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#ffd88a] bg-[#ffd88a]/10 border border-[#ffd88a]/30 rounded-full px-2 py-0.5">
                    {harmonyLayers.length} stacked
                  </span>
                )}
              </div>
              {harmonyOpen ? <ChevronUp size={14} className="text-[#6b6257]"/> : <ChevronDown size={14} className="text-[#6b6257]"/>}
            </button>
            <div className="font-mono text-[10px] text-[#6b6257] uppercase tracking-[0.18em] mt-1 mb-3">
              Stack up to 4 harmony takes · each rendered as its own stem
            </div>
            {harmonyOpen && (
              <div className="space-y-2.5">
                {harmonyLayers.map((l, i) => (
                  <HarmonyRow key={`${l.direction}-${l.interval}-${i}`} idx={i} layer={l}
                              onChange={(nl) => updateHarmony(i, nl)}
                              onRemove={() => removeHarmony(i)}/>
                ))}
                {harmonyLayers.length < 4 && (
                  <button type="button" onClick={addHarmony}
                          data-testid="harmony-add-btn"
                          className="w-full py-2.5 rounded-[3px] border border-dashed border-[#ffd88a]/40 hover:border-[#ffd88a]/80
                                     text-[#ffd88a] font-mono text-[10px] uppercase tracking-[0.2em]
                                     flex items-center justify-center gap-2 transition-all">
                    <Plus size={12}/> Add Harmony Layer
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="panel rounded-[6px] p-4 md:p-6" data-testid="ghost-zone">
            <div className="flex items-center gap-2 mb-4">
              <UploadCloud size={14} className="text-[#59d3ff]"/>
              <span className="etched text-[#59d3ff]">Ghost Audio Artifact · VHS / Voicemail</span>
            </div>
            <label className="block border-2 border-dashed border-[#22222a] hover:border-[#59d3ff]/60 rounded-[4px] p-6 md:p-8 text-center cursor-pointer transition-colors">
              <input type="file" accept="audio/*,video/*" className="hidden" onChange={onFile} data-testid="ghost-input"/>
              <UploadCloud size={28} className="mx-auto text-[#59d3ff] mb-2" strokeWidth={1.2}/>
              <div className="font-mono text-[12px] text-[#c9bfae]">
                {ghost ? <>Loaded: <span className="text-[#ffd88a]">{ghost}</span></> : "Drop grainy voicemail or VHS rip"}
              </div>
            </label>
          </div>
        </div>

        {/* RIGHT COLUMN — Genre + Mood + Toggles + Ignite */}
        <div className="col-span-12 lg:col-span-5 space-y-4 md:space-y-5">
          <div className="panel rounded-[6px] p-4 md:p-6">
            <div className="etched text-[#c9bfae] mb-3">Base Genre · Cultural Matrix</div>
            <ChipGroupGrid groups={genreGroups} value={genre} onChange={setGenre} color="#f5a524" testId="genre-chips"/>
          </div>

          <div className="panel rounded-[6px] p-4 md:p-6">
            <div className="etched text-[#c9bfae] mb-3">Base Mood · Emotional Register</div>
            <ChipGroupGrid groups={moodGroups} value={mood} onChange={setMood} color="#ff5eac" testId="mood-chips"/>
          </div>

          <div className="panel rounded-[6px] p-4 md:p-6" data-testid="soul-arc-panel">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-[#ffd88a]"/>
              <span className="etched text-[#ffd88a]">SoulComposer · Emotional Arc</span>
            </div>
            <div className="font-mono text-[10px] text-[#6b6257] uppercase tracking-[0.18em] mb-3">
              Sets MMA heartbeat pocket before S2 · optional mood alignment
            </div>
            <div className="mb-4 pb-4 border-b border-[#1c1c22]" data-testid="target-duration-panel">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b6257] mb-2">
                Target length (instrumental)
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { sec: 150, label: "~2:30" },
                  { sec: 240, label: "~4:00" },
                  { sec: 300, label: "~5:00" },
                  { sec: 360, label: "~6:00" },
                ].map(({ sec, label }) => {
                  const on = targetDurationSec === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      data-testid={`duration-${sec}`}
                      onClick={() => setTargetDurationSec(sec)}
                      className={`px-3 py-1.5 rounded-full border font-mono text-[10px] uppercase tracking-[0.12em]
                        ${on ? "border-[#59d3ff] bg-[#59d3ff]/15 text-[#59d3ff]" : "border-[#22222a] text-[#8a8278] hover:border-[#59d3ff]/40"}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
              <p className="font-mono text-[9px] text-[#6b6257] mt-2 leading-relaxed">
                Vertex Lyria stitches segments for long form. Replicate MusicGen is capped (~30s) — use Lyria on GCP for full songs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EMOTIONAL_ARCS.map((a) => {
                const on = emotionalArc === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    data-testid={`soul-arc-${a.id}`}
                    onClick={() => setEmotionalArc(a.id)}
                    className={`text-left rounded-[3px] border px-3 py-2.5 transition-all
                      ${on
                        ? "border-[#ffd88a]/80 bg-[#ffd88a]/10"
                        : "border-[#22222a] hover:border-[#ffd88a]/40"}`}>
                    <div className={`font-mono text-[10.5px] uppercase tracking-[0.14em] ${on ? "text-[#ffd88a]" : "text-[#c9bfae]"}`}>
                      {a.label}
                    </div>
                    <div className="font-mono text-[9px] text-[#6b6257] mt-0.5 leading-snug">{a.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtextual + bridge toggles */}
          <div className="panel rounded-[6px] p-4 md:p-5 space-y-3" data-testid="emss-toggles">
            <button type="button" onClick={() => setSplicer((s) => !s)}
                    data-testid="toggle-splicer"
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[3px] border transition-all
                      ${splicer ? "border-[#ff5eac]/60 bg-[#ff5eac]/10" : "border-[#22222a] hover:border-[#ff5eac]/40"}`}>
              <div className="flex items-center gap-2">
                <Zap size={12} className={splicer ? "text-[#ff5eac]" : "text-[#6b6257]"}/>
                <div className="text-left">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#c9bfae]">Broken-Smile Splicer</div>
                  <div className="font-mono text-[9px] text-[#6b6257]">Never say the pain directly · playful-pain</div>
                </div>
              </div>
              <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${splicer ? "text-[#ff5eac]" : "text-[#6b6257]"}`}>
                {splicer ? "ON" : "OFF"}
              </span>
            </button>
            <button type="button" onClick={() => setBridge((s) => !s)}
                    data-testid="toggle-bridge"
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[3px] border transition-all
                      ${bridge ? "border-[#59d3ff]/60 bg-[#59d3ff]/10" : "border-[#22222a] hover:border-[#59d3ff]/40"}`}>
              <div className="flex items-center gap-2">
                <Waves size={12} className={bridge ? "text-[#59d3ff]" : "text-[#6b6257]"}/>
                <div className="text-left">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#c9bfae]">Instrumental Bridge</div>
                  <div className="font-mono text-[9px] text-[#6b6257]">Contrast section · different focus · returns home</div>
                </div>
              </div>
              <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${bridge ? "text-[#59d3ff]" : "text-[#6b6257]"}`}>
                {bridge ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          <div className="panel rounded-[6px] p-4 md:p-6 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-40"
                 style={{ background: "radial-gradient(circle at 50% 50%, rgba(245,165,36,0.25), transparent 70%)" }}/>
            <button
              onClick={ignite}
              disabled={igniting}
              data-testid="ignite-btn"
              className="relative w-full py-5 md:py-6 rounded-[4px] border-2 border-[#ff8a3d]
                         bg-gradient-to-b from-[#f5a524] via-[#e07a14] to-[#6b2a04]
                         text-[#1a0e00] uppercase tracking-[0.26em] md:tracking-[0.32em] text-[12px] md:text-[14px] font-bold
                         animate-ignite hover:brightness-110 transition
                         disabled:opacity-70 disabled:cursor-not-allowed">
              <Flame size={16} className="inline mr-2 md:mr-3 -translate-y-[1px]"/>
              {igniting ? (stage || "Igniting…") : "Ignite Soulfire"}
            </button>
            {err && <div className="mt-3 text-[12px] text-[#ff5eac] font-mono text-center" data-testid="ignite-err">{err}</div>}
            {igniting && (
              <div className="mt-4 space-y-1.5" data-testid="ignite-pipeline">
                {pipelineStages.map((s) => (
                  <div key={s} className="flex items-center gap-2 font-mono text-[11px]">
                    <span className={stage === s ? "text-[#ffd88a]" : pipelineStages.indexOf(stage) > pipelineStages.indexOf(s) ? "text-[#59d3ff]" : "text-[#6b6257]"}>
                      {pipelineStages.indexOf(stage) > pipelineStages.indexOf(s) ? "✓" : stage === s ? "◉" : "◇"}
                    </span>
                    <span className={stage === s ? "text-[#f3ece1]" : "text-[#6b6257]"}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {result && (
        <div className="panel rounded-[6px] p-4 md:p-6 mt-5 md:mt-6 border-[#f5a524]/40" data-testid="ignite-result">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="etched text-[#f5a524]">⚡ Soulfire Minted</div>
              <h3 className="font-display text-[22px] md:text-[28px] text-[#f3ece1] mt-1 tracking-tight">{result.title}</h3>
              <div className="text-[12px] font-mono text-[#ffd88a] mt-1">{result.dna_tag}</div>
              <div className="text-[11px] md:text-[12px] text-[#8a8278] mt-1">
                {genre} ·{" "}
                <span className="text-[#ff5eac]">
                  {soulPlan?.generate_request?.mood ?? mood}
                </span>
                {soulPlan && (
                  <> · <span className="text-[#ffd88a]">arc {soulPlan.resolved_emotional_arc}</span></>
                )}
                {axisActiveCount > 0 && <> · <span className="text-[#59d3ff]">{axisActiveCount} axis overlay</span></>}
                {harmonyLayers.length > 0 && <> · <span className="text-[#ffd88a]">{harmonyLayers.length} harmony stack</span></>}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => nav("/deck")}
                className="px-3 md:px-4 py-2 rounded-[3px] border border-[#22222a] text-[#c9bfae] hover:text-[#f3ece1] hover:border-[#f5a524]/50 uppercase text-[10px] md:text-[11px] tracking-[0.2em]">
                <Volume2 size={12} className="inline mr-1"/> Load on Stem Deck
              </button>
              <button onClick={() => nav("/feed")}
                className="px-3 md:px-4 py-2 rounded-[3px] border border-[#ff8a3d]/60 bg-[#f5a524]/10 text-[#ffd88a] uppercase text-[10px] md:text-[11px] tracking-[0.2em]">
                View in Feed
              </button>
            </div>
          </div>
          {soulPlan && (
            <div className="mt-4 p-3 md:p-4 rounded-[4px] border border-[#ffd88a]/25 bg-[#ffd88a]/5" data-testid="soul-plan-summary">
              <div className="etched text-[#ffd88a] text-[10px] mb-2">SoulComposer plan (CCNA · EPD · MMA)</div>
              <div className="font-mono text-[10px] md:text-[11px] text-[#c9bfae] space-y-1">
                <div>
                  CCNA: <span className="text-[#59d3ff]">{soulPlan.ccna?.validation_status ?? "—"}</span>
                  {Array.isArray(soulPlan.ccna?.issues) && soulPlan.ccna.issues.length > 0 && (
                    <span className="text-[#ff5eac]"> · flags: {soulPlan.ccna.issues.join(", ")}</span>
                  )}
                </div>
                {soulPlan.generate_request?.target_duration_seconds != null && (
                  <div>
                    Target: <span className="text-[#59d3ff]">
                      {Math.floor(soulPlan.generate_request.target_duration_seconds / 60)}:
                      {String(soulPlan.generate_request.target_duration_seconds % 60).padStart(2, "0")}
                    </span> instrumental
                  </div>
                )}
                {soulPlan.mma?.bpm_center != null && (
                  <div>
                    MMA pocket: ~<span className="text-[#ffd88a]">{soulPlan.mma.bpm_center}</span> BPM
                    {soulPlan.mma.swing_delay_ms != null && (
                      <> · swing <span className="text-[#ffd88a]">{soulPlan.mma.swing_delay_ms} ms</span></>
                    )}
                  </div>
                )}
                {soulPlan.epd?.poetic_divergence_hint && (
                  <div className="text-[#8a8278] font-serif italic leading-snug pt-1 border-t border-[#22222a] mt-2">
                    {soulPlan.epd.poetic_divergence_hint}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {["Vocal Resonance", "Expressive Range", "Vulnerability", "Breath Profile"].map((k, i) => {
              const v = [result.biometrics?.resonance_quality, result.biometrics?.expressive_range,
                         result.biometrics?.vulnerability_level, result.biometrics?.breath_profile][i] || "—";
              const c = ["#59d3ff", "#f5a524", "#ff5eac", "#6a8cff"][i];
              return (
                <div key={k} className="bg-[#0d0d10] border border-[#1c1c22] rounded-[4px] p-3">
                  <div className="etched text-[#6b6257] text-[9px] mb-1">{k}</div>
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
