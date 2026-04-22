import React, { useCallback, useEffect, useRef, useState } from "react";
import { getDuetProfiles, generateDuet, resolveAudioUrl } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { Users, Play, Pause, Square, Mic2, Sparkles, Check } from "lucide-react";

/**
 * Duo-Soul Engine — Phase 4
 * Pick two voice profiles, paste conversational lyrics (A: / B: prefix),
 * backend synthesizes each line as its own segment, frontend plays them sequentially.
 */
function VoiceTile({ profile, selected, onSelect, accent, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(profile.id)}
      disabled={disabled}
      data-testid={`duet-voice-${profile.id}`}
      className={`relative text-left p-3 rounded-[4px] border transition-all w-full
        ${selected
          ? "border-transparent"
          : disabled
            ? "border-[#1c1c22] opacity-30 cursor-not-allowed"
            : "border-[#22222a] hover:border-[#c9bfae]/50"}`}
      style={selected ? { borderColor: accent, boxShadow: `0 0 16px ${accent}55`, background: `${accent}10` } : undefined}>
      <div className="flex items-center gap-2 mb-1">
        <Mic2 size={12} style={{ color: selected ? accent : "#6b6257" }}/>
        <span className="font-display text-[14px]" style={{ color: selected ? accent : "#c9bfae" }}>
          {profile.label}
        </span>
        {selected && <Check size={11} style={{ color: accent }} className="ml-auto"/>}
      </div>
      <div className="font-mono text-[9.5px] text-[#8a8278] leading-snug">{profile.persona}</div>
    </button>
  );
}

