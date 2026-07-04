export interface MixState {
  deckA: DeckState;
  deckB: DeckState;
  crossfader: number;
  activeDeck: "A" | "B";
}

export interface DeckState {
  isPlaying: boolean;
  volume: number;
  loopActive: boolean;
  loopBars: number;
  currentTime: number;
  duration: number;
  bpm: number;
  key: string;
  trackTitle?: string;
  trackArtist?: string;
}

export function createInitialMixState(): MixState {
  return {
    deckA: createInitialDeckState(),
    deckB: createInitialDeckState(),
    crossfader: 0,
    activeDeck: "A",
  };
}

export function createInitialDeckState(): DeckState {
  return {
    isPlaying: false,
    volume: 0.8,
    loopActive: false,
    loopBars: 4,
    currentTime: 0,
    duration: 0,
    bpm: 120,
    key: "C Major",
  };
}

export function calculateCrossfadeVolumes(crossfader: number): { volA: number; volB: number } {
  const normalized = (crossfader + 1) / 2;
  return {
    volA: Math.max(0, 1 - normalized),
    volB: Math.max(0, normalized),
  };
}

export function getLoopDuration(bars: number, bpm: number): number {
  const secondsPerBeat = 60 / bpm;
  return secondsPerBeat * 4 * bars;
}
