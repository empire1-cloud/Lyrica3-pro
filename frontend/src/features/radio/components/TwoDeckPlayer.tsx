import React from 'react';
import { motion } from 'motion/react';
import { Play, Pause, SkipForward, Repeat2 as Repeat, Crosshair as Crossfade, Music } from 'lucide-react';
import { cn } from '../../../components/ui/utils';
import type { DeckState, MixState } from '../engines/RadioMixEngine';
import { calculateCrossfadeVolumes } from '../engines/RadioMixEngine';
import type { DJAction } from '../engines/TransitionEngine';

interface TwoDeckPlayerProps {
  mixState: MixState;
  onTogglePlay: (deck: "A" | "B") => void;
  onCrossfaderChange: (value: number) => void;
  onLoopToggle: (deck: "A" | "B") => void;
  onLoopBarsChange: (deck: "A" | "B") => void;
  onNextTrack: (deck: "A" | "B") => void;
  actions: DJAction[];
}

function DeckDisplay({ deck, label, color, isActive, onTogglePlay, onLoopToggle, onNextTrack }: {
  deck: DeckState;
  label: string;
  color: string;
  isActive: boolean;
  onTogglePlay: () => void;
  onLoopToggle: () => void;
  onNextTrack: () => void;
}) {
  return (
    <div className={cn(
      "flex-1 p-4 rounded-2xl border transition-all duration-300",
      deck.isPlaying
        ? `bg-gradient-to-br ${color}/10 border-${color.split(" ")[0].replace("from-", "")}/30`
        : "bg-white/5 border-white/10"
    )}>
      {/* Deck Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            deck.isPlaying ? "bg-green-500 animate-pulse" : "bg-white/20"
          )} />
          <span className="text-[10px] font-bold tracking-widest uppercase">{label}</span>
          {isActive && (
            <span className="text-[7px] font-mono text-fuchsia-500 uppercase tracking-wider bg-fuchsia-500/10 px-1.5 py-0.5 rounded">
              Active
            </span>
          )}
        </div>
        <span className="text-[9px] font-mono text-white/40">{deck.bpm} BPM</span>
      </div>

      {/* Track Info */}
      <div className="mb-3 min-h-[40px]">
        {deck.trackTitle ? (
          <>
            <p className="text-xs font-bold truncate">{deck.trackTitle}</p>
            {deck.trackArtist && (
              <p className="text-[10px] text-white/40 truncate">{deck.trackArtist}</p>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-white/20">
            <Music className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {deck.duration > 0 && (
        <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-3">
          <motion.div
            animate={{ width: `${(deck.currentTime / deck.duration) * 100}%` }}
            className={cn("h-full rounded-full", color.split(" ")[0].replace("from-", "bg-"))}
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={onTogglePlay}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all",
              deck.isPlaying
                ? `bg-gradient-to-r ${color} text-black shadow-lg`
                : "bg-white/10 text-white/60 hover:bg-white/20"
            )}
          >
            {deck.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <button
            onClick={onNextTrack}
            className="w-6 h-6 rounded-full bg-white/5 text-white/30 hover:text-white/60 hover:bg-white/10 flex items-center justify-center transition-all"
          >
            <SkipForward className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onLoopToggle}
            className={cn(
              "px-1.5 py-1 rounded text-[7px] font-mono uppercase tracking-wider transition-all",
              deck.loopActive
                ? "bg-fuchsia-500/20 text-fuchsia-500 border border-fuchsia-500/30"
                : "text-white/20 hover:text-white/40"
            )}
          >
            <Repeat className="w-3 h-3" />
          </button>
          {deck.loopActive && (
            <span className="text-[7px] font-mono text-fuchsia-500/60">{deck.loopBars} bars</span>
          )}
        </div>
      </div>

      {/* Volume */}
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <span className="text-[7px] font-mono text-white/20 uppercase">Vol</span>
          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${deck.volume * 100}%` }}
              className={cn("h-full rounded-full", color.split(" ")[0].replace("from-", "bg-"))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TwoDeckPlayer({ mixState, onTogglePlay, onCrossfaderChange, onLoopToggle, onNextTrack, actions }: TwoDeckPlayerProps) {
  const { volA, volB } = calculateCrossfadeVolumes(mixState.crossfader);
  const recentActions = actions.slice(-5);

  return (
    <div className="space-y-4">
      {/* Decks */}
      <div className="flex gap-3">
        <DeckDisplay
          deck={mixState.deckA}
          label="Deck A"
          color="from-fuchsia-500 to-pink-600"
          isActive={mixState.activeDeck === "A"}
          onTogglePlay={() => onTogglePlay("A")}
          onLoopToggle={() => onLoopToggle("A")}
          onNextTrack={() => onNextTrack("A")}
        />
        <DeckDisplay
          deck={mixState.deckB}
          label="Deck B"
          color="from-blue-500 to-purple-600"
          isActive={mixState.activeDeck === "B"}
          onTogglePlay={() => onTogglePlay("B")}
          onLoopToggle={() => onLoopToggle("B")}
          onNextTrack={() => onNextTrack("B")}
        />
      </div>

      {/* Crossfader */}
      <div className="px-2">
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-mono text-white/20 uppercase w-6">A</span>
          <div className="flex-1 relative h-6">
            <div className="absolute inset-0 flex items-center">
              <div className="flex-1 h-1 bg-white/5 rounded-full">
                <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500/50 via-red-500 to-blue-500/50"
                  style={{ width: `${((mixState.crossfader + 1) / 2) * 100}%` }}
                />
              </div>
            </div>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={mixState.crossfader}
              onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <motion.div
              animate={{ left: `${((mixState.crossfader + 1) / 2) * 100}%` }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-white/20"
            />
          </div>
          <span className="text-[8px] font-mono text-white/20 uppercase w-6 text-right">B</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[7px] font-mono text-white/10">{volA.toFixed(0)}%</span>
          <span className="text-[7px] font-mono text-white/10">{volB.toFixed(0)}%</span>
        </div>
      </div>

      {/* Recent DJ Actions */}
      {recentActions.length > 0 && (
        <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-[8px] font-mono text-white/20 uppercase tracking-wider mb-2">DJ Action Log</p>
          <div className="space-y-1">
            {recentActions.map((action) => (
              <div key={action.id} className="flex items-start gap-2 text-[8px] font-mono">
                <span className={cn(
                  "px-1 py-0.5 rounded uppercase tracking-wider",
                  action.type === "transition" ? "bg-cyan-500/10 text-cyan-400" :
                  action.type === "shoutout" ? "bg-pink-500/10 text-pink-400" :
                  action.type === "dedication" ? "bg-purple-500/10 text-purple-400" :
                  action.type === "vibe_shift" ? "bg-fuchsia-500/10 text-fuchsia-400" :
                  "bg-white/5 text-white/40"
                )}>
                  {action.type}
                </span>
                <span className="text-white/50 flex-1">{action.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
