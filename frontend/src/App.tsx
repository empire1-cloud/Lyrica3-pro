import React, { useEffect, useMemo, useState } from 'react';
import BillingPage from './Billing';
import LyricaPublicLanding from './LyricaPublicLanding';

type Mode = 'studio' | 'status' | 'billing';

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

type HealthResponse = {
  status?: string;
  service?: string;
  detail?: string;
  demo_mode?: boolean;
  providers?: {
    llm?: boolean;
    music?: boolean;
    tts?: boolean;
  };
};

type StatusItem = {
  label: string;
  ok: boolean;
  detail: string;
};

type QuickStart = {
  label: string;
  genre: string;
  mood: string;
  lyrics: string;
};

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://lyrica3-pro-backend-e2q5oemapa-uc.a.run.app';

const QUICK_STARTS: QuickStart[] = [
  {
    label: 'Late-night oldies',
    genre: 'SGV Oldies',
    mood: 'Late-Night Honesty',
    lyrics: 'Cruising through El Monte, bruised but still breathing.',
  },
  {
    label: 'Boulevard bounce',
    genre: 'Street Bounce',
    mood: 'Backyard Euphoria',
    lyrics: 'Chrome lights shaking while the bass keeps blessing the block.',
  },
  {
    label: 'Requinto grief',
    genre: 'Corridos',
    mood: 'Requinto Lament',
    lyrics: 'My abuelita left her prayers in the strings and I still hear them sing.',
  },
];

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

