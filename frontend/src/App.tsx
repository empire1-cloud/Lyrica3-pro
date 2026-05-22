import React, { useEffect, useMemo, useState, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders, Radio, Activity, Flame, ListMusic, Wallet, X, Share2, Repeat2,
  Mic2, Users, Disc3, ChevronDown, ExternalLink
} from 'lucide-react';
import BillingPage from './Billing';
import PricingPage from './PricingPage';
import LyricaPublicLanding from './LyricaPublicLanding';
import BloodlineShareCard from './components/BloodlineShareCard';
import OnboardingGuide from './components/OnboardingGuide';
import SonanceProSection from './components/sections/SonancePro';
import VulnerabilityPanel from './components/studio/VulnerabilityPanel';
import LatePocketControl from './components/studio/LatePocketControl';
import { VOCAL_PROFILES } from './components/studio/VoiceAuditionGallery';
import App6Reference from './components/App6_reference';

// Lazy-load heavy pages
const FlipFeed       = lazy(() => import('./pages/FlipFeed'));
const StemDeck       = lazy(() => import('./pages/StemDeck'));
const DuetEngine     = lazy(() => import('./pages/DuetEngine'));
const VICSProtocol   = lazy(() => import('./pages/VICSProtocol'));
const SLUniversalApp = lazy(() => import('./pages/SLUniversalApp'));

// ─── Constants ───────────────────────────────────────────────────────────────
const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://lyrica3-backend-e2q5oemapa-uw.a.run.app';

type AppMode = 'sonance' | 'universal' | 'orchestrator' | 'feed' | 'deck' | 'duet' | 'vics' | 'plans';

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

