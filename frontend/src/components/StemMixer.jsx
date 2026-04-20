import React, { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import Fader from "./Fader";

/**
 * 4-stem audio mixer. Each stem gets its own HTMLAudio element, volumes tied
 * to fader values. Play/pause is global. Tracks sync to the same position.
 */
export default function StemMixer({ stems, onStemsChange }) {
  const audios = useRef(stems.map(() => new Audio()));
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [peaks, setPeaks] = useState(stems.map(s => s.peak || 0.5));

  // wire sources once
  useEffect(() => {
    audios.current.forEach((a, i) => {
      a.src = stems[i].src || "";
      a.loop = true;
      a.preload = "auto";
      a.crossOrigin = "anonymous";
      a.volume = stems[i].level;
    });
    const first = audios.current[0];
    const mark = () => setLoaded(true);
    first.addEventListener("canplay", mark, { once: true });
    return () => {
      audios.current.forEach(a => { try { a.pause(); } catch {} });
      first.removeEventListener("canplay", mark);
    };
    // eslint-disable-next-line
  }, [stems.map(s=>s.src).join("|")]);

  // keep volumes in sync
  useEffect(() => {
    audios.current.forEach((a, i) => { a.volume = stems[i].level; });
  }, [stems]);

  // animate peaks
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPeaks(stems.map((s) => {
        const base = 0.35 + Math.random() * 0.55;
        return Math.min(1, base * (0.5 + s.level * 0.9));
      }));
    }, 140);
    return () => clearInterval(id);
  }, [playing, stems]);

  const toggle = async () => {
    if (playing) {
      audios.current.forEach(a => a.pause());
      setPlaying(false);
    } else {
      try {
        // sync play
        await Promise.all(audios.current.map(a => a.play()));
        setPlaying(true);
      } catch (e) {
        console.warn("audio play blocked", e);
      }
    }
  };

  const setLevel = (i, v) => {
    const next = stems.map((s, idx) => idx === i ? { ...s, level: v } : s);
    onStemsChange(next);
  };

  return (
    <div className="panel rounded-[6px] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="etched text-[#8a8278]">Console · 4-Track Stem Mixer</div>
          <div className="font-display text-[#f3ece1] text-lg mt-1 tracking-tight">Sonance Pro · SSL-Rack I</div>
        </div>
        <button
          data-testid="mixer-play-btn"
          onClick={toggle}
          className={`group relative px-5 py-3 rounded-[3px] border flex items-center gap-2 uppercase text-[11px] tracking-[0.2em] transition-all
            ${playing
              ? "bg-[#ff5eac]/15 border-[#ff5eac]/60 text-[#ffb3d5] animate-amber"
              : "bg-[#f5a524]/10 border-[#f5a524]/50 text-[#ffd88a] hover:bg-[#f5a524]/20"}`}>
          {playing ? <Pause size={14}/> : <Play size={14}/>}
          {playing ? "Transport · Running" : loaded ? "Engage Transport" : "Loading stems…"}
        </button>
      </div>

      <div className="flex items-start justify-around gap-4 pt-4 pb-2 border-t border-b border-[#1c1c22]">
        {stems.map((s, i) => (
          <Fader
            key={s.name}
            label={s.name}
            value={s.level}
            peak={peaks[i] || 0.5}
            color={["#f5a524", "#ff8a3d", "#ff5eac", "#6a8cff"][i]}
            onChange={(v) => setLevel(i, v)}
            testId={`fader-${i}`}
          />
        ))}
      </div>

      {/* transport indicators */}
      <div className="flex items-center justify-between mt-5 text-[10px] font-mono text-[#6b6257] uppercase tracking-[0.2em]">
        <span>◉ REC armed</span>
        <span className={playing ? "text-[#ff5eac]" : ""}>◈ Bus · Master</span>
        <span>◇ Tape · VHS-Sat</span>
        <span>⟡ 44.1 / 24b</span>
      </div>
    </div>
  );
}
