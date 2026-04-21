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

  // primary synth badge
  const isReplicate = (synth || "").startsWith("replicate");
  const primary = isReplicate
    ? { label: "Replicate", icon: Music, color: "#46d37e", bg: "rgba(70,211,126,0.12)", border: "rgba(70,211,126,0.5)" }
    : { label: "Fallback",  icon: Sparkles, color: "#f5a524", bg: "rgba(245,165,36,0.12)", border: "rgba(245,165,36,0.45)" };

  const hasVoice = (voice || "").startsWith("openai:tts");

  return (
    <div className="flex items-center gap-1.5 flex-wrap" data-testid="provider-badge">
      <span
        className={`inline-flex items-center gap-1 ${pad} rounded-full border font-mono uppercase tracking-[0.12em]`}
        style={{ color: primary.color, background: primary.bg, borderColor: primary.border,
                 boxShadow: `inset 0 0 8px ${primary.bg}` }}
        data-testid={isReplicate ? "badge-synth-replicate" : "badge-synth-fallback"}>
        <primary.icon size={icon}/>
        <span>♫ {primary.label}</span>
      </span>
      {hasVoice && (
        <span
          className={`inline-flex items-center gap-1 ${pad} rounded-full border font-mono uppercase tracking-[0.12em]`}
          style={{ color: "#ff5eac", background: "rgba(255,94,172,0.10)", borderColor: "rgba(255,94,172,0.45)" }}
          data-testid="badge-voice-openai">
          <Mic2 size={icon}/>
          <span>OpenAI TTS</span>
        </span>
      )}
    </div>
  );
}
