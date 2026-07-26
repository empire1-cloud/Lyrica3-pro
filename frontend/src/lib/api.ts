import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

export default api;

const TOKEN_STORAGE_KEY = "lyrica_auth_token";

let authToken: string | null = localStorage.getItem(TOKEN_STORAGE_KEY);

if (authToken) {
  api.defaults.headers.Authorization = `Bearer ${authToken}`;
}

export function setAuthToken(token: string) {
  authToken = token;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  api.defaults.headers.Authorization = `Bearer ${token}`;
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  delete api.defaults.headers.Authorization;
}

export function getAuthToken() {
  return authToken;
}

export async function register(handle: string, email: string, password: string) {
  const { data } = await api.post("/auth/register", { handle, email, password });
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function login(handle: string, password: string) {
  const { data } = await api.post("/auth/login", { handle, password });
  if (data.token) setAuthToken(data.token);
  return data;
}

export async function createTrack(lyrics: string, genre: string, mood: string, title?: string) {
  const { data } = await api.post("/music/create", { lyrics, genre, mood, title });
  return data;
}

export type RuntimeJobState =
  | "REQUESTED"
  | "APPROVED"
  | "BLUEPRINT_READY"
  | "RENDERING"
  | "MASTERING"
  | "MEASURING"
  | "PROOF_PENDING"
  | "COMPLETE"
  | "FAILED";

export type FullRuntimeCreateRequest = {
  title: string;
  prompt?: string;
  lyrics?: string;
  genre?: string;
  mood?: string;
  culture?: string;
  duration_seconds?: number;
  bpm?: number;
  musical_key?: string;
  voice_consent_id?: string | null;
  parent_dna?: string | null;
  idempotency_key?: string | null;
  contributors?: Array<{ creator_id: string; role: string; split: number }>;
};

export type FullRuntimeJob = {
  job_id: string;
  state: RuntimeJobState;
  result?: any;
  error?: { code?: string; message?: string } | null;
  history?: Array<{ state: RuntimeJobState; at: string }>;
};

export async function createTrackV2(payload: FullRuntimeCreateRequest) {
  const { data } = await api.post("/v2/tracks", payload);
  return data as { job_id: string; state: RuntimeJobState; status_url: string; idempotency_key: string };
}

export async function getTrackJob(jobId: string) {
  const { data } = await api.get(`/v2/jobs/${encodeURIComponent(jobId)}`);
  return data as FullRuntimeJob;
}

export async function waitForTrackJob(jobId: string, timeoutMs = 120_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const job = await getTrackJob(jobId);
    if (job.state === "COMPLETE") return job;
    if (job.state === "FAILED") {
      throw new Error(job.error?.message || "Lyrica Full Runtime failed.");
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1000));
  }
  throw new Error("Lyrica Full Runtime timed out before the track completed.");
}

export async function myTracks() {
  const { data } = await api.get("/music/my-tracks");
  return data;
}

export async function trackProof(trackId: string) {
  const { data } = await api.get(`/music/${trackId}/proof`);
  return data;
}

export async function generateLyrics(prompt: string) {
  const { data } = await api.post("/generate_lyrics", { prompt });
  return data;
}

export async function routeSession(payload: {
  prompt: string;
  creator_id?: string;
  target_vibe?: string;
  culture?: string;
  genre?: string;
}) {
  const { data } = await api.post("/livesession/route", payload);
  return data;
}

export async function getSessionStatus() {
  const { data } = await api.get("/livesession/status");
  return data;
}
