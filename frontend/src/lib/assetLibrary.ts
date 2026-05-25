/**
 * assetLibrary — Lyrica3 Pro production asset catalog
 * Categories and asset list for the Asset Library browser.
 */

export const CATEGORIES = {
  AI_STYLE_MODEL: 'AI Style Model',
  PROCEDURAL_FX: 'Procedural FX',
  AI_UTILITY: 'AI Utility',
  VOCAL_ENGINE: 'Vocal Engine',
  PRODUCER_KIT: 'Producer Kit',
  FX_PACK: 'FX Pack',
} as const;

export type CategoryKey = typeof CATEGORIES[keyof typeof CATEGORIES];

export interface AssetEntry {
  id: string;
  name: string;
  description: string;
  tags?: string[];
}

export const assetProductionList: Record<CategoryKey, AssetEntry[]> = {
  [CATEGORIES.AI_STYLE_MODEL]: [
    { id: 'asm_soulfire_v1', name: 'Soulfire Alpha', description: 'S2 Disruption Engine style model — warm analog + late-pocket groove' },
    { id: 'asm_lyrica_core', name: 'Lyrica Core', description: 'Core Lyrica3 emotional math model — bright chords, bruised subtext' },
  ],
  [CATEGORIES.PROCEDURAL_FX]: [
    { id: 'pfx_aura_shimmer', name: 'AURA Shimmer', description: 'AURA pipeline procedural reverb shimmer layer' },
    { id: 'pfx_echo_tail', name: 'ECHO Tail', description: 'ECHO agent long-tail harmonic decay' },
  ],
  [CATEGORIES.AI_UTILITY]: [
    { id: 'aut_stem_splitter', name: 'Stem Splitter', description: 'Demucs-powered stem isolation utility' },
    { id: 'aut_bpm_detect', name: 'BPM Detector', description: 'Groove matrix BPM + key detection' },
  ],
  [CATEGORIES.VOCAL_ENGINE]: [
    { id: 've_pfa_biometric', name: 'PFA Biometric', description: 'Vocal biometrics pipeline — PFA sub-agent' },
    { id: 've_zephyr', name: 'Zephyr Voice', description: 'Default Lyrica3 voice profile' },
  ],
  [CATEGORIES.PRODUCER_KIT]: [
    { id: 'pk_empire_starter', name: 'Empire Starter Kit', description: 'Curated loops, samples, and MIDI for Empire1 producers' },
  ],
  [CATEGORIES.FX_PACK]: [
    { id: 'fp_vics_v1', name: 'VICS FX Pack v1', description: 'VICS Protocol-aligned spatial FX chain' },
  ],
};
