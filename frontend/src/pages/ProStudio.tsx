import { useState, useEffect, useCallback, useMemo } from "react";
import { useFreeTier } from "../lib/useFreeTier";
import { motion, AnimatePresence } from "framer-motion";
import {
  Disc3, Sparkles, Music, Repeat2, Wallet, ChevronDown,
  ListMusic, X, Mic2, Flame, LogOut, Play,
  Pause, Waves
} from "lucide-react";

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://lyrica3-backend-e2q5oemapa-uw.a.run.app';

type Stem = { name: string; level?: number; peak?: number; src?: string | null };
type Track = {
  id: string; dna_tag: string; title: string; creator: string; cultural_matrix: string;
  stems: Stem[]; streams?: number; flips?: number; earnings_usd?: number;
  created_at?: string; parent_dna?: string; biometrics?: any;
};
type WalletData = {
  handle: string; wallet: string; balance_usd: number;
  lifetime_streams: number; lifetime_flips: number; active_tracks: number;
};

const PINK = "#ff1493";
const OBSIDIAN = "#1a1a4e";
const OBSIDIAN_LIGHT = "#2d2d6b";
const OBSIDIAN_GLOW = "rgba(45, 45, 107, 0.4)";

function authHeaders() {
  const token = localStorage.getItem('e1_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
function absolutize(src?: string | null) {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith('blob:')) return src;
  return `${BACKEND}${src.startsWith('/') ? '' : '/'}${src}`;
}

function LoginGate({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  const [token, setToken] = useState(() => localStorage.getItem('e1_token'));
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsReg] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const r = await fetch(`${BACKEND}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, password }),
      });
      const data = await r.json();
      if (data.token) { localStorage.setItem('e1_token', data.token); setToken(data.token); }
      else setError(data.detail || 'Invalid credentials');
    } catch { setError('Connection error'); }
    setLoading(false);
  };

  if (token) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,20,147,0.06)_0%,rgba(26,26,78,0.08)_50%,transparent_80%)]" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-sm relative">
        {onBack && (
          <button onClick={onBack} className="text-white/30 hover:text-pink-400 text-sm mb-8 flex items-center gap-1.5 transition-colors group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back
          </button>
        )}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-[#1a1a4e]/30 to-pink-500/20 rounded-3xl blur-xl" />
          <div className="relative bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 shadow-2xl shadow-[#1a1a4e]/10">
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-pink-500 to-[#2d2d6b] flex items-center justify-center shadow-xl shadow-pink-500/20 ring-1 ring-white/10">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">LYRICA 3 PRO</h1>
              <p className="text-xs text-pink-400 uppercase tracking-[0.3em] mt-2 font-medium">Sonance Studio</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Handle</label>
                <input type="text" placeholder="Your handle" value={handle} onChange={e => setHandle(e.target.value)} required
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-4 py-3.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-[#1a1a4e]/50 transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-4 py-3.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-[#1a1a4e]/50 transition-all" />
              </div>
              {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center bg-red-500/5 border border-red-500/10 rounded-lg py-2">{error}</motion.p>}
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-[#3d3d8b] hover:from-pink-400 hover:to-[#4d4d9b] text-black font-bold text-sm tracking-wider py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-pink-500/20">
                {loading ? 'Connecting...' : isRegister ? 'Create Account' : 'Enter Studio'}
              </button>
              <p className="text-center text-xs text-white/30">
                {isRegister ? 'Already a creator?' : 'New creator?'}{' '}
                <button type="button" onClick={() => { setIsReg(!isRegister); setError(''); }}
                  className="text-pink-400 hover:text-pink-300 transition-colors font-medium">
                  {isRegister ? 'Login' : 'Register'}
                </button>
              </p>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function WalletDropdown() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem('e1_token');

  useEffect(() => {
    if (!token) return;
    fetch(`${BACKEND}/api/wallet`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null).then(d => d && setWallet(d)).catch(() => {});
  }, [token]);

  if (!wallet) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.08] hover:border-pink-500/30 px-3.5 py-2 rounded-xl text-xs transition-all">
        <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
          <Wallet className="w-3 h-3 text-white" />
        </div>
        <span className="text-emerald-400 font-semibold font-mono text-sm">${wallet.balance_usd.toFixed(2)}</span>
        <ChevronDown className={`w-3 h-3 text-white/30 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="absolute right-0 top-full mt-2 w-64 bg-[#0a0a0a] border border-[#1a1a4e]/40 rounded-xl p-5 shadow-2xl shadow-[#1a1a4e]/20 z-50 backdrop-blur-xl">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-medium mb-3">Creator Wallet</p>
            <p className="font-mono text-[10px] text-white/20 mb-2 truncate">{wallet.wallet}</p>
            <p className="text-3xl font-bold text-white mb-4">${wallet.balance_usd.toFixed(4)}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Streams', val: wallet.lifetime_streams.toLocaleString() },
                { label: 'Flips', val: wallet.lifetime_flips },
                { label: 'Tracks', val: wallet.active_tracks },
              ].map(({ label, val }) => (
                <div key={label} className="bg-white/[0.03] rounded-lg p-2.5 text-center border border-white/[0.04]">
                  <div className="text-white font-bold text-sm">{val}</div>
                  <div className="text-white/30 text-[9px] uppercase tracking-wider">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DNACertificate({ track }: { track: Track }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="mt-4 bg-gradient-to-r from-amber-500/[0.02] via-transparent to-amber-500/[0.02] border border-amber-500/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] uppercase tracking-[0.25em] text-amber-400/60 font-semibold">DNA Certificate</span>
        <span className="text-[9px] text-white/20 font-mono">Empire 1 Ledger</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-2xl tracking-[0.3em] text-amber-300/50 font-mono">◈◉◇⟡◈</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white font-mono font-semibold truncate">{track.dna_tag}</div>
          <div className="text-[10px] text-white/40 truncate">@{track.creator} · {track.cultural_matrix}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm text-emerald-400 font-mono font-bold">${(track.earnings_usd || 0).toFixed(2)}</div>
          <div className="text-[9px] text-white/30">{track.streams || 0} streams</div>
        </div>
      </div>
    </motion.div>
  );
}

function FlipModal({ dna_tag, onClose, onFlipped }: { dna_tag: string; onClose: () => void; onFlipped: (t: Track) => void }) {
  const [newTitle, setNewTitle] = useState('');
  const [newGenre, setNewGenre] = useState('SGV Oldies');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const r = await fetch(`${BACKEND}/api/tracks/${dna_tag}/flip`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ new_title: newTitle, new_genre: newGenre }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || 'Flip failed');
      onFlipped(data); onClose();
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-500/20 via-[#1a1a4e]/30 to-pink-500/20 rounded-3xl blur-xl" />
        <div className="relative bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 shadow-2xl shadow-[#1a1a4e]/10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2d2d6b] to-[#4d4d9b] flex items-center justify-center shadow-lg">
                <Repeat2 className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-white text-base">Flip This Track</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <X className="w-4 h-4 text-white/40" />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-medium">New Title</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required
                className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-[#1a1a4e]/50 transition-all" placeholder="My Flip..." />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Genre</label>
              <input value={newGenre} onChange={e => setNewGenre(e.target.value)} required
                className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-[#1a1a4e]/50 transition-all" placeholder="Trap Soul" />
            </div>
            {error && <p className="text-red-400 text-xs bg-red-500/5 border border-red-500/10 rounded-lg py-2 text-center">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-[#2d2d6b] to-[#4d4d9b] hover:from-[#3d3d7b] hover:to-[#5d5dab] text-white font-bold text-sm tracking-wider py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-[#1a1a4e]/30">
              {loading ? 'Minting Flip...' : '🔁 Mint Flip'}
            </button>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

const VOCAL_PROFILES = [
  { id: 'zephyr', name: 'Zephyr', voiceName: 'zephyr', archetype: 'Soft R&B', gradient: 'from-pink-400 to-rose-500' },
  { id: 'ember', name: 'Ember', voiceName: 'ember', archetype: 'Soulful', gradient: 'from-orange-400 to-red-500' },
  { id: 'shadow', name: 'Shadow', voiceName: 'shadow', archetype: 'Dark Trap', gradient: 'from-[#2d2d6b] to-indigo-500' },
  { id: 'nova', name: 'Nova', voiceName: 'nova', archetype: 'Bright Pop', gradient: 'from-cyan-400 to-blue-500' },
  { id: 'thunder', name: 'Thunder', voiceName: 'thunder', archetype: 'Bold Rap', gradient: 'from-amber-400 to-yellow-500' },
];

function StemPlayer({ stem, trackId }: { stem: Stem; trackId: string }) {
  const src = absolutize(stem.src || null);
  const [playing, setPlaying] = useState(false);

  if (!src) return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
      <p className="text-xs text-white/30 uppercase tracking-wider">{stem.name}</p>
      <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-pink-500/20 to-[#2d2d6b]/20 rounded-full animate-pulse" />
      </div>
      <p className="text-[10px] text-white/20 mt-1.5">Processing...</p>
    </div>
  );

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:border-[#1a1a4e]/40 transition-all group">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-white/40 uppercase tracking-wider font-medium">{stem.name}</p>
        <button onClick={() => setPlaying(!playing)}
          className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center hover:bg-pink-500/20 transition-colors opacity-0 group-hover:opacity-100">
          {playing ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white" />}
        </button>
      </div>
      {playing && (
        <div className="flex items-center gap-1 mb-2 h-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="w-0.5 bg-gradient-to-t from-pink-500 to-[#4d4d9b] rounded-full animate-bounce"
              style={{ height: `${10 + Math.random() * 18}px`, animationDelay: `${i * 0.08}s`, animationDuration: '0.6s' }} />
          ))}
        </div>
      )}
      <audio src={src} controls className="w-full h-7 opacity-60 hover:opacity-100 transition-opacity" style={{ filter: 'invert(0.7)' }} />
    </div>
  );
}

export default function ProStudio({ onLogout }: { onLogout?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [genres, setGenres] = useState<string[]>(['SGV Oldies']);
  const [moods, setMoods] = useState<string[]>(['Late-Night Honesty']);
  const [lyrics, setLyrics] = useState('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('SGV Oldies');
  const [mood, setMood] = useState('Late-Night Honesty');
  const [selectedVoice, setSelectedVoice] = useState('zephyr');
  const [vulnerabilityAgg, setVulnAgg] = useState(0.54);
  const [swingMs, setSwingMs] = useState(12);
  const [flipDna, setFlipDna] = useState<string | null>(null);
  const [expandedDna, setExpandedDna] = useState<Set<string>>(new Set());
  const [showingTracks, setShowingTracks] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const freeTier = useFreeTier();
  const canGenerate = useMemo(() => lyrics.trim().length > 0 && !freeTier.isLocked, [lyrics, freeTier.isLocked]);

  const loadData = useCallback(async () => {
    try {
      const [vibesRes, tracksRes] = await Promise.all([
        fetch(`${BACKEND}/api/vibes`),
        fetch(`${BACKEND}/api/tracks`, { headers: authHeaders() }),
      ]);
      if (vibesRes.ok) {
        const v = await vibesRes.json();
        if (v.genres?.length) setGenres(v.genres);
        if (v.moods?.length) setMoods(v.moods);
      }
      if (tracksRes.ok) {
        const list = await tracksRes.json();
        const seen = new Set();
        setTracks(Array.isArray(list) ? list.filter(t => { if (seen.has(t.dna_tag)) return false; seen.add(t.dna_tag); return true; }) : []);
      }
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generate = async () => {
    if (!canGenerate || loading) return;
    if (freeTier.isLocked) { setShowUpgrade(true); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`${BACKEND}/api/generate`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ lyrics, genre, mood, title: title || undefined, ghost_audio_name: selectedVoice, vulnerability_override: vulnerabilityAgg, swing_ms: swingMs }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || 'Generation failed');
      setTracks(prev => [data, ...prev.filter(t => t.dna_tag !== data.dna_tag)]);
      setTitle(''); setLyrics('');
      freeTier.incrementGeneration();
    } catch (e: any) { setError(e?.message || 'Generation failed.'); }
    finally { setLoading(false); }
  };

  const handleFlipped = (newTrack: Track) => setTracks(prev => [newTrack, ...prev]);
  const toggleExpand = (dna: string) => {
    setExpandedDna(prev => { const s = new Set(prev); s.has(dna) ? s.delete(dna) : s.add(dna); return s; });
  };

  const activeVoice = VOCAL_PROFILES.find(p => p.name === selectedVoice) || VOCAL_PROFILES[0];

  return (
    <div className="min-h-screen bg-[#050505] text-white antialiased">
      <AnimatePresence>
        {flipDna && <FlipModal dna_tag={flipDna} onClose={() => setFlipDna(null)} onFlipped={handleFlipped} />}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-[#2d2d6b] flex items-center justify-center shadow-xl shadow-pink-500/20 ring-1 ring-white/10">
              <Flame className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold tracking-widest text-sm bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent hidden sm:block">
              SONANCE PRO
            </span>
          </div>
          <div className="flex items-center gap-3">
            <WalletDropdown />
            <button onClick={onLogout} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-white/10 transition-colors" title="Logout">
              <LogOut className="w-3.5 h-3.5 text-white/40" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative">
              <div className="absolute -inset-1 bg-gradient-to-b from-pink-500/8 via-[#1a1a4e]/10 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 lg:p-8 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-[#2d2d6b] flex items-center justify-center shadow-lg shadow-[#1a1a4e]/20">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xs uppercase tracking-[0.25em] text-pink-400/80 font-semibold">Soulfire Engine</h2>
                    <p className="text-[10px] text-white/20 mt-0.5">AI Music Generation</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Track Title</label>
                      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Optional"
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-[#1a1a4e]/50 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Genre</label>
                        <select value={genre} onChange={e => setGenre(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-pink-500/40 transition-all appearance-none cursor-pointer">
                          {genres.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Vibe</label>
                        <select value={mood} onChange={e => setMood(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-pink-500/40 transition-all appearance-none cursor-pointer">
                          {moods.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Your Lyrics</label>
                    <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} rows={5} placeholder="Tell your story..."
                      className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-xl px-4 py-3.5 text-sm placeholder:text-white/20 focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-[#1a1a4e]/50 transition-all resize-none" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-white/[0.01] border border-[#1a1a4e]/20 rounded-xl">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/30 font-medium flex items-center gap-1.5">
                        <Mic2 className="w-3 h-3 text-pink-400" /> Voice
                      </label>
                      <div className="relative">
                        <select value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-pink-500/40 transition-all appearance-none cursor-pointer pl-6">
                          {VOCAL_PROFILES.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                        <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${activeVoice.gradient}`} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Vulnerability</label>
                      <div className="flex items-center gap-3 pt-1">
                        <input type="range" min={0} max={1} step={0.01} value={vulnerabilityAgg}
                          onChange={e => setVulnAgg(parseFloat(e.target.value))}
                          className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-pink-500 bg-white/10" />
                        <span className="text-xs font-mono text-pink-400/80 w-10 text-right font-semibold">{(vulnerabilityAgg * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Swing</label>
                      <div className="flex items-center gap-3 pt-1">
                        <input type="range" min={10} max={15} step={1} value={swingMs}
                          onChange={e => setSwingMs(parseInt(e.target.value))}
                          className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-amber-500 bg-white/10" />
                        <span className="text-xs font-mono text-amber-400/80 w-10 text-right font-semibold">{swingMs}ms</span>
                      </div>
                    </div>
                  </div>

                  {freeTier.remaining > 0 && freeTier.remaining <= 5 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                      <Sparkles className="w-3 h-3" />
                      <span>{freeTier.remaining} / {freeTier.MAX_FREE_GENERATIONS} free generations left</span>
                    </div>
                  )}
                  {freeTier.isLocked && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                      <Flame className="w-3 h-3" />
                      <span>Free limit reached — <button onClick={() => setShowUpgrade(true)} className="underline font-semibold hover:text-red-300">Upgrade</button></span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-2">
                    <motion.button
                      whileHover={canGenerate && !loading ? { scale: 1.02 } : {}}
                      whileTap={canGenerate && !loading ? { scale: 0.98 } : {}}
                      onClick={generate} disabled={!canGenerate || loading}
                      className="relative px-8 py-4 bg-gradient-to-r from-pink-500 to-[#3d3d8b] hover:from-pink-400 hover:to-[#4d4d9b] text-black font-bold text-sm tracking-wider rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-3 transition-all shadow-xl shadow-pink-500/20 group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Disc3 className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                      <span className="relative">{loading ? 'Forging Your Sound...' : 'Generate Track'}</span>
                    </motion.button>
                    <button onClick={loadData}
                      className="px-6 py-4 bg-white/[0.03] hover:bg-white/10 border border-white/[0.08] text-white/50 hover:text-white/80 text-xs font-medium tracking-wider rounded-xl transition-all">
                      Refresh
                    </button>
                  </div>
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs bg-red-500/5 border border-red-500/10 rounded-xl py-3 px-4">{error}</motion.p>
                  )}
                  <p className="text-[10px] text-white/20 leading-relaxed">
                    100% creator-owned. Every track gets a DNA certificate. Royalties flow forever.
                  </p>
                </div>
              </div>
            </motion.section>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase tracking-[0.25em] text-white/40 font-semibold">Your Catalog</h2>
              <button onClick={() => setShowingTracks(!showingTracks)}
                className="text-[10px] text-pink-400/60 hover:text-pink-400 transition-colors font-medium">
                {showingTracks ? 'Hide' : 'Show'}
              </button>
            </div>

            <AnimatePresence>
              {showingTracks && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden">
                  {tracks.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-8 text-center">
                      <Music className="w-8 h-8 text-white/10 mx-auto mb-3" />
                      <p className="text-white/30 text-sm">Your tracks will appear here</p>
                      <p className="text-white/20 text-xs mt-1">Generate your first Soulfire track above</p>
                    </div>
                  ) : (
                    tracks.slice(0, 20).map(t => (
                      <motion.div key={t.dna_tag} layout
                        className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-[#1a1a4e]/30 transition-all">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white text-sm truncate">{t.title}</h3>
                            <p className="text-[10px] text-white/30 mt-0.5 truncate">{t.cultural_matrix}</p>
                          </div>
                          <span className="text-[8px] uppercase tracking-widest text-amber-400/40 font-mono bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10 flex-shrink-0">DNA</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {Array.isArray(t.stems) && t.stems.slice(0, 4).map((s, i) => (
                            <StemPlayer key={`${t.dna_tag}_${s.name}_${i}`} stem={s} trackId={t.dna_tag} />
                          ))}
                        </div>

                        <DNACertificate track={t} />

                        <div className="flex gap-2 mt-3">
                          <button onClick={() => setFlipDna(t.dna_tag)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] hover:bg-white/10 border border-white/[0.08] text-white/40 text-[10px] rounded-lg transition-all">
                            <Repeat2 className="w-3 h-3 text-blue-400/60" /> Flip
                          </button>
                          <button onClick={() => toggleExpand(t.dna_tag)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.03] hover:bg-white/10 border border-white/[0.08] text-white/40 text-[10px] rounded-lg transition-all">
                            <ListMusic className="w-3 h-3 text-amber-400/60" />
                            {expandedDna.has(t.dna_tag) ? 'Less' : 'Details'}
                          </button>
                        </div>

                        <AnimatePresence>
                          {expandedDna.has(t.dna_tag) && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden">
                              <div className="mt-3 p-3 bg-white/[0.02] border border-[#1a1a4e]/20 rounded-xl text-[10px] text-white/30 font-mono space-y-1">
                                <div>Flips: {t.flips ?? 0} · Streams: {(t.streams ?? 0).toLocaleString()}</div>
                                {t.parent_dna && <div>Parent: {t.parent_dna}</div>}
                                <div>Created: {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showUpgrade && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowUpgrade(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#0a0a12] border border-white/[0.06] rounded-2xl p-8 shadow-2xl shadow-[#1a1a4e]/20"
              onClick={e => e.stopPropagation()}>
              <div className="text-center space-y-4">
                <Flame className="w-10 h-10 text-pink-500 mx-auto" />
                <h2 className="text-xl font-bold text-white tracking-tight">Free Limit Reached</h2>
                <p className="text-sm text-white/50 leading-relaxed">
                  You've used all {freeTier.MAX_FREE_GENERATIONS} free generations.
                  Upgrade to Sonance Pro for unlimited tracks, stems, and DNA flips.
                </p>
                <div className="flex flex-col gap-2 pt-2">
                  <a href="/pricing"
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-[#2d2d6b] text-black font-bold text-sm tracking-wider rounded-xl text-center hover:from-pink-400 hover:to-[#3d3d7b] transition-all">
                    Upgrade Now
                  </a>
                  <button onClick={() => setShowUpgrade(false)}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors">
                    Maybe later
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { LoginGate };
