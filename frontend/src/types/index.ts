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
}

export interface VocalAsset {
  id: string;
  projectId: string;
  ownerId: string;
  prompt: string;
  audioUrl: string;
  duration: number;
  vocalistProfile?: string;
  biometricTags?: string[];
  vulnerabilityScore?: number;
  renderTier: 'DRAFT' | 'PREVIEW' | 'FINAL';
  createdAt: Date | null;
  tags: string[];
}

export interface SfxAsset {
  id: string;
  projectId: string;
  ownerId: string;
  prompt: string;
  audioUrl: string;
  duration: number;
  material?: string;
  environment?: string;
  renderTier: 'DRAFT' | 'PREVIEW' | 'FINAL';
  createdAt: Date | null;
  tags: string[];
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
