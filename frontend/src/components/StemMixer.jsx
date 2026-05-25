import React, { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import Fader from "./Fader";

/**
 * 4-stem mixer.
 * - Real HTMLAudio playback synced across 4 stems.
 * - Fader value sets audio.volume.
 * - Simulated frequency visualizer: levels + time-driven spikes that mimic
 *   vocal-fry / emotional-crack detection on the vocal stem → triggers biometric pulse.
 * - CORS-free: no Web Audio AnalyserNode (SoundHelix doesn't send CORS headers).
 */
export default function StemMixer({ stems, onStemsChange, onPulse }) {
  const audios = useRef([]);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [peaks, setPeaks] = useState(stems.map((s) => s.peak || 0.5));
  const tickRef = useRef(0);
  const lastPulseRef = useRef(0);

  // (re)build audio elements whenever src list changes
  useEffect(() => {
    // teardown old
    audios.current.forEach((a) => { try { a.pause(); } catch {} });
    audios.current = stems.map((s) => {
      const a = new Audio();
      const url = s.src
        ? (s.src.startsWith("http") || s.src.startsWith("blob:")
            ? s.src
            : `${process.env.REACT_APP_BACKEND_URL}${s.src}`)
        : "";
      a.src = url;
      a.loop = true;
      a.preload = "auto";
      a.volume = s.level;
      return a;
    });
    const first = audios.current[0];
    setLoaded(false);
    const mark = () => setLoaded(true);
    if (first) {
      first.addEventListener("canplay", mark, { once: true });
      // some browsers already have it cached
      if (first.readyState >= 3) setLoaded(true);
    }
    return () => {
      audios.current.forEach((a) => { try { a.pause(); } catch {} });
      if (first) first.removeEventListener("canplay", mark);
    };
    // eslint-disable-next-line
  }, [stems.map((s) => s.src).join("|")]);

  // volume sync
  useEffect(() => {
    audios.current.forEach((a, i) => {
      if (a && stems[i]) a.volume = Math.max(0, Math.min(1, stems[i].level));
    });
  }, [stems]);

  // visualizer + biometric pulse loop
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      tickRef.current += 1;
      const t = tickRef.current;
      const next = stems.map((s, i) => {
        // baseline oscillation per stem
        const osc = 0.45 + 0.4 * Math.abs(Math.sin(t * 0.18 + i * 1.3));
        const jitter = Math.random() * 0.2;
        const v = Math.min(1, (osc + jitter) * (0.45 + s.level * 0.75));
        return v;
      });
      setPeaks(next);

      // vocal fry / emotional crack detection (simulated) on vocal stem (index 0)
      const vocalPeak = next[0];
      if (onPulse && vocalPeak > 0.82 && stems[0].level > 0.2) {
        const now = Date.now();
        if (now - lastPulseRef.current > 1400) {
          lastPulseRef.current = now;
          onPulse(vocalPeak);
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, [playing, stems, onPulse]);

  const toggle = async () => {
    if (playing) {
      audios.current.forEach((a) => a.pause());
      setPlaying(false);
      return;
    }
    try {
      // promise-based play for autoplay-policy compliance
      await Promise.all(
        audios.current.map((a) =>
          a.play().catch((err) => {
            console.warn("audio play blocked", err);
          })
        )
      );
      setPlaying(true);
    } catch (e) {
      console.warn("transport fail", e);
    }
  };

  const setLevel = (i, v) => {
    const next = stems.map((s, idx) => (idx === i ? { ...s, level: v } : s));
    onStemsChange(next);
  };

  return (
    <div className="panel rounded-[6px] p-4 md:p-6">
      <div className="flex items-center justify-between mb-5 md:mb-6 gap-3 flex-wrap">
        <div>
          <div className="etched text-[#9CA3B0]">Console · 4-Track Stem Mixer</div>
          <div className="font-display text-[#F5F7FA] text-base md:text-lg mt-1 tracking-tight">
            Sonance Pro · SSL-Rack I
          </div>
        </div>
        <button
          data-testid="mixer-play-btn"
          onClick={toggle}
          className={`group relative px-4 md:px-5 py-2.5 md:py-3 rounded-[3px] border flex items-center gap-2 uppercase text-[10px] md:text-[11px] tracking-[0.2em] transition-all
            ${
              playing
                ? "bg-[#FF2EBE]/15 border-[#FF2EBE]/60 text-[#ffb3d5] animate-amber"
                : "bg-[#F5C542]/10 border-[#F5C542]/50 text-[#F5C542] hover:bg-[#F5C542]/20"
            }`}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? "Transport · Running" : loaded ? "Engage Transport" : "Loading stems…"}
        </button>
      </div>

      <div className="flex items-start justify-around gap-2 md:gap-4 pt-4 pb-2 border-t border-b border-[#0E0F17] overflow-x-auto">
        {stems.map((s, i) => (
          <Fader
            key={s.name}
            label={s.name}
            value={s.level}
            peak={peaks[i] || 0.5}
            color={["#F5C542", "#FF2EBE", "#FF2EBE", "#00E6FF"][i]}
            onChange={(v) => setLevel(i, v)}
            testId={`fader-${i}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 text-[9px] md:text-[10px] font-mono text-[#6B7280] uppercase tracking-[0.18em] flex-wrap gap-2">
        <span>◉ REC armed</span>
        <span className={playing ? "text-[#FF2EBE]" : ""}>◈ Bus · Master</span>
        <span className="hidden sm:inline">◇ Tape · VHS-Sat</span>
        <span>⟡ 44.1 / 24b</span>
      </div>
    </div>
  );
}
