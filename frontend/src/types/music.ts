/**
 * Lyrica 3 Pro - Shared Types
 * Type definitions for tracks, generation, and API contracts
 */

export interface Track {
  id: string;
  name: string;
  emotion: 'pain' | 'playful' | 'mirror';
  bpm: number;
  key: string;
  intensity: number;
  vocals: {
    breathIntensity: number;
    vocalFryAmount: number;
    emotionalBreakFreq: number;
    proximityEffect: number;
    closedMouthResonance: boolean;
  };
  drums: {
    swing: number;
    snareDrag: number;
    grooveType: 'straight' | 'lazy' | 'locked';
  };
  instrumentation: {
    chordQuality: 'major7' | 'minor9' | 'sus4' | 'diminished';
    warmthBoost: number;
    analogSaturation: number;
    frequencyBump: number;
  };
  vocalPersona: string;
  generatedAt: string;
  waveformData: number[];
  isPlaying: boolean;
  audio?: ArrayBuffer;
  dnaTag?: DNATag;
}

export interface DNATag {
  assetId: string;
  creatorId: string;
  parentAssetId: string | null;
  trackHash: string;
  createdAt: string;
  royaltyRule: 'original_only' | 'linear_equal' | 'exponential_decay';
}

export interface GenerationRequest {
  userId: string;
  emotion: 'pain' | 'playful' | 'mirror';
  intensity: number;
  bpm: number;
  key: string;
  vocalPersona: string;
  vocals: Track['vocals'];
  drums: Track['drums'];
  instrumentation: Track['instrumentation'];
}

export interface RemixRequest {
  sourceTrackId: string;
  remixType: 'keep-lyrics' | 'stem-isolate' | 'variations' | 'tempo-shift';
  userId: string;
}

export interface ExportRequest {
  trackId: string;
  format: 'wav' | 'mp3' | 'flac';
  quality: '16' | '24';
  sampleRate: '44.1' | '48';
}

export interface StudioSession {
  id: string;
  userId: string;
  tracks: Track[];
  currentTrackId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export interface GenreTemplate {
  name: string;
  defaultBpm: number;
  defaultKey: string;
  emotionBias: Record<string, number>;
  instrumentationPreset: Track['instrumentation'];
  drumsPreset: Track['drums'];
}

// Genre definitions
export const GENRE_TEMPLATES: Record<string, GenreTemplate> = {
  'chicano-soul': {
    name: 'Chicano Soul',
    defaultBpm: 92,
    defaultKey: 'E-Minor',
    emotionBias: { pain: 0.7, playful: 0.2, mirror: 0.1 },
    instrumentationPreset: {
      chordQuality: 'minor9',
      warmthBoost: 85,
      analogSaturation: 70,
      frequencyBump: 280,
    },
    drumsPreset: {
      swing: 15,
      snareDrag: 18,
      grooveType: 'lazy',
    },
  },
  'corrido-tumbado': {
    name: 'Corrido Tumbado',
    defaultBpm: 88,
    defaultKey: 'A-Minor',
    emotionBias: { pain: 0.6, playful: 0.3, mirror: 0.1 },
    instrumentationPreset: {
      chordQuality: 'minor9',
      warmthBoost: 75,
      analogSaturation: 60,
      frequencyBump: 250,
    },
    drumsPreset: {
      swing: 12,
      snareDrag: 20,
      grooveType: 'locked',
    },
  },
  'souldies': {
    name: 'Souldies',
    defaultBpm: 78,
    defaultKey: 'D-Minor',
    emotionBias: { pain: 0.8, playful: 0.1, mirror: 0.1 },
    instrumentationPreset: {
      chordQuality: 'major7',
      warmthBoost: 90,
      analogSaturation: 80,
      frequencyBump: 300,
    },
    drumsPreset: {
      swing: 20,
      snareDrag: 25,
      grooveType: 'lazy',
    },
  },
  'late-night-drift': {
    name: 'Late Night Drive',
    defaultBpm: 76,
    defaultKey: 'B-Minor',
    emotionBias: { pain: 0.5, playful: 0.4, mirror: 0.1 },
    instrumentationPreset: {
      chordQuality: 'sus4',
      warmthBoost: 80,
      analogSaturation: 65,
      frequencyBump: 200,
    },
    drumsPreset: {
      swing: 10,
      snareDrag: 12,
      grooveType: 'lazy',
    },
  },
};

export const VOCAL_PERSONAS = [
  'Hurting Girl',
  'ShadyBoy',
  'Duo (Girl + Boy)',
  'Choir (3+)',
  'Spoken Word',
  'Ad-lib Only',
];

export const KEYS = [
  'C-Major',
  'B-Minor',
  'D-Major',
  'A-Minor',
  'E-Major',
  'C#-Minor',
  'G-Major',
  'E-Minor',
  'F-Major',
  'D-Minor',
];

export const CHORD_QUALITIES = [
  {
    value: 'major7' as const,
    label: 'Major 7th (Bright with Bruise)',
  },
  {
    value: 'minor9' as const,
    label: 'Minor 9th (Deep Warmth)',
  },
  {
    value: 'sus4' as const,
    label: 'Sus4 (Unresolved Tension)',
  },
  {
    value: 'diminished' as const,
    label: 'Diminished (Dark, Complex)',
  },
];
