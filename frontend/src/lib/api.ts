import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export default api;

let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
  api.defaults.headers.Authorization = `Bearer ${token}`;
}

export function clearAuthToken() {
  authToken = null;
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

const livesession = axios.create({
  baseURL: "/livesession",
  headers: { "Content-Type": "application/json" },
});

export async function routeSession(payload: {
  prompt: string;
  creator_id?: string;
  target_vibe?: string;
  culture?: string;
  genre?: string;
}) {
  const { data } = await livesession.post("/route", payload);
  return data;
}

export async function getSessionStatus() {
  const { data } = await livesession.get("/status");
  return data;
}