function authHeaders() {
  const token = localStorage.getItem('e1_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
function absolutize(src?: string | null) {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith('blob:')) return src;
  return `${BACKEND}${src.startsWith('/') ? '' : '/'}${src}`;
}

// ─── LoginGate ───────────────────────────────────────────────────────────────
function LoginGate({ children }: { children: React.ReactNode }) {
  const [token, setToken]       = useState<string | null>(() => localStorage.getItem('e1_token'));
  const [handle, setHandle]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [isRegister, setIsReg]  = useState(false);

  const login = async (e: React.FormEvent) => {
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
    } catch { setError('Connection error — try again'); }
    setLoading(false);
  };

  if (token) return <>{children}</>;

  return (
    <div style={{ minHeight: '100vh', background: '#030303', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-monospace, monospace' }}>
      <div style={{ width: 360, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 16, padding: 40 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#ff1b8d', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>Lyrica 3 Pro</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>EMPIRE 1</div>
          <div style={{ fontSize: 10, color: '#444', marginTop: 4, letterSpacing: '0.2em' }}>SOVEREIGN STUDIO ACCESS</div>
        </div>
        <form onSubmit={login}>
          <div style={{ marginBottom: 12 }}>
            <input type="text" placeholder="Handle" value={handle} onChange={e => setHandle(e.target.value)} required
              style={{ width: '100%', background: '#000', border: '1px solid #222', color: '#fff', padding: '12px 14px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', background: '#000', border: '1px solid #222', color: '#fff', padding: '12px 14px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 14, textAlign: 'center' }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: '#ff1b8d', color: '#000', border: 'none', borderRadius: 8, padding: '13px 0', fontWeight: 900, fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Authenticating...' : (isRegister ? 'Create Account' : 'Enter Studio')}
          </button>
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#666' }}>
            {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
            <button type="button" onClick={() => { setIsReg(!isRegister); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#ff1b8d', cursor: 'pointer', textDecoration: 'underline' }}>
              {isRegister ? 'Login' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── FlipModal ───────────────────────────────────────────────────────────────
function FlipModal({ dna_tag, onClose, onFlipped }: { dna_tag: string; onClose: () => void; onFlipped: (t: Track) => void }) {
  const [newTitle, setNewTitle] = useState('');
  const [newGenre, setNewGenre] = useState('SGV Oldies');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const r = await fetch(`${BACKEND}/api/tracks/${dna_tag}/flip`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ new_title: newTitle, new_genre: newGenre }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || 'Flip failed');
      onFlipped(data);
      onClose();
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-white text-lg flex items-center gap-2">
            <Repeat2 className="w-5 h-5 text-pink-500" /> Flip This DNA
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-neutral-500" /></button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">New Title</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required
              className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white" placeholder="My Flip..." />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">New Genre</label>
            <input value={newGenre} onChange={e => setNewGenre(e.target.value)} required
              className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white" placeholder="Trap Soul" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-pink-500 hover:bg-pink-400 text-black font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-colors disabled:opacity-50">
            {loading ? 'Minting Flip...' : '🔁 Mint Flip'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── DNA Certificate ─────────────────────────────────────────────────────────
function DNACertificate({ track }: { track: Track }) {
  return (
    <div className="mt-3 bg-neutral-950 border border-amber-500/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-amber-400 font-bold">DNA Ownership Certificate</span>
        <span className="text-[10px] text-neutral-500 font-mono">Empire 1 Ledger</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl tracking-widest text-amber-300">◈◉◇⟡◈</span>
        <div>
          <div className="text-xs text-white font-mono font-bold">{track.dna_tag}</div>
          <div className="text-[10px] text-neutral-400">Creator: @{track.creator} • {track.cultural_matrix}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-emerald-400 font-mono font-bold">${(track.earnings_usd || 0).toFixed(2)}</div>
          <div className="text-[10px] text-neutral-500">{track.streams || 0} streams</div>
        </div>
      </div>
      {track.biometrics && (
        <div className="mt-2 pt-2 border-t border-neutral-800 flex gap-3 flex-wrap">
          {Object.entries(track.biometrics as Record<string, string>).slice(0, 4).map(([k, v]) => (
            <span key={k} className="text-[10px] text-neutral-500">
              <span className="text-neutral-400">{k.replace(/_/g, ' ')}:</span> {String(v)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WalletWidget ─────────────────────────────────────────────────────────────
function WalletWidget() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [open, setOpen]     = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('e1_token');
    if (!token) return;
    fetch(`${BACKEND}/api/wallet`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setWallet(d))
      .catch(() => {});
  }, []);

  if (!wallet) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-pink-500/40 px-3 py-1.5 rounded-lg text-xs transition-colors"
      >
        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-emerald-400 font-mono font-bold">${wallet.balance_usd.toFixed(2)}</span>
        <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            className="absolute right-0 top-full mt-2 w-64 bg-neutral-950 border border-neutral-800 rounded-xl p-4 shadow-2xl z-50"
          >
            <div className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Creator Wallet</div>
            <div className="font-mono text-[10px] text-neutral-400 mb-1 truncate">{wallet.wallet}</div>
            <div className="text-2xl font-black text-white mb-3">${wallet.balance_usd.toFixed(4)}</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Streams', val: wallet.lifetime_streams.toLocaleString() },
                { label: 'Flips', val: wallet.lifetime_flips },
                { label: 'Tracks', val: wallet.active_tracks },
              ].map(({ label, val }) => (
                <div key={label} className="bg-neutral-900 rounded-lg p-2">
                  <div className="text-white font-bold text-sm">{val}</div>
                  <div className="text-neutral-500 text-[10px] uppercase">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sonance Studio Panel (generate form + tracks + studio controls) ──────────
function SonanceStudioPanel() {
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [tracks, setTracks]       = useState<Track[]>([]);
  const [genres, setGenres]       = useState<string[]>(['SGV Oldies']);
  const [moods, setMoods]         = useState<string[]>(['Late-Night Honesty']);
  const [lyrics, setLyrics]       = useState('Cruising through El Monte, bruised but still breathing.');
  const [title, setTitle]         = useState('');
  const [genre, setGenre]         = useState('SGV Oldies');
  const [mood, setMood]           = useState('Late-Night Honesty');

  // Studio controls state — wired to /api/generate
  const [selectedVoice, setSelectedVoice]       = useState<string>('zephyr');
  const [vulnerabilityAgg, setVulnAgg]          = useState<number>(0.54);
  const [swingMs, setSwingMs]                   = useState<number>(12);

  // Modal state
  const [shareTrack, setShareTrack]             = useState<Track | null>(null);
  const [flipDna, setFlipDna]                   = useState<string | null>(null);
  const [expandedDna, setExpandedDna]           = useState<Set<string>>(new Set());

  const canGenerate = useMemo(() => lyrics.trim().length > 0, [lyrics]);

  const loadData = useCallback(async () => {
    try {
      const [vibesRes, tracksRes] = await Promise.all([
        fetch(`${BACKEND}/api/vibes`),
        fetch(`${BACKEND}/api/tracks`, { headers: authHeaders() }),
      ]);
      if (vibesRes.ok) {
        const v = await vibesRes.json();
        if (v.genres?.length) { setGenres(v.genres); }
        if (v.moods?.length)  { setMoods(v.moods); }
      }
      if (tracksRes.ok) {
        const list = await tracksRes.json();
        const seen = new Set();
        setTracks(Array.isArray(list) ? list.filter(t => { if (seen.has(t.dna_tag)) return false; seen.add(t.dna_tag); return true; }) : []);
      }
    } catch { setError('Unable to load studio data.'); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generate = async () => {
    if (!canGenerate || loading) return;
    setLoading(true); setError('');
    try {
      // Find voiceName from selected profile
      const profile = VOCAL_PROFILES.find((p: any) => p.name.toLowerCase() === selectedVoice.toLowerCase());
      const ghostAudioName = profile?.voiceName || selectedVoice;

      const r = await fetch(`${BACKEND}/api/generate`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          lyrics, genre, mood,
          title: title || undefined,
          ghost_audio_name: ghostAudioName,
          vulnerability_override: vulnerabilityAgg,
          swing_ms: swingMs,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || 'Generation failed');
      setTracks(prev => [data, ...prev.filter(t => t.dna_tag !== data.dna_tag)]);
      setTitle('');
    } catch (e: any) { setError(e?.message || 'Generation failed.'); }
    finally { setLoading(false); }
  };

  const handleFlipped = (newTrack: Track) => {
    setTracks(prev => [newTrack, ...prev]);
  };

  const toggleExpand = (dna: string) => {
    setExpandedDna(prev => {
      const s = new Set(prev);
      s.has(dna) ? s.delete(dna) : s.add(dna);
      return s;
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">

      {/* Modals */}
      <AnimatePresence>
        {shareTrack && (
          <BloodlineShareCard track={shareTrack} onClose={() => setShareTrack(null)} />
        )}
        {flipDna && (
          <FlipModal dna_tag={flipDna} onClose={() => setFlipDna(null)} onFlipped={handleFlipped} />
        )}
      </AnimatePresence>

      <div className="px-6 py-6 max-w-6xl mx-auto space-y-6">

        {/* Generate Form */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wider text-pink-500 mb-3 font-bold">Soulfire Engine · Create Your Track</p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Track Title (optional)</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white"
                placeholder="My SGV Story" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Genre</label>
                <select value={genre} onChange={e => setGenre(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white">
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Vibe</label>
                <select value={mood} onChange={e => setMood(e.target.value)}
                  className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white">
                  {moods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
          <label className="block text-xs text-neutral-400 mb-1">Your Lyrics</label>
          <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} rows={4}
            className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white mb-4" placeholder="Tell your story..." />

          {/* Studio Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
            {/* Voice Selector */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1">
                <Mic2 className="w-3 h-3 text-pink-500" /> Ghost Voice
              </label>
              <select
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded px-2 py-1.5 text-xs text-white"
              >
                {(VOCAL_PROFILES as any[]).map((p: any) => (
                  <option key={p.id} value={p.name}>{p.name} — {p.archetype}</option>
                ))}
              </select>
            </div>

            {/* Vulnerability Aggregate */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-2">
                Vulnerability Override
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={0} max={1} step={0.01}
                  value={vulnerabilityAgg}
                  onChange={e => setVulnAgg(parseFloat(e.target.value))}
                  className="flex-1 h-1 rounded-lg appearance-none cursor-pointer accent-purple-500 bg-neutral-800"
                />
                <span className="text-xs font-mono text-purple-400 w-10 text-right">
                  {(vulnerabilityAgg * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Swing */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-2">
                Swing Delay
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range" min={10} max={15} step={1}
                  value={swingMs}
                  onChange={e => setSwingMs(parseInt(e.target.value))}
                  className="flex-1 h-1 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-neutral-800"
                />
                <span className="text-xs font-mono text-amber-400 w-10 text-right">{swingMs}ms</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={generate} disabled={!canGenerate || loading}
              className="px-5 py-2 bg-pink-500 hover:bg-pink-400 text-black font-black text-xs uppercase tracking-wider rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors">
              <Disc3 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Forging...' : 'Generate Track'}
            </button>
            <button onClick={loadData}
              className="px-5 py-2 border border-neutral-700 text-neutral-300 font-bold text-xs uppercase tracking-wider rounded-lg hover:border-neutral-500 transition-colors">
              Refresh
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <p className="text-[11px] text-neutral-500 mt-3">100% creator-owned. Every track gets a DNA tag. Royalties are yours forever.</p>
        </section>

        {/* Studio Controls Detail */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VulnerabilityPanel onVulnerabilityChange={setVulnAgg} />
          <LatePocketControl onSwingChange={setSwingMs} initialMs={swingMs} />
        </section>

        {/* Tracks */}
        <section className="space-y-4">
          <p className="text-xs uppercase tracking-wider text-neutral-500">Your Tracks</p>
          {tracks.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-neutral-500 text-sm">
              No tracks yet. Generate your first Soulfire above!
            </div>
          ) : tracks.map(t => (
            <article key={t.dna_tag} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="font-black text-white text-base">{t.title}</h3>
                <span className="text-[10px] uppercase tracking-widest text-amber-300 font-mono">DNA {t.dna_tag}</span>
              </div>
              <p className="text-xs text-neutral-400 mb-3">{t.cultural_matrix} • @{t.creator}</p>

              {/* Stems */}
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                {Array.isArray(t.stems) && t.stems.map((s, i) => {
                  const src = absolutize(s.src || null);
                  return (
                    <div key={`${t.dna_tag}_${s.name}_${i}`} className="bg-black border border-neutral-800 rounded p-3">
                      <p className="text-xs text-neutral-300 mb-2 uppercase tracking-wider">{s.name}</p>
                      {src ? (
                        <audio controls src={src} className="w-full h-8" />
                      ) : (
                        <p className="text-[11px] text-neutral-500">Processing stem...</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DNA Certificate */}
              <DNACertificate track={t} />

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => setShareTrack(t)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-pink-500" /> Share Bloodline
                </button>
                <button
                  onClick={() => setFlipDna(t.dna_tag)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors"
                >
                  <Repeat2 className="w-3.5 h-3.5 text-blue-400" /> Flip It
                </button>
                <button
                  onClick={() => toggleExpand(t.dna_tag)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors"
                >
                  <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                  {expandedDna.has(t.dna_tag) ? 'Less' : 'Details'}
                </button>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedDna.has(t.dna_tag) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 font-mono space-y-1">
                      <div>Flips: {t.flips ?? 0} · Streams: {(t.streams ?? 0).toLocaleString()}</div>
                      {t.parent_dna && <div>Parent DNA: {t.parent_dna}</div>}
                      <div>Created: {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

// ─── Generative Audio Suite (Orchestrator) ──────────────────────────────────

// ─── Main Nav + App Shell ────────────────────────────────────────────────────
const NAV_TABS: { id: AppMode; label: string; icon: React.ComponentType<any>; color: string }[] = [
  { id: 'sonance',      label: 'Studio',      icon: Sliders,  color: 'text-pink-400' },
  { id: 'universal',    label: 'Universal',   icon: Radio,    color: 'text-rose-400' },
  { id: 'orchestrator', label: 'Orchestrator',icon: Activity, color: 'text-blue-400' },
  { id: 'feed',         label: 'Feed',        icon: Flame,    color: 'text-orange-400' },
  { id: 'deck',         label: 'Stem Deck',   icon: Disc3,    color: 'text-purple-400' },
  { id: 'duet',         label: 'Duet',        icon: Users,    color: 'text-cyan-400' },
  { id: 'vics',         label: 'VICS',        icon: Activity, color: 'text-emerald-400' },
  { id: 'plans',        label: 'Plans',       icon: Wallet,   color: 'text-amber-400' },
];

function MainApp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mode, setMode] = useState<AppMode>('sonance');
  const [showOnboard, setShowOnboard] = useState(() => !localStorage.getItem('e1_onboarded'));

  const handleMode = (m: AppMode) => {
    setMode(m);
    // URL-mapped modes get real routes
    if (m === 'feed')  navigate('/feed');
    else if (m === 'deck')  navigate('/deck');
    else if (m === 'duet')  navigate('/duet');
    else if (m === 'vics')  navigate('/vics');
    else navigate('/');
  };

  // Sync mode from URL on load
  useEffect(() => {
    const p = location.pathname;
    if (p.startsWith('/feed'))  setMode('feed');
    else if (p.startsWith('/deck'))  setMode('deck');
    else if (p.startsWith('/duet'))  setMode('duet');
    else if (p.startsWith('/vics'))  setMode('vics');
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">

      {/* Onboarding Guide */}
      {showOnboard && <OnboardingGuide onDismiss={() => { localStorage.setItem('e1_onboarded', '1'); setShowOnboard(false); }} />}

      {/* Top Navigation */}
      <nav className="border-b border-neutral-800/50 bg-neutral-950/90 backdrop-blur-md z-40 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="font-black tracking-widest text-sm bg-clip-text text-transparent bg-gradient-to-r from-pink-200 to-rose-200 hidden sm:block">
              LYRICA 3 PRO
            </span>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-neutral-900/50 p-0.5 rounded-xl border border-neutral-800/50 overflow-x-auto hide-scrollbar flex-1 max-w-2xl">
            {NAV_TABS.map(tab => {
              const Icon = tab.icon;
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleMode(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    active ? `bg-neutral-800 ${tab.color} shadow-sm` : 'text-neutral-500 hover:text-neutral-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Wallet */}
          <div className="shrink-0">
            <WalletWidget />
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1">
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-neutral-500 text-sm">Loading...</div>}>
          <Routes>
            <Route path="/feed"  element={<FlipFeed />} />
            <Route path="/deck"  element={<StemDeck />} />
            <Route path="/duet"  element={<DuetEngine />} />
            <Route path="/vics"  element={<VICSProtocol />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/*" element={
              <AnimatePresence mode="wait">
                {mode === 'sonance' && (
                  <motion.div key="sonance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SonanceStudioPanel />
                  </motion.div>
                )}
                {mode === 'universal' && (
                  <motion.div key="universal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SLUniversalApp />
                  </motion.div>
                )}
                {mode === 'orchestrator' && (
                  <motion.div key="orchestrator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <App6Reference />
                  </motion.div>
                )}
                {mode === 'plans' && (
                  <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <PricingPage />
                  </motion.div>
                )}
              </AnimatePresence>
            } />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────
export default function App() {
  const [showStudio, setShowStudio] = useState(false);
  const location = useLocation();

  // Public pricing page — no login required
  if (location.pathname === '/pricing') {
    return <PricingPage />;
  }

  if (showStudio) {
    return (
      <LoginGate>
        <MainApp />
      </LoginGate>
    );
  }

  // Lyrica 3 Pro public landing — Viktor's design, ported to React
  return (
    <div className="relative">
      <LyricaPublicLanding onEnterStudio={() => setShowStudio(true)} />
    </div>
  );
}
