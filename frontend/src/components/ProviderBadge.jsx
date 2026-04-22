import React from "react";
import { Music, Sparkles, Mic2 } from "lucide-react";

/**
 * ProviderBadge — black-box safe UI adapter.
 * In black-box mode provider internals are hidden server-side, so this component
 * gracefully renders nothing when metadata is absent.
 */
export default function ProviderBadge({ synth, voice, size = "md" }) {
  if (!synth && !voice) return null;
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