function StatusCard({ item }: { item: StatusItem }) {
  return (
    <div className={`rounded-2xl border p-4 ${item.ok ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{item.label}</p>
          <p className="mt-1 text-sm text-neutral-300">{item.detail}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${item.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
          {item.ok ? 'Ready' : 'Needs attention'}
        </span>
      </div>
    </div>
  );
}

function LoginGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function StudioBlackBox() {
  const [mode, setMode] = useState<Mode>('studio');
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [genres, setGenres] = useState<string[]>(['SGV Oldies']);
  const [moods, setMoods] = useState<string[]>(['Late-Night Honesty']);
  const [lyrics, setLyrics] = useState('Cruising through El Monte, bruised but still breathing.');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('SGV Oldies');
  const [mood, setMood] = useState('Late-Night Honesty');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [statusError, setStatusError] = useState('');
  const [lastChecked, setLastChecked] = useState<string>('');

  const canGenerate = useMemo(() => lyrics.trim().length > 0, [lyrics]);

  const ensureDemoToken = async () => {
    if (localStorage.getItem('e1_token')) return true;
    try {
      const response = await fetch(`${BACKEND}/api/auth/demo`, { method: 'POST' });
      if (!response.ok) {
        console.warn(`Demo auth unavailable: HTTP ${response.status}`);
        return false;
      }
      const data = await response.json();
      if (!data?.token) {
        console.warn('Demo auth response did not include a token.');
        return false;
      }
      localStorage.setItem('e1_token', data.token);
      return true;
    } catch {
      console.warn('Demo auth request failed. Check backend readiness in the Status tab.');
      return false;
    }
  };

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

  const refreshStatus = async () => {
    setStatusLoading(true);
    setStatusError('');
    try {
      const response = await fetch(`${BACKEND}/api/health`, { cache: 'no-store' });
      const data: HealthResponse = await response.json().catch(() => ({}));
      setHealth({ ...data, status: response.ok ? data.status || 'ok' : data.status || 'unhealthy' });
      setLastChecked(new Date().toLocaleTimeString());
      if (!response.ok) {
        setStatusError(data.detail || 'Backend is reachable but not healthy yet.');
      }
    } catch {
      setHealth(null);
      setStatusError('Unable to reach the backend health endpoint.');
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    void ensureDemoToken();
    void loadData();
    void refreshStatus();
  }, []);

  const backendReachable = Boolean(health);
  const statusItems: StatusItem[] = [
    {
      label: 'Frontend shell',
      ok: true,
      detail: 'Studio UI is loaded and ready for input.',
    },
    {
      label: 'Backend API',
      ok: backendReachable,
      detail: health ? `${health.service || 'API'} responded with ${health.status || 'ok'}.` : statusError || 'Waiting for backend response.',
    },
    {
      label: 'MongoDB',
      ok: health?.status === 'ok',
      detail: health?.status === 'ok' ? 'Connected through the existing /api/health probe.' : health?.detail || 'Mongo is not reachable yet.',
    },
    {
      label: 'API base URL',
      ok: Boolean(process.env.REACT_APP_BACKEND_URL),
      detail: process.env.REACT_APP_BACKEND_URL || 'Using the baked-in fallback backend URL.',
    },
    {
      label: 'Demo mode',
      ok: Boolean(health?.demo_mode),
      detail: health?.demo_mode ? 'Guest auth is active for local/Codespaces use.' : 'Demo auth is disabled. Use normal auth before generating.',
    },
    {
      label: 'Demo / fallback providers',
      ok: Boolean(health?.providers?.llm || health?.providers?.music || health?.demo_mode),
      detail: health?.providers
        ? `LLM ${health.providers.llm ? 'configured' : 'fallback'} · Music ${health.providers.music ? 'configured' : 'fallback'} · TTS ${health.providers.tts ? 'configured' : 'fallback'}`
        : 'External AI keys are optional; fallback audio stays available in demo mode.',
    },
  ];

  const applyQuickStart = (preset: QuickStart) => {
    setGenre(preset.genre);
    setMood(preset.mood);
    setLyrics(preset.lyrics);
    setTitle('');
    setMode('studio');
  };

  const generate = async () => {
    if (!canGenerate || loading) return;
    setLoading(true);
    setError('');
    try {
      const hasToken = await ensureDemoToken();
      if (!hasToken) {
        throw new Error('Demo login unavailable — open System Status to check backend readiness.');
      }
      const response = await fetch(`${BACKEND}/api/generate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ lyrics, genre, mood, title: title || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || 'Generation failed');
      setTracks((prev) => [data, ...prev.filter((track) => track.dna_tag !== data.dna_tag)]);
      setTitle('');
      void refreshStatus();
    } catch (generationError: any) {
      setError(generationError?.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-4 py-4 sm:px-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-amber-400">Lyrica 3 Pro</div>
          <h1 className="text-2xl font-black">Black Box Studio</h1>
          <p className="mt-1 text-sm text-neutral-400">One-command, demo-first workflow for a solo builder.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['studio', 'status', 'billing'] as Mode[]).map((nextMode) => (
            <button
              key={nextMode}
              onClick={() => setMode(nextMode)}
              className={`min-h-12 rounded-xl border px-5 text-xs font-bold uppercase tracking-[0.2em] ${mode === nextMode ? 'border-amber-400 bg-amber-400/10 text-amber-300' : 'border-neutral-700 text-neutral-300'}`}
            >
              {nextMode}
            </button>
          ))}
        </div>
      </header>

      {mode === 'billing' ? (
        <BillingPage />
      ) : mode === 'status' ? (
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Startup checklist</p>
                <h2 className="mt-2 text-2xl font-black">Green / red health for the whole happy path</h2>
                <p className="mt-2 text-sm text-neutral-400">
                  Frontend, backend, Mongo, demo auth, and optional AI providers are summarized here so you do not need to inspect logs first.
                </p>
              </div>
              <button
                onClick={refreshStatus}
                className="min-h-12 rounded-xl border border-neutral-700 px-5 text-xs font-bold uppercase tracking-[0.2em] text-neutral-100"
              >
                {statusLoading ? 'Refreshing…' : 'Refresh checks'}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-400">
              <span>Backend: {BACKEND}</span>
              <span>Last checked: {lastChecked || 'not yet'}</span>
            </div>
            {statusError && <p className="mt-3 text-sm text-red-300">{statusError}</p>}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {statusItems.map((item) => (
              <StatusCard key={item.label} item={item} />
            ))}
          </section>
        </main>
      ) : (
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Solo builder mode</p>
                <h2 className="mt-2 text-2xl font-black">Fast path to a playable track</h2>
                <p className="mt-2 text-sm text-neutral-400">
                  Press <span className="font-semibold text-neutral-200">Ctrl/Cmd + Enter</span> to generate. Demo mode keeps the core flow live even when AI keys are missing.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusItems.slice(1, 4).map((item) => (
                  <span key={item.label} className={`rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] ${item.ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Quick starts</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {QUICK_STARTS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyQuickStart(preset)}
                  className="min-h-20 rounded-2xl border border-neutral-700 bg-black px-4 py-4 text-left transition hover:border-amber-400 hover:text-amber-200"
                >
                  <div className="text-sm font-bold uppercase tracking-[0.15em]">{preset.label}</div>
                  <div className="mt-2 text-sm text-neutral-400">{preset.genre} · {preset.mood}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-neutral-500">Creator input</p>
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-neutral-400">Title (optional)</label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-neutral-700 bg-black px-4 text-base"
                  placeholder="Smile Through Damage"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-neutral-400">Genre</label>
                  <select value={genre} onChange={(event) => setGenre(event.target.value)} className="min-h-12 w-full rounded-xl border border-neutral-700 bg-black px-4 text-base">
                    {genres.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-neutral-400">Mood</label>
                  <select value={mood} onChange={(event) => setMood(event.target.value)} className="min-h-12 w-full rounded-xl border border-neutral-700 bg-black px-4 text-base">
                    {moods.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <label className="mb-1 block text-xs text-neutral-400">Lyric seed</label>
            <textarea
              value={lyrics}
              onChange={(event) => setLyrics(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  void generate();
                }
              }}
              aria-keyshortcuts="Control+Enter Meta+Enter"
              rows={6}
              className="mb-4 w-full rounded-2xl border border-neutral-700 bg-black px-4 py-3 text-base"
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={generate} disabled={!canGenerate || loading} className="min-h-14 rounded-2xl bg-amber-400 px-6 text-sm font-black uppercase tracking-[0.2em] text-black disabled:opacity-50">
                {loading ? 'Generating…' : 'Generate track'}
              </button>
              <button onClick={loadData} className="min-h-14 rounded-2xl border border-neutral-700 px-6 text-sm font-bold uppercase tracking-[0.2em] text-neutral-200">
                Refresh tracks
              </button>
              <button onClick={() => setMode('status')} className="min-h-14 rounded-2xl border border-neutral-700 px-6 text-sm font-bold uppercase tracking-[0.2em] text-neutral-200">
                Open system status
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <p className="mt-3 text-[11px] text-neutral-500">Lyrica operates as a sovereign black box: creators control outputs, never internals.</p>
          </section>

          <section className="space-y-4">
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Track outputs</p>
            {tracks.length === 0 ? (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-sm text-neutral-500">No tracks yet.</div>
            ) : tracks.map((track) => (
              <article key={track.dna_tag} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-white">{track.title}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-amber-300">DNA {track.dna_tag}</span>
                </div>
                <p className="mb-4 text-xs text-neutral-400">{track.cultural_matrix} • by @{track.creator}</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.isArray(track.stems) && track.stems.map((stem, index) => {
                    const src = absolutize(stem.src || null);
                    return (
                      <div key={`${track.dna_tag}_${stem.name}_${index}`} className="rounded-xl border border-neutral-800 bg-black p-3">
                        <p className="mb-2 text-sm text-neutral-300">{stem.name}</p>
                        {src ? (
                          <audio controls src={src} className="h-10 w-full" />
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
