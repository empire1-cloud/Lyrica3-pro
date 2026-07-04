import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Send, Mic2, Heart, Music, Sparkles,
  Repeat2 as Repeat, Quote
} from 'lucide-react';
import { cn } from '../../radio/lib/utils';
import type { InputType, ListenerInput } from './ai/interpretListenerInput';

export const INPUT_TYPE_OPTIONS: { value: InputType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "lyrics", label: "Lyrics", icon: <Quote className="w-3 h-3" />, description: "Share your own lyrics" },
  { value: "feeling", label: "Feeling", icon: <Heart className="w-3 h-3" />, description: "Describe a mood or vibe" },
  { value: "dedication", label: "Dedication", icon: <Sparkles className="w-3 h-3" />, description: "Dedicate a moment" },
  { value: "shoutout", label: "Shoutout", icon: <Mic2 className="w-3 h-3" />, description: "Give a shoutout" },
  { value: "vibe_request", label: "Vibe", icon: <Music className="w-3 h-3" />, description: "Request a vibe change" },
  { value: "remix_request", label: "Remix", icon: <Repeat className="w-3 h-3" />, description: "Suggest a remix idea" },
];

interface ListenerInputPanelProps {
  sessionId: string;
  userId?: string;
  onSubmit: (input: ListenerInput) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

export function ListenerInputPanel({ sessionId, userId, onSubmit, isProcessing, disabled }: ListenerInputPanelProps) {
  const [inputType, setInputType] = useState<InputType>("feeling");
  const [text, setText] = useState("");
  const [showTypePicker, setShowTypePicker] = useState(false);

  const selectedType = INPUT_TYPE_OPTIONS.find(o => o.value === inputType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isProcessing || disabled) return;

    onSubmit({
      sessionId,
      userId,
      inputType,
      text: text.trim(),
      submittedAt: new Date().toISOString(),
    });

    setText("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowTypePicker(!showTypePicker)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold tracking-widest uppercase transition-all",
            showTypePicker
              ? "bg-pink-500/20 border-pink-500/30 text-pink-500"
              : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
          )}
        >
          {selectedType?.icon}
          {selectedType?.label}
        </button>
        <span className="text-[8px] font-mono text-white/20">
          {selectedType?.description}
        </span>
      </div>

      {showTypePicker && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          className="flex flex-wrap gap-1.5"
        >
          {INPUT_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setInputType(opt.value);
                setShowTypePicker(false);
              }}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[8px] font-bold tracking-widest uppercase transition-all",
                inputType === opt.value
                  ? "bg-pink-500/20 border-pink-500/30 text-pink-500"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            inputType === "lyrics" ? "Type your lyrics..." :
            inputType === "feeling" ? "How does this moment feel?" :
            inputType === "dedication" ? "Who is this for?" :
            inputType === "shoutout" ? "Who do you want to shout out?" :
            inputType === "vibe_request" ? "What vibe do you want?" :
            "Describe your remix idea..."
          }
          disabled={isProcessing || disabled}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 transition-colors pr-12 disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={!text.trim() || isProcessing || disabled}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 p-2 transition-all rounded-lg",
            isProcessing
              ? "text-pink-500 animate-pulse"
              : "text-pink-500 hover:text-white hover:bg-pink-500/20"
          )}
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