export default function DuetEngine() {
  const nav = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [voiceA, setVoiceA] = useState("mateo");
  const [voiceB, setVoiceB] = useState("elara");
  const [lyrics, setLyrics] = useState(
    "A: Hey mija, you still up?\nB: Late-night pacing, same as always.\nA: The porch-light never turns off.\nB: Neither does the ache."
  );
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  // Sequential playback state
  const [playing, setPlaying] = useState(false);
  const [playIdx, setPlayIdx] = useState(-1);
  const audioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getDuetProfiles()
      .then((d) => {
        if (!cancelled) setProfiles(d.profiles || []);
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("duet profile fetch failed", err);
        }
      });
    const audio = audioRef.current;
    return () => {
      cancelled = true;
      if (audio) audio.pause();
    };
  }, []);

  const profA = profiles.find((p) => p.id === voiceA);
  const profB = profiles.find((p) => p.id === voiceB);

  const generate = useCallback(async () => {
    if (!lyrics.trim()) { setErr("Lyric seed required."); return; }
    if (voiceA === voiceB) { setErr("Pick two distinct voices."); return; }
    setErr(""); setLoading(true); setResult(null); setPlayIdx(-1); setPlaying(false);
    try {
      const d = await generateDuet({
        lyrics, voice_a: voiceA, voice_b: voiceB, title: title || null,
      });
      setResult(d);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Duet synthesis failed.");
    } finally { setLoading(false); }
  }, [lyrics, voiceA, voiceB, title]);

  const playAll = useCallback(() => {
    if (!result?.segments?.length) return;
    setPlaying(true);
    setPlayIdx(0);
  }, [result]);
  const stopAll = useCallback(() => {
    setPlaying(false);
    setPlayIdx(-1);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  }, []);

  // Drive sequential playback
  useEffect(() => {
    if (!playing || playIdx < 0 || !result?.segments) return;
    const seg = result.segments[playIdx];
    if (!seg) { setPlaying(false); setPlayIdx(-1); return; }
    const a = audioRef.current;
    if (!a) return;
    a.src = resolveAudioUrl(seg.url);
    a.onended = () => {
      if (playIdx + 1 < result.segments.length) setPlayIdx((i) => i + 1);
      else { setPlaying(false); setPlayIdx(-1); }
    };
    a.play().catch(() => { setPlaying(false); setPlayIdx(-1); });
  }, [playing, playIdx, result]);

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      <audio ref={audioRef} preload="auto"/>

      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3 flex-wrap">
        <div>
          <div className="etched text-[#8a8278]">// DUO-SOUL ENGINE</div>
          <h2 className="font-display text-[28px] md:text-[40px] text-[#f3ece1] tracking-tight leading-[1.05] mt-1">
            Duet · <span className="text-[#ff5eac]">Two Broken Smiles</span>
          </h2>
          <p className="font-serif italic text-[#8a8278] mt-1 md:mt-2 text-[12px] md:text-[14px]">
            Conversational duet between two voice profiles · Aether-Ensemble-v2
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-7 space-y-4 md:space-y-5">
          <div className="panel rounded-[6px] p-4 md:p-6" data-testid="duet-lyrics-panel">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-[#f5a524]"/>
              <span className="etched text-[#f5a524]">Conversational Lyrics</span>
            </div>
            <div className="font-mono text-[10px] text-[#6b6257] uppercase tracking-[0.18em] mb-3">
              Prefix each line with <span className="text-[#f5a524]">A:</span> or <span className="text-[#ff5eac]">B:</span> · unprefixed lines alternate automatically
            </div>
            <textarea
              value={lyrics} onChange={(e) => setLyrics(e.target.value)}
              data-testid="duet-lyrics-input"
              placeholder="A: Hey mija, you still up?&#10;B: Late-night pacing, same as always.&#10;A: The porch-light never turns off.&#10;B: Neither does the ache."
              className="w-full h-[200px] md:h-[240px] bg-[#0d0d10] border border-[#22222a] focus:border-[#f5a524] rounded-[3px] px-4 py-3 text-[#f3ece1] font-mono text-[13px] outline-none leading-relaxed resize-y"/>

            <div className="mt-4">
              <div className="etched text-[#c9bfae] mb-2">Title · optional</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                data-testid="duet-title-input"
                placeholder="Auto-forged if blank"
                className="w-full bg-[#0d0d10] border border-[#22222a] focus:border-[#f5a524] rounded-[3px] px-3 py-2.5 text-[#f3ece1] font-mono text-[13px] outline-none"/>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="panel rounded-[6px] p-4 md:p-6 border-[#ff5eac]/40" data-testid="duet-result">
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div>
                  <div className="etched text-[#ff5eac]">⚡ Duet Minted</div>
                  <h3 className="font-display text-[22px] md:text-[26px] text-[#f3ece1] mt-1 tracking-tight">{result.title}</h3>
                  <div className="text-[11px] font-mono text-[#ffd88a] mt-1">{result.dna_tag}</div>
                  <div className="text-[11px] text-[#8a8278] mt-1">
                    <span style={{ color: result.voice_a.color }}>{result.voice_a.label}</span>
                    <span className="mx-1.5 text-[#6b6257]">×</span>
                    <span style={{ color: result.voice_b.color }}>{result.voice_b.label}</span>
                    <span className="ml-2 text-[#59d3ff]">· {result.segments.length} segments</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!playing ? (
                    <button onClick={playAll}
                      data-testid="duet-play-all"
                      className="px-4 py-2 rounded-[3px] border border-[#ff8a3d]/60 bg-[#f5a524]/10 text-[#ffd88a] uppercase text-[11px] tracking-[0.2em] hover:bg-[#f5a524]/20">
                      <Play size={12} className="inline mr-1.5 -translate-y-[1px]"/> Play Duet
                    </button>
                  ) : (
                    <button onClick={stopAll}
                      data-testid="duet-stop"
                      className="px-4 py-2 rounded-[3px] border border-[#ff5eac]/60 bg-[#ff5eac]/10 text-[#ff5eac] uppercase text-[11px] tracking-[0.2em] hover:bg-[#ff5eac]/20">
                      <Square size={12} className="inline mr-1.5 -translate-y-[1px]"/> Stop
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2" data-testid="duet-segments">
                {result.segments.map((s, i) => {
                  const active = playIdx === i && playing;
                  return (
                    <div key={`${s.voice_id}-${s.index}-${s.url}`}
                         data-testid={`duet-segment-${i}`}
                         className="flex items-start gap-3 bg-[#0d0d10] border rounded-[3px] p-3 transition-all"
                         style={{
                           borderColor: active ? s.color : "#1c1c22",
                           boxShadow: active ? `inset 0 0 16px ${s.color}33` : undefined,
                         }}>
                      <div className="shrink-0 w-[72px] font-mono text-[10px] uppercase tracking-[0.18em]"
                           style={{ color: s.color }}>
                        {s.voice_label}
                      </div>
                      <div className="flex-1 font-serif text-[13px] text-[#f3ece1] leading-relaxed">
                        {s.text}
                      </div>
                      <audio controls src={resolveAudioUrl(s.url)} preload="none"
                             className="hidden sm:block h-7 shrink-0" style={{ width: 180 }}/>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-4 md:space-y-5">
          {/* Voice A */}
          <div className="panel rounded-[6px] p-4 md:p-6" data-testid="duet-voice-a-panel">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-[#f5a524]"/>
              <span className="etched text-[#f5a524]">Voice A · {profA?.label || "—"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {profiles.map((p) => (
                <VoiceTile key={p.id} profile={p} selected={voiceA === p.id}
                           onSelect={setVoiceA} accent="#f5a524"
                           disabled={p.id === voiceB}/>
              ))}
            </div>
          </div>

          {/* Voice B */}
          <div className="panel rounded-[6px] p-4 md:p-6" data-testid="duet-voice-b-panel">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-[#ff5eac]"/>
              <span className="etched text-[#ff5eac]">Voice B · {profB?.label || "—"}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {profiles.map((p) => (
                <VoiceTile key={p.id} profile={p} selected={voiceB === p.id}
                           onSelect={setVoiceB} accent="#ff5eac"
                           disabled={p.id === voiceA}/>
              ))}
            </div>
          </div>

          {/* Ignite */}
          <div className="panel rounded-[6px] p-4 md:p-6 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-40"
                 style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,94,172,0.25), transparent 70%)" }}/>
            <button
              onClick={generate}
              disabled={loading}
              data-testid="duet-generate-btn"
              className="relative w-full py-5 rounded-[4px] border-2 border-[#ff5eac]
                         bg-gradient-to-b from-[#ff5eac] via-[#b94081] to-[#4a1a33]
                         text-[#1a0008] uppercase tracking-[0.26em] text-[12px] md:text-[14px] font-bold
                         hover:brightness-110 transition animate-amber
                         disabled:opacity-60 disabled:cursor-not-allowed">
              <Users size={16} className="inline mr-2 -translate-y-[1px]"/>
              {loading ? "Synthesizing duet…" : "Generate Duet"}
            </button>
            {err && <div className="mt-3 text-[12px] text-[#ff5eac] font-mono text-center" data-testid="duet-err">{err}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
