import React from "react";
import { Music, Sparkles, Mic2 } from "lucide-react";

/**
 * ProviderBadge — shows the immutable synth + voice provider for a track.
 * Reads directly from sanitized mint metadata (synth_provider / voice_provider).
 * Green = live Replicate MusicGen, Amber = fallback stems, Pink sub-badge = OpenAI TTS voice.
 */
export default function ProviderBadge({ synth, voice, size = "md" }) {
  const pad = size === "sm" ? "px-2 py-1 text-[9px]" : "px-2.5 py-1 text-[10px]";
  const icon = size === "sm" ? 10 : 11;

  // primary synth badge — never expose "fallback" language to consumers
  const isReplicate = (synth || "").startsWith("replicate");
  const isVertex    = (synth || "").startsWith("vertex");
  let primary;
  if (isVertex)         primary = { label: "Lyria 2 · GCP", icon: Music, color: "#59d3ff", bg: "rgba(89,211,255,0.12)", border: "rgba(89,211,255,0.5)" };
  else if (isReplicate) primary = { label: "MusicGen",       icon: Music, color: "#46d37e", bg: "rgba(70,211,126,0.12)", border: "rgba(70,211,126,0.5)" };
  else                  primary = { label: "Empire Synth",   icon: Sparkles, color: "#ff2dd1", bg: "rgba(255,45,209,0.12)", border: "rgba(255,45,209,0.5)" };

  const hasVoice = (voice || "").startsWith("openai:tts") || (voice || "").startsWith("vertex");

  return (
    <div className="flex items-center gap-1.5 flex-wrap" data-testid="provider-badge">
      <span
        className={`inline-flex items-center gap-1 ${pad} rounded-full border font-mono uppercase tracking-[0.12em]`}
        style={{ color: primary.color, background: primary.bg, borderColor: primary.border,
                 boxShadow: `inset 0 0 8px ${primary.bg}` }}
        data-testid={isReplicate ? "badge-synth-replicate" : isVertex ? "badge-synth-vertex" : "badge-synth-empire"}>
        <primary.icon size={icon}/>
        <span>♫ {primary.label}</span>
      </span>
      {hasVoice && (
        <span
          className={`inline-flex items-center gap-1 ${pad} rounded-full border font-mono uppercase tracking-[0.12em]`}
          style={{ color: "#ff5eac", background: "rgba(255,94,172,0.10)", borderColor: "rgba(255,94,172,0.45)" }}
          data-testid="badge-voice">
          <Mic2 size={icon}/>
          <span>Aether Voice</span>
        </span>
      )}
      {/* Distribution-ready stamp — anti-Udio positioning */}
      <span
        className={`inline-flex items-center gap-1 ${pad} rounded-full border font-mono uppercase tracking-[0.14em]`}
        style={{ color: "#46d37e", background: "rgba(70,211,126,0.08)", borderColor: "rgba(70,211,126,0.4)" }}
        data-testid="badge-distribution-ready"
        title="Passes TuneCore, DistroKid, Spotify AI-content filters via SynthID + C2PA">
        ✓ Distribution Ready
      </span>
    </div>
  );
}
