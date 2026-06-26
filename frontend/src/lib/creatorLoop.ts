export type SoulfireDefaults = {
  energy: number;
  mood: number;
  culturaBounce: number;
  genre: string;
  culture: string;
};

export type CreatorTrack = {
  id: string;
  title: string;
  creator?: string;
  genre?: string;
  mood?: string;
  culture?: string;
  roots?: string;
  lyrics?: string;
  prompt?: string;
  audio_url?: string;
  audioUrl?: string;
  duration_sec?: number;
  created_at?: string;
  dna_tag?: string;
  soulprint_id?: string;
  vics_signature?: string;
  ledger_valid?: boolean;
  royalty_trust?: boolean;
  soulprint_verified?: boolean;
  protection?: {
    dna_verified?: boolean;
    soulprint_verified?: boolean;
    soulprint_confidence?: number;
  };
  royalty_risk?: {
    verdict?: string;
    decision?: string;
  };
  source?: 'backend' | 'local-fallback';
};

const DEFAULTS_KEY = 'lyrica3.soulfire.defaults';
const TRACKS_KEY = 'lyrica3.creator.tracks';

export const defaultSoulfireDefaults: SoulfireDefaults = {
  energy: 70,
  mood: 50,
  culturaBounce: 60,
  genre: 'Hip-Hop',
  culture: 'Chicano',
};

export function loadSoulfireDefaults(): SoulfireDefaults {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    return raw ? { ...defaultSoulfireDefaults, ...JSON.parse(raw) } : defaultSoulfireDefaults;
  } catch {
    return defaultSoulfireDefaults;
  }
}

export function saveSoulfireDefaults(defaults: SoulfireDefaults) {
  localStorage.setItem(DEFAULTS_KEY, JSON.stringify(defaults));
  window.dispatchEvent(new CustomEvent('lyrica3:soulfire-defaults', { detail: defaults }));
}

export function loadLocalTracks(): CreatorTrack[] {
  try {
    const raw = localStorage.getItem(TRACKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalTrack(track: CreatorTrack) {
  const tracks = [track, ...loadLocalTracks().filter((item) => item.id !== track.id)].slice(0, 50);
  localStorage.setItem(TRACKS_KEY, JSON.stringify(tracks));
  window.dispatchEvent(new CustomEvent('lyrica3:tracks', { detail: tracks }));
  return tracks;
}

export function absoluteAudioUrl(url?: string) {
  if (!url) return undefined;
  if (url.startsWith('data:') || url.startsWith('blob:') || /^https?:\/\//.test(url)) return url;
  const backend = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '';
  return backend ? `${backend.replace(/\/$/, '')}${url}` : url;
}

function hash(input: string) {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) value = ((value << 5) - value + input.charCodeAt(i)) | 0;
  return Math.abs(value).toString(16).padStart(8, '0');
}

export function buildProof(input: { title: string; lyrics: string; genre: string; mood: string; culture: string }) {
  const base = `${input.title}|${input.lyrics}|${input.genre}|${input.mood}|${input.culture}`;
  const digest = hash(base + Date.now());
  return {
    dna_tag: `DNA-L3P-${digest.slice(0, 12).toUpperCase()}`,
    soulprint_id: `SOUL-${hash(base + 'soul').slice(0, 10).toUpperCase()}`,
    vics_signature: `VICS-${input.culture.toUpperCase().replace(/\s+/g, '-')}-${hash(base + 'vics').slice(0, 8).toUpperCase()}`,
  };
}

export function makeLocalPreviewAudio() {
  // Tiny generated WAV data URI: enough to prove inline playback UI without shipping binary assets.
  const sampleRate = 8000;
  const seconds = 1;
  const samples = sampleRate * seconds;
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, text: string) => [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  write(0, 'RIFF'); view.setUint32(4, 36 + samples * 2, true); write(8, 'WAVE'); write(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i += 1) view.setInt16(44 + i * 2, Math.sin((i / sampleRate) * Math.PI * 2 * 220) * 5000, true);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `data:audio/wav;base64,${btoa(binary)}`;
}
