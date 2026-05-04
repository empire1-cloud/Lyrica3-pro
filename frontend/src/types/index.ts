/**
 * types/index.ts — SLA-113 Empire / Lyrica3 Pro shared type definitions
 * Canonical data shapes for audio assets, projects, and pipeline payloads.
 */

export interface Project {
  id: string;
  title: string;
  ownerId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface MusicAsset {
  id: string;
  projectId: string;
  ownerId: string;
  prompt: string;
  audioUrl: string;
  duration: number;
  bpm?: number;
  key?: string;
  genre?: string;
  vibeMatrix?: string;
  rhythmMatrix?: string;
  vulnerabilityScore?: number;
  renderTier: 'DRAFT' | 'PREVIEW' | 'FINAL';
  createdAt: Date | null;
  tags: string[];
  category?: string;
  meta?: {
    genre?: string;
    bpm?: number;
    key?: string;
    [key: string]: unknown;
  };
  urls?: {
    drums?: string;
    bass?: string;
    melody?: string;
    atmosphere?: string;
    processed?: string;
    dry?: string;
    main?: string;
    [key: string]: string | undefined;
  };
}

export interface VocalAsset {
  id: string;
  projectId: string;
  ownerId: string;
  authorUid?: string;
  prompt: string;
  audioUrl: string;
  duration: number;
  type?: string;
  vocalistProfile?: string;
  biometricTags?: string[];
  vulnerabilityScore?: number;
  performerDNA?: string;
  sections?: unknown[];
  renderTier: 'DRAFT' | 'PREVIEW' | 'FINAL';
  createdAt: Date | null;
  tags: string[];
  category?: string;
  meta?: {
    emotionProfile?: string;
    language?: string;
    performerDNA?: string;
    sections?: unknown[];
    [key: string]: unknown;
  };
  urls?: {
    processed?: string;
    dry?: string;
    main?: string;
    [key: string]: string | undefined;
  };
}

export interface SfxAsset {
  id: string;
  projectId: string;
  ownerId: string;
  authorUid?: string;
  prompt: string;
  audioUrl: string;
  duration: number;
  material?: string;
  environment?: string;
  renderTier: 'DRAFT' | 'PREVIEW' | 'FINAL';
  createdAt: Date | null;
  tags: string[];
  category?: string;
  meta?: {
    material?: string;
    environment?: string;
    mass?: string;
    frequency?: string;
    type?: string;
    [key: string]: unknown;
  };
  urls?: {
    main?: string;
    processed?: string;
    dry?: string;
    [key: string]: string | undefined;
  };
}

export interface AmbientAsset {
  id: string;
  projectId: string;
  ownerId: string;
  prompt: string;
  audioUrl: string;
  duration: number;
  atmosphere?: string;
  renderTier: 'DRAFT' | 'PREVIEW' | 'FINAL';
  createdAt: Date | null;
  tags: string[];
  category?: string;
  meta?: {
    elements?: string;
    duration?: number;
    loopable?: boolean;
    [key: string]: unknown;
  };
  urls?: {
    main?: string;
    processed?: string;
    [key: string]: string | undefined;
  };
}

export interface SoulfirePayload {
  track_id: string;
  title: string;
  vibe_matrix: string;
  rhythm_matrix: string;
  vulnerability_score: number;
  duo: boolean;
  lyrics?: string;
  render_tier: 'DRAFT' | 'PREVIEW' | 'FINAL';
  territory?: string;
  royalty_split?: Record<string, number>;
  biometric_tags?: string[];
  dsp_automation?: Record<string, unknown>;
  groove_pattern?: unknown;
  mastering_bus?: Record<string, unknown>;
}

export interface Track {
  trackMetadata: {
    title: string;
    core_genre?: string;
    s2_mutation?: string;
    dna_tag_preview?: string;
    [key: string]: unknown;
  };
  acousticPrimitives?: {
    groove?: string;
    texture?: string;
    [key: string]: unknown;
  };
  vocalPipelines?: Array<{ id: string; active: boolean; intensity: number }>;
  audioUrl?: string;
  [key: string]: unknown;
}
