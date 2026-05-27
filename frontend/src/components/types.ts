export interface MusicAsset {
  id: string;
  name: string;
  createdAt: string;
  category?: string;
  meta: { genre: string; bpm: number; key: string };
  urls: { fullMix?: string; drums?: string; bass?: string; melody?: string; atmosphere?: string; processed?: string; dry?: string; main?: string };
}

export interface VocalAsset {
  id: string;
  name?: string;
  createdAt: string;
  category?: string;
  projectId?: string;
  authorUid?: string;
  meta: { emotionProfile: string; language: string; performerDNA?: Record<string, number>; sections?: unknown[] };
  type: string;
  urls: { processed?: string; dry?: string };
}

export interface SfxAsset {
  id: string;
  name?: string;
  createdAt: string;
  category?: string;
  projectId?: string;
  type?: string;
  authorUid?: string;
  meta: { material: string; environment: string; mass: string | number; frequency: string; envelope?: string };
  urls: { main?: string };
}

export interface AmbientAsset {
  id: string;
  name: string;
  createdAt: string;
  category?: string;
  meta: { elements: string; duration: number; loopable: boolean };
  urls: { main?: string };
}

export interface Project {
  id: string;
  name: string;
  title?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}
