export type TransitionType = "smooth_crossfade" | "hard_cut" | "echo_out" | "slow_fade" | "club_drop" | "beat_switch" | "radio_drop";

export interface Transition {
  type: TransitionType;
  durationMs: number;
  label: string;
}

export const TRANSITIONS: Record<TransitionType, Transition> = {
  smooth_crossfade: { type: "smooth_crossfade", durationMs: 4000, label: "Smooth Crossfade" },
  hard_cut: { type: "hard_cut", durationMs: 0, label: "Hard Cut" },
  echo_out: { type: "echo_out", durationMs: 3000, label: "Echo Out" },
  slow_fade: { type: "slow_fade", durationMs: 8000, label: "Slow Fade" },
  club_drop: { type: "club_drop", durationMs: 2000, label: "Club Drop" },
  beat_switch: { type: "beat_switch", durationMs: 1000, label: "Beat Switch" },
  radio_drop: { type: "radio_drop", durationMs: 3000, label: "Radio Drop" },
};

export function getTransition(type: TransitionType): Transition {
  return TRANSITIONS[type];
}

export function getPreferredTransition(preferences: string[]): Transition {
  const preferred = preferences.filter(p => p in TRANSITIONS);
  if (preferred.length > 0) {
    return TRANSITIONS[preferred[0] as TransitionType];
  }
  return TRANSITIONS.smooth_crossfade;
}

export interface DJAction {
  id: string;
  type: "transition" | "loop" | "shoutout" | "dedication" | "vibe_shift" | "drop";
  description: string;
  timestamp: string;
  transitionType?: TransitionType;
  durationMs?: number;
}

let actionCounter = 0;

export function createDJAction(
  type: DJAction["type"],
  description: string,
  transitionType?: TransitionType,
  durationMs?: number
): DJAction {
  actionCounter++;
  return {
    id: `act_${Date.now()}_${actionCounter}`,
    type,
    description,
    timestamp: new Date().toISOString(),
    transitionType,
    durationMs,
  };
}
