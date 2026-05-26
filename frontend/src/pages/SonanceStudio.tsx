import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music, Sparkles, Repeat2, Share2, ListMusic, X, Disc3,
  Mic2, Wand2, ChevronDown, Wallet, Flame,
} from 'lucide-react';
import BloodlineShareCard from '../components/BloodlineShareCard';
import VulnerabilityPanel from '../components/studio/VulnerabilityPanel';
import LatePocketControl from '../components/studio/LatePocketControl';
import { VOCAL_PROFILES } from '../components/studio/VoiceAuditionGallery';

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

function authHeaders() {
  const token = localStorage.getItem('e1_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
function absolutize(src?: string | null) {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith('blob:')) return src;
  return `${BACKEND}${src.startsWith('/') ? '' : '/'}${src}`;
}

const GENRE_PRESETS = [
  'SGV Oldies', 'Trap Soul', 'West Coast', 'R&B', 'Hip-Hop',
  'Lo-Fi', 'House', 'Ambient', 'Latin Trap', 'Drill',
  'Jazz', 'Neo-Soul', 'Funk', 'Reggaeton', 'Country Trap',
];
const MOOD_PRESETS = [
  'Late-Night Honesty', 'Hustle', 'Melancholy', 'Euphoric',
  'Dark', 'Romantic', 'Angry', 'Reflective', 'Bouncy', 'Dreamy',
];

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
            {loading ? 'Minting Flip...' : 'Mint Flip'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

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
          <div className="text-[10px] text-neutral-400">Creator: @{track.creator} &middot; {track.cultural_matrix}</div>
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

export default function SonanceStudio() {
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [tracks, setTracks]         = useState<Track[]>([]);
  const [genres, setGenres]         = useState<string[]>(GENRE_PRESETS);
  const [moods, setMoods]           = useState<string[]>(MOOD_PRESETS);
  const [lyrics, setLyrics]         = useState('');
  const [title, setTitle]           = useState('');
  const [genre, setGenre]           = useState('SGV Oldies');
  const [mood, setMood]             = useState('Late-Night Honesty');
  const [selectedVoice, setSelectedVoice] = useState<string>('zephyr');
  const [vulnerabilityAgg, setVulnAgg] = useState<number>(0.54);
  const [swingMs, setSwingMs]       = useState<number>(12);
  const [shareTrack, setShareTrack]  = useState<Track | null>(null);
  const [flipDna, setFlipDna]       = useState<string | null>(null);
  const [expandedDna, setExpandedDna] = useState<Set<string>>(new Set());

  const canGenerate = useMemo(() => lyrics.trim().length > 0, [lyrics]);

  const loadData = useCallback(async () => {
    try {
      const [vibesRes, tracksRes] = await Promise.all([
        fetch(`${BACKEND}/api/vibes`),
        fetch(`${BACKEND}/api/tracks`, { headers: authHeaders() }),
      ]);
      if (vibesRes.ok) {
        const v = await vibesRes.json();
        if (v.genres?.length) setGenres(v.genres);
        if (v.moods?.length)  setMoods(v.moods);
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
    <div className="min-h-screen bg-[#05060D] text-white">
      <AnimatePresence>
        {shareTrack && <BloodlineShareCard track={shareTrack} onClose={() => setShareTrack(null)} />}
        {flipDna && <FlipModal dna_tag={flipDna} onClose={() => setFlipDna(null)} onFlipped={handleFlipped} />}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* ── Hero Create Area ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-pink-500/10 bg-gradient-to-b from-[#0E0F17] to-[#05060D] p-8 md:p-12"
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/5 blur-[100px] -ml-32 -mb-32 pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-pink-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Soulfire Studio</h2>
                <p className="text-[11px] text-neutral-500 uppercase tracking-widest">AI Music Generation Engine</p>
              </div>
            </div>

            {/* Lyrics Input */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Your Lyrics</label>
              <textarea
                value={lyrics}
                onChange={e => setLyrics(e.target.value)}
                rows={5}
                placeholder="Tell your story. Every line is a DNA strand..."
                className="w-full bg-black/60 border border-neutral-800 focus:border-pink-500/50 rounded-xl px-5 py-4 text-base text-white placeholder-neutral-600 resize-none transition-colors outline-none"
                style={{ minHeight: 140 }}
              />
              <div className="flex justify-between text-[11px] text-neutral-600">
                <span>{lyrics.length} characters</span>
                {!canGenerate && <span className="text-pink-500">Add lyrics to generate</span>}
              </div>
            </div>

            {/* Track Title & Controls Row */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Track Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Name your creation"
                  className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-neutral-500 mb-1.5 uppercase tracking-wider">Voice</label>
                  <select
                    value={selectedVoice}
                    onChange={e => setSelectedVoice(e.target.value)}
                    className="w-full bg-black/60 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500/50 transition-colors"
                  >
                    {(VOCAL_PROFILES as any[]).map((p: any) => (
                      <option key={p.id} value={p.name}>{p.name} &mdash; {p.archetype}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Genre & Mood Chips */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs text-neutral-500 uppercase tracking-wider">Genre</label>
                <div className="flex flex-wrap gap-2">
                  {genres.slice(0, 12).map(g => (
                    <button
                      key={g}
                      onClick={() => setGenre(g)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                        genre === g
                          ? 'bg-pink-500 text-black shadow-lg shadow-pink-500/20'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs text-neutral-500 uppercase tracking-wider">Vibe</label>
                <div className="flex flex-wrap gap-2">
                  {moods.slice(0, 10).map(m => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                        mood === m
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Controls */}
            <details className="group">
              <summary className="text-xs text-neutral-500 cursor-pointer hover:text-neutral-300 transition-colors flex items-center gap-2 uppercase tracking-wider">
                <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                Advanced Controls
              </summary>
              <div className="mt-4 grid md:grid-cols-3 gap-4 p-4 bg-black/40 border border-neutral-800/50 rounded-xl">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1">
                    <Mic2 className="w-3 h-3 text-pink-500" /> Vulnerability
                  </label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={1} step={0.01}
                      value={vulnerabilityAgg}
                      onChange={e => setVulnAgg(parseFloat(e.target.value))}
                      className="flex-1 h-1 rounded-lg appearance-none cursor-pointer accent-pink-500 bg-neutral-800"
                    />
                    <span className="text-xs font-mono text-pink-400 w-10 text-right">
                      {(vulnerabilityAgg * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-500 mb-2">Swing Delay</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={10} max={15} step={1}
                      value={swingMs}
                      onChange={e => setSwingMs(parseInt(e.target.value))}
                      className="flex-1 h-1 rounded-lg appearance-none cursor-pointer accent-amber-500 bg-neutral-800"
                    />
                    <span className="text-xs font-mono text-amber-400 w-10 text-right">{swingMs}ms</span>
                  </div>
                </div>
              </div>
            </details>

            {/* Generate Button */}
            <div className="flex items-center gap-4 pt-2">
              <motion.button
                whileHover={canGenerate && !loading ? { scale: 1.02 } : {}}
                whileTap={canGenerate && !loading ? { scale: 0.98 } : {}}
                onClick={generate}
                disabled={!canGenerate || loading}
                className="relative px-10 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-black font-black text-sm uppercase tracking-[0.15em] rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3 transition-all shadow-2xl shadow-pink-500/25 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-3">
                  {loading ? (
                    <Disc3 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Wand2 className="w-5 h-5" />
                  )}
                  {loading ? 'Forging Your Soulfire...' : 'Generate Track'}
                </span>
              </motion.button>
              <button onClick={loadData}
                className="px-5 py-4 border border-neutral-800 text-neutral-400 font-bold text-xs uppercase tracking-wider rounded-2xl hover:border-neutral-600 hover:text-white transition-all">
                Refresh
              </button>
            </div>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </motion.p>
            )}
            <p className="text-[11px] text-neutral-600">100% creator-owned. Every track gets a DNA tag. Royalties are yours forever.</p>
          </div>
        </motion.section>

        {/* ── Studio Detail Controls ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VulnerabilityPanel onVulnerabilityChange={setVulnAgg} />
          <LatePocketControl onSwingChange={setSwingMs} initialMs={swingMs} />
        </section>

        {/* ── Tracks Section ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Music className="w-4 h-4 text-pink-500" />
              Your Tracks
              <span className="text-neutral-600 font-mono text-[11px]">({tracks.length})</span>
            </h3>
          </div>

          {tracks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-[#0E0F17] border border-neutral-800 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                <Music className="w-8 h-8 text-pink-500/40" />
              </div>
              <p className="text-neutral-400 text-sm">No tracks yet.</p>
              <p className="text-neutral-600 text-xs mt-1">Write your lyrics above and forge your first Soulfire.</p>
            </motion.div>
          ) : (
            <div className="grid gap-4">
              {tracks.map(t => (
                <motion.article
                  key={t.dna_tag}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0E0F17] border border-neutral-800/60 hover:border-pink-500/20 rounded-2xl p-6 transition-colors"
                >
                  {/* Track Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/10 flex items-center justify-center border border-pink-500/10">
                        <Music className="w-5 h-5 text-pink-400" />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-base">{t.title}</h4>
                        <p className="text-[11px] text-neutral-500">{t.cultural_matrix} &middot; @{t.creator}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.25em] text-amber-400/80 font-mono bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                      DNA {t.dna_tag}
                    </span>
                  </div>

                  {/* Stems */}
                  <div className="grid md:grid-cols-2 gap-3 mb-4">
                    {Array.isArray(t.stems) && t.stems.map((s, i) => {
                      const src = absolutize(s.src || null);
                      return (
                        <div key={`${t.dna_tag}_${s.name}_${i}`}
                          className="bg-black/40 border border-neutral-800/60 rounded-xl p-3">
                          <p className="text-[11px] text-neutral-400 mb-2 uppercase tracking-wider font-bold">{s.name}</p>
                          {src ? (
                            <audio controls src={src} className="w-full h-8 rounded-lg" />
                          ) : (
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                              <div className="w-4 h-4 rounded-full border-2 border-neutral-700 border-t-transparent animate-spin" />
                              Processing stem...
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* DNA Certificate + Actions */}
                  <div className="space-y-3">
                    <DNACertificate track={t} />
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setShareTrack(t)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors">
                        <Share2 className="w-3.5 h-3.5 text-pink-500" /> Share Bloodline
                      </button>
                      <button onClick={() => setFlipDna(t.dna_tag)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors">
                        <Repeat2 className="w-3.5 h-3.5 text-blue-400" /> Flip It
                      </button>
                      <button onClick={() => toggleExpand(t.dna_tag)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors">
                        <ListMusic className="w-3.5 h-3.5 text-amber-400" />
                        {expandedDna.has(t.dna_tag) ? 'Less' : 'Details'}
                      </button>
                    </div>
                    <AnimatePresence>
                      {expandedDna.has(t.dna_tag) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="p-3 bg-black/40 border border-neutral-800 rounded-lg text-[11px] text-neutral-500 font-mono space-y-1">
                            <div>Flips: {t.flips ?? 0} &middot; Streams: {(t.streams ?? 0).toLocaleString()}</div>
                            {t.parent_dna && <div>Parent DNA: {t.parent_dna}</div>}
                            <div>Created: {t.created_at ? new Date(t.created_at).toLocaleDateString() : '&mdash;'}</div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
