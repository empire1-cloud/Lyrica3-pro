import React, { useEffect, useMemo, useState } from 'react';
import BillingPage from './Billing';
import LyricaPublicLanding from './LyricaPublicLanding';

type Mode = 'studio' | 'billing';

type Stem = {
  name: string;
  level?: number;
  peak?: number;
  src?: string | null;
};

type Track = {
  id: string;
  dna_tag: string;
  title: string;
  creator: string;
  cultural_matrix: string;
  stems: Stem[];
  streams?: number;
  flips?: number;
  created_at?: string;
};

type VibesResponse = {
  genres: string[];
  moods: string[];
};

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://lyrica3-pro-backend-e2q5oemapa-uc.a.run.app';

function authHeaders() {
  const token = localStorage.getItem('e1_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function absolutize(src?: string | null) {
  if (!src) return null;
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) return src;
  return `${BACKEND}${src.startsWith('/') ? '' : '/'}${src}`;
}

function LoginGate({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('e1_token'));
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${BACKEND}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, password }),
      });
      const data = await r.json();
      if (data.token) {
        localStorage.setItem('e1_token', data.token);
        setToken(data.token);
      } else {
        setError(data.detail || 'Invalid credentials');
      }
    } catch {
      setError('Connection error — try again');
    }
    setLoading(false);
  };

  if (token) return <>{children}</>;

  return (
    <div style={{ minHeight: '100vh', background: '#030303', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-monospace, monospace' }}>
      <div style={{ width: 360, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 16, padding: 40 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#D4AF37', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>Lyrica 3 Pro</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>EMPIRE 1</div>
          <div style={{ fontSize: 10, color: '#444', marginTop: 4, letterSpacing: '0.2em' }}>SOVEREIGN STUDIO ACCESS</div>
        </div>
        <form onSubmit={login}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Handle"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              required
              style={{ width: '100%', background: '#000', border: '1px solid #222', color: '#fff', padding: '12px 14px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', background: '#000', border: '1px solid #222', color: '#fff', padding: '12px 14px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 14, textAlign: 'center' }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#D4AF37', color: '#000', border: 'none', borderRadius: 8, padding: '13px 0', fontWeight: 900, fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Authenticating...' : 'Enter Studio'}
          </button>
        </form>
      </div>
    </div>
  );
}

function StudioBlackBox() {
  const [mode, setMode] = useState<Mode>('studio');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [genres, setGenres] = useState<string[]>(['SGV Oldies']);
  const [moods, setMoods] = useState<string[]>(['Late-Night Honesty']);
  const [lyrics, setLyrics] = useState('Cruising through El Monte, bruised but still breathing.');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('SGV Oldies');
  const [mood, setMood] = useState('Late-Night Honesty');

  const canGenerate = useMemo(() => lyrics.trim().length > 0, [lyrics]);

  const loadData = async () => {
    try {
      const [vibesRes, tracksRes] = await Promise.all([
        fetch(`${BACKEND}/api/vibes`),
        fetch(`${BACKEND}/api/tracks`, { headers: authHeaders() }),
      ]);
      if (vibesRes.ok) {
        const v: VibesResponse = await vibesRes.json();
        if (Array.isArray(v.genres) && v.genres.length) {
          setGenres(v.genres);
          if (!v.genres.includes(genre)) setGenre(v.genres[0]);
        }
        if (Array.isArray(v.moods) && v.moods.length) {
          setMoods(v.moods);
          if (!v.moods.includes(mood)) setMood(v.moods[0]);
        }
      }
      if (tracksRes.ok) {
        const list: Track[] = await tracksRes.json();
        setTracks(Array.isArray(list) ? list : []);
      }
    } catch {
      setError('Unable to load studio data right now.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generate = async () => {
    if (!canGenerate || loading) return;
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${BACKEND}/api/generate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ lyrics, genre, mood, title: title || undefined }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || 'Generation failed');
      setTracks(prev => [data, ...prev.filter(t => t.dna_tag !== data.dna_tag)]);
      setTitle('');
    } catch (e: any) {
      setError(e?.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-amber-400">Lyrica 3 Pro</div>
          <h1 className="text-xl font-black">Black Box Studio</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('studio')} className={`px-4 py-2 text-xs uppercase tracking-widest border ${mode === 'studio' ? 'border-amber-400 text-amber-300' : 'border-neutral-700 text-neutral-400'}`}>Studio</button>
          <button onClick={() => setMode('billing')} className={`px-4 py-2 text-xs uppercase tracking-widest border ${mode === 'billing' ? 'border-amber-400 text-amber-300' : 'border-neutral-700 text-neutral-400'}`}>Plans</button>
        </div>
      </header>

      {mode === 'billing' ? (
        <BillingPage />
      ) : (
        <main className="px-6 py-6 max-w-6xl mx-auto space-y-6">
          <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Creator Input</p>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Title (optional)</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm" placeholder="Smile Through Damage" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Genre</label>
                  <select value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm">
                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Mood</label>
                  <select value={mood} onChange={(e) => setMood(e.target.value)} className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm">
                    {moods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <label className="block text-xs text-neutral-400 mb-1">Lyric seed</label>
            <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={5} className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm mb-4" />
            <div className="flex items-center gap-3">
              <button onClick={generate} disabled={!canGenerate || loading} className="px-5 py-2 bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded disabled:opacity-50">
                {loading ? 'Generating...' : 'Generate Track'}
              </button>
              <button onClick={loadData} className="px-5 py-2 border border-neutral-700 text-neutral-300 font-bold text-xs uppercase tracking-wider rounded">Refresh</button>
            </div>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            <p className="text-[11px] text-neutral-500 mt-3">Lyrica operates as a sovereign black box: creators control outputs, never internals.</p>
          </section>

          <section className="space-y-4">
            <p className="text-xs uppercase tracking-wider text-neutral-500">Track Outputs</p>
            {tracks.length === 0 ? (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 text-neutral-500 text-sm">No tracks yet.</div>
            ) : tracks.map((t) => (
              <article key={t.dna_tag} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="font-bold text-white">{t.title}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-amber-300">DNA {t.dna_tag}</span>
                </div>
                <p className="text-xs text-neutral-400 mb-4">{t.cultural_matrix} • by @{t.creator}</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {Array.isArray(t.stems) && t.stems.map((s, i) => {
                    const src = absolutize(s.src || null);
                    return (
                      <div key={`${t.dna_tag}_${s.name}_${i}`} className="bg-black border border-neutral-800 rounded p-3">
                        <p className="text-xs text-neutral-300 mb-2">{s.name}</p>
                        {src ? (
                          <audio controls src={src} className="w-full h-8" />
                        ) : (
                          <p className="text-[11px] text-neutral-500">Stem asset pending</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        </main>
      )}
    </div>
  );
}

export default function App() {
  const [enteredStudio, setEnteredStudio] = useState(false);

  if (!enteredStudio) {
    return <LyricaPublicLanding onEnterStudio={() => setEnteredStudio(true)} />;
  }

  return (
    <LoginGate>
      <StudioBlackBox />
    </LoginGate>
  );
}
