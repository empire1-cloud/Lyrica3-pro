import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic2, Heart, Music, Quote, Repeat2 as Repeat, Sparkles,
  MessageSquare, Activity, Zap, Shield, AlertTriangle
} from 'lucide-react';
import { cn } from '../../radio/lib/utils';
import type { ListenerInput, InterpretedInput, InputType } from './ai/interpretListenerInput';
import type { DjResponse, DjResponseType } from './ai/generateDjResponse';

export interface SubmissionEntry {
  id: string;
  input: ListenerInput;
  interpretation: InterpretedInput;
  djResponse: DjResponse;
  timestamp: string;
}

const INPUT_TYPE_ICONS: Record<InputType, React.ReactNode> = {
  lyrics: <Quote className="w-3 h-3" />,
  feeling: <Heart className="w-3 h-3" />,
  dedication: <Sparkles className="w-3 h-3" />,
  shoutout: <Mic2 className="w-3 h-3" />,
  vibe_request: <Music className="w-3 h-3" />,
  remix_request: <Repeat className="w-3 h-3" />,
};

const INPUT_TYPE_COLORS: Record<InputType, string> = {
  lyrics: "text-pink-500 border-pink-500/30 bg-pink-500/10",
  feeling: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  dedication: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  shoutout: "text-green-400 border-green-400/30 bg-green-400/10",
  vibe_request: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  remix_request: "text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-400/10",
};

const RESPONSE_TYPE_ICONS: Record<DjResponseType, React.ReactNode> = {
  shoutout: <Mic2 className="w-3 h-3" />,
  vibe_shift: <Activity className="w-3 h-3" />,
  hook_idea: <Music className="w-3 h-3" />,
  dj_drop: <Zap className="w-3 h-3" />,
  queue_change: <Repeat className="w-3 h-3" />,
  remix_seed: <Sparkles className="w-3 h-3" />,
};

const RESPONSE_TYPE_LABELS: Record<DjResponseType, string> = {
  shoutout: "Shoutout",
  vibe_shift: "Vibe Shift",
  hook_idea: "Hook Idea",
  dj_drop: "DJ Drop",
  queue_change: "Queue Change",
  remix_seed: "Remix Seed",
};

const EMOTION_EMOJIS: Record<string, string> = {
  joy: "✨",
  sadness: "💙",
  anger: "🔥",
  love: "💜",
  nostalgia: "🌙",
  excitement: "⚡",
  melancholy: "🌧",
  neutral: "🎵",
};

interface LiveSubmissionsFeedProps {
  submissions: SubmissionEntry[];
  maxVisible?: number;
}

