import axios from "axios";
export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
export const WS_URL = `${process.env.REACT_APP_BACKEND_URL.replace(/^http/, "ws")}/api/ws/royalties`;

const authHeader = () => {
  const t = localStorage.getItem("e1_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export const apiGet  = (p)       => axios.get(`${API}${p}`,  { headers: authHeader() }).then(r => r.data);
export const apiPost = (p, body) => axios.post(`${API}${p}`, body, { headers: authHeader() }).then(r => r.data);

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

export const uploadForDemucs = (file) => {
  const form = new FormData();
  form.append("file", file);
  const t = localStorage.getItem("e1_token");
  return axios.post(`${API}/demucs/separate`, form, {
    headers: { Authorization: t ? `Bearer ${t}` : undefined },
  }).then(r => r.data);
};

/** Rewrite a stem URL so it works for both relative ("/static/...") and absolute paths. */
export const resolveAudioUrl = (src) => {
  if (!src) return "";
  if (src.startsWith("http") || src.startsWith("blob:")) return src;
  return `${process.env.REACT_APP_BACKEND_URL}${src}`;
};
