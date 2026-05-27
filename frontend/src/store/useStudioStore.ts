/**
 * store/useStudioStore.ts — Lyrica3 Pro global studio state (Zustand)
 * Manages active project, asset collections, and UI mode.
 */
import { create } from 'zustand';
import type { Project, MusicAsset, VocalAsset, SfxAsset, AmbientAsset } from '../types';

interface StudioStore {
  // Project
  activeProject: Project | null;
  projects: Project[];
  setActiveProject: (project: Project | null) => void;
  setProjects: (projects: Project[]) => void;

  // Assets
  musicAssets: MusicAsset[];
  vocalAssets: VocalAsset[];
  sfxAssets: SfxAsset[];
  ambientAssets: AmbientAsset[];
  addMusicAsset: (asset: MusicAsset) => void;
  addVocalAsset: (asset: VocalAsset) => void;
  addSfxAsset: (asset: SfxAsset) => void;
  addAmbientAsset: (asset: AmbientAsset) => void;
  setMusicAssets: (assets: MusicAsset[]) => void;
  setVocalAssets: (assets: VocalAsset[]) => void;
  setSfxAssets: (assets: SfxAsset[]) => void;
  setAmbientAssets: (assets: AmbientAsset[]) => void;

  // UI
  appMode: 'sonance' | 'universal' | 'orchestrator';
  setAppMode: (mode: 'sonance' | 'universal' | 'orchestrator') => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
}

export const useStudioStore = create<StudioStore>((set) => ({
  activeProject: null,
  projects: [],
  setActiveProject: (project) => set({ activeProject: project }),
  setProjects: (projects) => set({ projects }),

  musicAssets: [],
  vocalAssets: [],
  sfxAssets: [],
  ambientAssets: [],
  addMusicAsset: (asset) => set((s) => ({ musicAssets: [...s.musicAssets, asset] })),
  addVocalAsset: (asset) => set((s) => ({ vocalAssets: [...s.vocalAssets, asset] })),
  addSfxAsset: (asset) => set((s) => ({ sfxAssets: [...s.sfxAssets, asset] })),
  addAmbientAsset: (asset) => set((s) => ({ ambientAssets: [...s.ambientAssets, asset] })),
  setMusicAssets: (assets) => set({ musicAssets: assets }),
  setVocalAssets: (assets) => set({ vocalAssets: assets }),
  setSfxAssets: (assets) => set({ sfxAssets: assets }),
  setAmbientAssets: (assets) => set({ ambientAssets: assets }),

  appMode: 'sonance',
  setAppMode: (mode) => set({ appMode: mode }),
  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),
}));