export function LiveSubmissionsFeed({ submissions, maxVisible = 30 }: LiveSubmissionsFeedProps) {
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [submissions.length]);

  const visible = submissions.slice(-maxVisible);

  return (
    <div className="space-y-3">
      {visible.length === 0 && (
        <div className="text-center py-8 text-white/20">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-[10px] font-mono uppercase tracking-widest">
            Waiting for listener input...
          </p>
          <p className="text-[8px] font-mono text-white/10 mt-1">
            Submit a lyric, feeling, dedication, or vibe to shape the session
          </p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {visible.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            {/* Listener Input */}
            <div className="flex items-start gap-2">
              <div className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border",
                INPUT_TYPE_COLORS[entry.input.inputType]
              )}>
                {INPUT_TYPE_ICONS[entry.input.inputType]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">
                    {entry.input.userId || "Listener"}
                  </span>
                  <span className={cn(
                    "text-[7px] font-mono uppercase tracking-widest px-1 py-0.5 rounded",
                    INPUT_TYPE_COLORS[entry.input.inputType]
                  )}>
                    {entry.input.inputType.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-white/90 mt-0.5 leading-relaxed">
                  {entry.input.text}
                </p>
                {/* Emotion/Vibe tags */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px]">
                    {EMOTION_EMOJIS[entry.interpretation.detectedEmotion.toLowerCase()] || "🎵"}
                  </span>
                  <span className="text-[8px] font-mono text-white/30 capitalize">
                    {entry.interpretation.detectedEmotion}
                  </span>
                  <span className="text-white/10">·</span>
                  <span className="text-[8px] font-mono text-white/30 capitalize">
                    {entry.interpretation.detectedVibe}
                  </span>
                  {entry.interpretation.isOriginalLyrics && (
                    <span className="flex items-center gap-0.5 text-[7px] font-mono text-fuchsia-400/60 uppercase tracking-wider">
                      <Shield className="w-2 h-2" /> Original
                    </span>
                  )}
                  {entry.interpretation.isCopyrightedReference && (
                    <span className="flex items-center gap-0.5 text-[7px] font-mono text-red-400/60 uppercase tracking-wider">
                      <AlertTriangle className="w-2 h-2" /> Reference
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* AI DJ Response */}
            <div className="ml-8 pl-3 border-l-2 border-pink-500/20 space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-pink-500 text-[8px] font-mono uppercase tracking-widest">
                  <span>🤖 AI DJ</span>
                  <span className="text-white/20">·</span>
                  <span className="flex items-center gap-1">
                    {RESPONSE_TYPE_ICONS[entry.djResponse.responseType]}
                    {RESPONSE_TYPE_LABELS[entry.djResponse.responseType]}
                  </span>
                </div>
              </div>
              <p className="text-sm text-white/70 italic leading-relaxed">
                "{entry.djResponse.djMessage}"
              </p>

              {/* Suggested music change indicator */}
              {entry.djResponse.suggestedMusicChange && (
                <div className="flex items-center gap-2 mt-1">
                  <Activity className="w-2.5 h-2.5 text-white/20" />
                  {entry.djResponse.suggestedMusicChange.bpmShift && (
                    <span className={cn(
                      "text-[8px] font-mono",
                      entry.djResponse.suggestedMusicChange.bpmShift > 0 ? "text-green-400/60" : "text-blue-400/60"
                    )}>
                      BPM {entry.djResponse.suggestedMusicChange.bpmShift > 0 ? "+" : ""}{entry.djResponse.suggestedMusicChange.bpmShift}
                    </span>
                  )}
                  {entry.djResponse.suggestedMusicChange.energy && (
                    <span className={cn(
                      "text-[8px] font-mono",
                      entry.djResponse.suggestedMusicChange.energy > 0 ? "text-fuchsia-400/60" : "text-blue-400/60"
                    )}>
                      Energy {(entry.djResponse.suggestedMusicChange.energy * 100).toFixed(0)}%
                    </span>
                  )}
                  {entry.djResponse.suggestedMusicChange.genre && (
                    <span className="text-[8px] font-mono text-white/30">
                      → {entry.djResponse.suggestedMusicChange.genre}
                    </span>
                  )}
                </div>
              )}

              {/* Ownership event badge */}
              {entry.djResponse.ownershipEventRequired && (
                <div className="flex items-center gap-1 mt-1 text-[7px] font-mono text-fuchsia-400/60 uppercase tracking-wider">
                  <Shield className="w-2 h-2" />
                  Ownership event logged — Archisynapse
                </div>
              )}

              {/* Hook / Drop / Remix extras */}
              {entry.djResponse.hookIdea && (
                <div className="mt-1 p-2 bg-pink-500/5 border border-pink-500/10 rounded-lg">
                  <p className="text-[9px] font-bold text-pink-500/80 uppercase tracking-widest">Hook Idea</p>
                  <p className="text-xs text-white/60 italic mt-0.5">"{entry.djResponse.hookIdea}"</p>
                </div>
              )}
              {entry.djResponse.dropText && (
                <div className="mt-1 p-2 bg-cyan-500/5 border border-cyan-500/10 rounded-lg">
                  <p className="text-[9px] font-bold text-cyan-400/80 uppercase tracking-widest">DJ Drop</p>
                  <p className="text-xs text-white/60 mt-0.5">"{entry.djResponse.dropText}"</p>
                </div>
              )}
              {entry.djResponse.remixSeed && (
                <div className="mt-1 p-2 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                  <p className="text-[9px] font-bold text-purple-400/80 uppercase tracking-widest">Remix Seed</p>
                  <p className="text-xs text-white/60 mt-0.5">"{entry.djResponse.remixSeed}"</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={feedEndRef} />
    </div>
  );
}
