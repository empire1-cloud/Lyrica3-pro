import axios from "axios";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "https://lyrica3-backend-e2q5oemapa-uw.a.run.app";

export const API = `${BACKEND}/api`;
export const WS_URL = `${BACKEND.replace(/^http/, "ws")}/api/ws/royalties`;

const authHeader = () => {
  const t = localStorage.getItem("e1_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const client = axios.create({
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});
client.interceptors.response.use(
  r => r,
  async err => {
    if (err.config && (!err.response || err.code === 'ECONNABORTED')) {
      err.config.__retryCount = (err.config.__retryCount || 0) + 1;
      if (err.config.__retryCount <= 2) {
        await new Promise(r => setTimeout(r, 1000 * err.config.__retryCount));
        return client(err.config);
      }
    }
    return Promise.reject(err);
  }
);

export const apiGet  = (p)       => client.get(`${API}${p}`,  { headers: authHeader() }).then(r => r.data);
export const apiPost = (p, body) => client.post(`${API}${p}`, body, { headers: authHeader() }).then(r => r.data);

export const registerUser = (handle, password) => apiPost("/auth/register", { handle, password });
export const loginUser    = (handle, password) => apiPost("/auth/login",    { handle, password });
export const fetchMe      = () => apiGet("/auth/me");

export const getTracks  = () => apiGet("/tracks");
export const getTrack   = (dna) => apiGet(`/tracks/${dna}`);
export const flipTrack  = (dna, body) => apiPost(`/tracks/${dna}/flip`, body);
export const generate   = (body) => apiPost("/generate", body);
export const getLedger  = (limit = 40) => apiGet(`/ledger?limit=${limit}`);
export const getWallet  = () => apiGet("/wallet");
export const getVibes   = () => apiGet("/vibes");
export const getBloodlines = () => apiGet("/leaderboard/bloodlines");

export const getDuetProfiles = () => apiGet("/duet/profiles");
export const generateDuet    = (body) => apiPost("/duet/generate", body);

export const uploadForDemucs = (file) => {
  const form = new FormData();
  form.append("file", file);
  const t = localStorage.getItem("e1_token");
  return client.post(`${API}/demucs/separate`, form, {
    timeout: 120000,
    headers: { Authorization: t ? `Bearer ${t}` : undefined },
  }).then(r => r.data);
};

/** Rewrite a stem URL so it works for both relative ("/static/...") and absolute paths. */
export const resolveAudioUrl = (src) => {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("blob:")) return src;
  return `${BACKEND}${src}`;
};
