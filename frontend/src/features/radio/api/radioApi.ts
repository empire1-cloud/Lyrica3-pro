import api from '../../../lib/api';
import type { VibeParams } from '../../../radio/lib/gemini';

export interface TrackData {
  id: string;
  title: string;
  artist: string;
  vibe: string;
  params: VibeParams;
  audioUrl?: string;
  lyrics?: string;
  isRemix?: boolean;
  originalCreatorName?: string;
  parentTrackTitle?: string;
  createdAt?: string;
  trackMetadata?: any;
  ghostwriterDirective?: any;
  vocalBlueprint?: any;
  acousticPrimitives?: any;
  lyricsPayload?: any[];
  vocalPipelines?: { id: string; name: string; description: string; active: boolean; intensity?: number }[];
}

export async function generateTrack(vibe: string, context?: any, emotionalMode?: string) {
  const contextText = context
    ? `\n\nListener context: time=${context.time || "unknown"}, weather=${context.weather || "unknown"}, heartRate=${context.heartRate || "unavailable"}.`
    : "";
  const { data } = await api.post("/generate", {
    genre: "SGV Oldies",
    mood: emotionalMode || "Late-Night Honesty",
    lyrics: `${vibe}${contextText}`,
    title: vibe.length > 42 ? `${vibe.slice(0, 42)}...` : vibe,
  });

  const firstPlayableStem = Array.isArray(data.stems)
    ? data.stems.find((stem: any) => stem?.src)
    : null;

  return {
    ...data,
    id: data.id || data.dna_tag,
    track_id: data.id || data.dna_tag,
    title: data.title,
    artist: data.creator || "Lyrica 3 Pro",
    vibe,
    params: {
      ...(data.params || {}),
      style: data.cultural_matrix || "SGV Oldies",
      mood: emotionalMode || "Late-Night Honesty",
      lyrics: data.lyrics,
      biometrics: data.biometrics,
      dna_tag: data.dna_tag,
    },
    audioUrl: data.audioUrl || data.audio_url || firstPlayableStem?.src,
    lyrics: data.lyrics,
  };
}

export async function getLibrary(userId: string): Promise<TrackData[]> {
  const { data } = await api.get("/tracks");
  return Array.isArray(data) ? data : [];
}

export async function saveTrack(track: TrackData): Promise<any> {
  const { data } = await api.post("/music/create", {
    title: track.title,
    lyrics: track.lyrics || "",
    genre: track.params?.style || "SGV Oldies",
    mood: track.params?.mood || "Late-Night Honesty",
  });
  return data;
}

export async function getRoyaltyStatus(trackId: string) {
  try {
    const { data } = await api.get("/ledger");
    return {
      totalRoyalties: Array.isArray(data) ? data.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) : 0,
      records: Array.isArray(data) ? data : [],
    };
  } catch {
    return { totalRoyalties: 0, records: [] };
  }
}

export async function shareTrack(trackId: string, target: string) {
  const { data } = await api.post("/share", { track_id: trackId, target });
  return data;
}

export async function createLiveSession(payload: { prompt: string; creator_id?: string; target_vibe?: string; culture?: string; genre?: string }) {
  const { routeSession } = await import('../../../lib/api');
  return routeSession(payload);
}

export async function getHistory(userId: string): Promise<any[]> {
  try {
    const saved = localStorage.getItem('sl_universal_history');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export async function addToHistory(track: TrackData): Promise<void> {
  try {
    const saved = JSON.parse(localStorage.getItem('sl_universal_history') || '[]');
    saved.unshift({ id: track.id, title: track.title, artist: track.artist, playedAt: new Date().toISOString() });
    localStorage.setItem('sl_universal_history', JSON.stringify(saved.slice(0, 50)));
  } catch {}
}

// ── Listener Input / AI DJ API ──────────────────────────────────────────────

export interface ListenerInputPayload {
  sessionId: string;
  userId?: string;
  inputType: "lyrics" | "feeling" | "dedication" | "shoutout" | "vibe_request" | "remix_request";
  text: string;
  submittedAt: string;
}

export interface AudienceInspiration {
  id: string;
  sessionId: string;
  userId?: string;
  inputType: string;
  originalText: string;
  interpretedEmotion: string;
  interpretedVibe: string;
  djResponseType: string;
  djMessage: string;
  ownershipEventCreated: boolean;
  createdAt: string;
}

export async function submitListenerInput(payload: ListenerInputPayload): Promise<any> {
  const { data } = await api.post("/livesession/input", payload);
  return data;
}

export async function saveAudienceInspiration(payload: AudienceInspiration): Promise<any> {
  const { data } = await api.post("/livesession/inspiration", payload);
  return data;
}

export async function createOwnershipEventIfUsed(payload: {
  sessionId: string;
  userId?: string;
  originalText: string;
  derivedTrackTitle?: string;
  derivedTrackId?: string;
  inputType: string;
}): Promise<any> {
  const { data } = await api.post("/livesession/ownership", payload);
  return data;
}
