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

const GUEST_FLAG_KEY = "lyrica_is_guest";
let guestSessionPromise: Promise<void> | null = null;

/**
 * The backend has no anonymous/demo generation path -- /generate requires a
 * real authenticated user. Rather than let logged-out visitors hit a 401 (or
 * silently fake a result client-side), transparently mint a real registered
 * account behind the scenes so generation is genuinely backed by the real
 * pipeline. Deduped so concurrent calls don't race-register multiple accounts.
 */
export async function ensureGuestSession(): Promise<void> {
  if (authToken) return;
  if (guestSessionPromise) return guestSessionPromise;

  guestSessionPromise = (async () => {
    const handle = `guest_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const { data } = await api.post("/auth/register", { handle, password });
    if (data.token) {
      setAuthToken(data.token);
      localStorage.setItem(GUEST_FLAG_KEY, "1");
    }
  })().finally(() => {
    guestSessionPromise = null;
  });

  return guestSessionPromise;
}

export function isGuestSession(): boolean {
  return localStorage.getItem(GUEST_FLAG_KEY) === "1";
}

export async function createTrack(lyrics: string, genre: string, mood: string, title?: string) {
  const { data } = await api.post("/music/create", { lyrics, genre, mood, title });
  return data;
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
