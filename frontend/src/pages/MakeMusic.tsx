import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { createTrack, generateLyrics, getAuthToken } from "../lib/api";
import { Wand2, Shield, Music, FileText, AlertTriangle, Sparkles } from "lucide-react";
import { absoluteAudioUrl, buildProof, loadSoulfireDefaults, makeLocalPreviewAudio, saveLocalTrack, type CreatorTrack } from "../lib/creatorLoop";

export function MakeMusic() {
  const defaults = loadSoulfireDefaults();
  const [lyrics, setLyrics] = useState("");
  const [genre, setGenre] = useState(defaults.genre.toLowerCase());
  const [mood, setMood] = useState(defaults.mood >= 65 ? "energetic" : defaults.mood <= 35 ? "melancholic" : "soulful");
  const [culture, setCulture] = useState(defaults.culture);
  const [prompt, setPrompt] = useState("creator-owned boulevard soul with protected provenance");
  const [title, setTitle] = useState("");
  const [result, setResult] = useState<CreatorTrack | null>(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => {
      const next = loadSoulfireDefaults();
      setGenre(next.genre.toLowerCase());
      setCulture(next.culture);
    };
    window.addEventListener('lyrica3:soulfire-defaults', sync);
    return () => window.removeEventListener('lyrica3:soulfire-defaults', sync);
  }, []);

  const handleGenerate = async () => {
    setGenLoading(true);
    setWarning("");
    try {
      if (!getAuthToken()) throw new Error("Sign in to use backend lyric generation.");
      const res = await generateLyrics(lyrics || prompt || "a soulful west coast anthem");
      setLyrics(res.lyrics || res.text || lyrics);
    } catch (err: any) {
      setWarning(err?.message || "Backend lyric generator unavailable. Keep writing manually or create a local protected preview.");
      if (!lyrics) {
        setLyrics(`Verse 1\n${prompt}\n\nHook\nCreator owns the fire, DNA in every line\nSoulprint on the master, royalties route in time`);
      }
    } finally {
      setGenLoading(false);
    }
  };

  const persistTrack = (track: CreatorTrack) => {
    saveLocalTrack(track);
    setResult(track);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setWarning("");
    setLoading(true);

    const trackTitle = title || `${culture} ${genre} proof track`;
    try {
      if (!getAuthToken()) throw new Error("Backend requires sign-in. Saved a local playable proof preview instead.");
      const res = await createTrack(lyrics || prompt, genre, mood, trackTitle);
      const proof = buildProof({ title: trackTitle, lyrics: lyrics || prompt, genre, mood, culture });
      persistTrack({
        ...res,
        ...proof,
        title: res.title || trackTitle,
        genre,
        mood,
        culture,
        roots: culture,
        lyrics,
        prompt,
        audio_url: absoluteAudioUrl(res.audio_url),
        source: 'backend',
      });
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || "Backend music generation unavailable.";
      setWarning(message);
      const proof = buildProof({ title: trackTitle, lyrics: lyrics || prompt, genre, mood, culture });
      persistTrack({
        id: `local_${Date.now()}`,
        title: trackTitle,
        creator: "Local Creator",
        genre,
        mood,
        culture,
        roots: culture,
        lyrics,
        prompt,
        audio_url: makeLocalPreviewAudio(),
        duration_sec: 1,
        created_at: new Date().toISOString(),
        source: 'local-fallback',
        ...proof,
        royalty_risk: { verdict: 'backend pending', decision: 'manual_review' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10 space-y-8">
      <div className="rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-fuchsia-950/30 p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-300">
          <Sparkles className="h-4 w-4" /> Make Music
        </div>
        <h1 className="mt-5 text-4xl font-semibold text-white">Create a protected Lyrica 3 track.</h1>
        <p className="mt-3 max-w-3xl text-zinc-300">Write lyrics or a prompt, apply Soulfire defaults, generate audio, attach DNA / Soulprint / VICS proof, then save it to My Tracks for creator-owned playback.</p>
      </div>

      {warning && <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200 flex gap-3"><AlertTriangle className="h-5 w-5 shrink-0" />{warning}</div>}
      {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

      {!result ? (
        <form onSubmit={handleCreate} className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
            <label className="block text-sm text-zinc-400">Title<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-500" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My creator-owned track" /></label>
            <label className="block text-sm text-zinc-400">Prompt<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-500" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the record you want" /></label>
            <div>
              <div className="mb-1 flex items-center justify-between"><label className="text-sm text-zinc-400">Lyrics</label><button type="button" onClick={handleGenerate} disabled={genLoading} className="flex items-center gap-1 text-xs text-fuchsia-300 hover:underline"><Wand2 className="h-3 w-3" /> {genLoading ? 'Writing...' : 'Generate lyrics'}</button></div>
              <textarea className="min-h-48 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-500" value={lyrics} onChange={(e) => setLyrics(e.target.value)} placeholder="Enter lyrics or generate from the prompt..." />
            </div>
          </div>
          <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
            <Field label="Genre" value={genre} setValue={setGenre} options={["hip-hop", "r&b", "west coast", "corrido", "soul", "pop", "electronic", "rock"]} />
            <Field label="Mood" value={mood} setValue={setMood} options={["soulful", "chill", "energetic", "dark", "uplifting", "melancholic"]} />
            <Field label="Culture / roots" value={culture} setValue={setCulture} options={["Chicano", "Classic LA", "Afro-Latin", "Neo-Tokyo", "Cyberpunk", "Minimalist"]} />
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-200"><Shield className="mb-2 h-5 w-5" />DNA, Soulprint, and VICS metadata will be saved with the track.</div>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-3 font-medium text-white transition-colors hover:bg-fuchsia-500 disabled:opacity-50"><Music className="h-4 w-4" />{loading ? "Creating..." : "Create + Save Track"}</button>
          </div>
        </form>
      ) : (
        <div className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div><h2 className="text-2xl font-semibold text-white">{result.title}</h2><p className="text-sm text-zinc-400">{result.genre} · {result.mood} · {result.culture} · {result.source === 'local-fallback' ? 'local fallback proof preview' : 'backend generated'}</p></div>
          <audio controls className="w-full" src={absoluteAudioUrl(result.audio_url || result.audioUrl)}>Your browser does not support the audio element.</audio>
          <div className="grid gap-3 md:grid-cols-3"><StatusBadge label="DNA" value={result.dna_tag} ok /><StatusBadge label="Soulprint" value={result.soulprint_id} ok /><StatusBadge label="VICS" value={result.vics_signature} ok /></div>
          <div className="flex flex-wrap gap-3"><button onClick={() => navigate('/my-tracks')} className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium hover:bg-zinc-700">Open My Tracks</button><button onClick={() => { setResult(null); setTitle(''); setLyrics(''); }} className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium hover:bg-zinc-700">Make Another</button></div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, setValue, options }: { label: string; value: string; setValue: (v: string) => void; options: string[] }) {
  return <label className="block text-sm text-zinc-400">{label}<select className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-500" value={value} onChange={(e) => setValue(e.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function StatusBadge({ label, value, ok }: { label: string; value?: string; ok?: boolean }) {
  return <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><p className="mb-1 text-xs text-zinc-500">{label}</p><p className={ok ? "break-all text-sm font-medium text-emerald-300" : "text-sm text-zinc-400"}>{value || 'Pending'}</p></div>;
}
