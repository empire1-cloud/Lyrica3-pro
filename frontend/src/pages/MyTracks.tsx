import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { myTracks, getAuthToken } from "../lib/api";
import { Shield, Music, Fingerprint, Waves } from "lucide-react";
import { absoluteAudioUrl, loadLocalTracks, type CreatorTrack } from "../lib/creatorLoop";

export function MyTracks() {
  const [tracks, setTracks] = useState<CreatorTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const local = loadLocalTracks();
    setTracks(local);
    if (!getAuthToken()) {
      setNotice("Showing local creator library. Sign in to sync backend generated tracks and ledger proof.");
      setLoading(false);
      return;
    }
    myTracks()
      .then((remote) => {
        const merged = [...(remote || []), ...local].filter((track, index, all) => all.findIndex((item) => item.id === track.id) === index);
        localStorage.setItem("lyrica3.creator.tracks", JSON.stringify(merged.slice(0, 50)));
        setTracks(merged);
      })
      .catch(() => setNotice("Backend library unavailable. Showing saved local tracks instead."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-10 space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300"><Fingerprint className="h-4 w-4" /> Creator Library</div>
          <h1 className="text-3xl font-semibold text-white">My Tracks</h1>
          <p className="mt-2 text-sm text-zinc-400">Saved creator-owned tracks with playable audio and DNA / Soulprint / VICS proof.</p>
        </div>
        <button onClick={() => navigate("/make-music")} className="flex items-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-3 text-sm font-medium text-white hover:bg-fuchsia-500"><Music className="h-4 w-4" /> New Track</button>
      </div>

      {notice && <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-200">{notice}</div>}

      {loading ? <p className="text-zinc-500">Loading...</p> : tracks.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 py-16 text-center text-zinc-500"><Shield className="mx-auto mb-4 h-12 w-12 opacity-30" /><p>No tracks yet</p><button onClick={() => navigate("/make-music")} className="mt-2 text-sm text-fuchsia-400 hover:underline">Create your first protected track</button></div>
      ) : (
        <div className="grid gap-4">
          {tracks.map((t) => <TrackCard key={t.id} track={t} />)}
        </div>
      )}
    </div>
  );
}

function TrackCard({ track }: { track: CreatorTrack }) {
  return (
    <article className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">{track.title}</h3>
          <p className="mt-1 text-sm text-zinc-400">{track.genre || 'genre pending'} · {track.mood || 'mood pending'} · {track.culture || track.roots || 'roots pending'}</p>
          <p className="mt-1 text-xs text-zinc-500">{track.created_at ? new Date(track.created_at).toLocaleString() : 'Recently saved'} · {track.creator || 'Creator'}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200"><Waves className="h-3 w-3" /> Ready for SL Universal</div>
      </div>
      <audio controls className="mb-4 w-full" src={absoluteAudioUrl(track.audio_url || track.audioUrl || (track.id?.startsWith('track_') ? `/api/music/${track.id}/audio` : undefined))}>Your browser does not support the audio element.</audio>
      <div className="grid gap-2 md:grid-cols-3">
        <MiniBadge label="DNA" value={track.dna_tag} ok={track.soulprint_verified || track.protection?.dna_verified} />
        <MiniBadge label="Soulprint" value={track.soulprint_id || (track.protection?.soulprint_confidence ? `${Math.round(track.protection.soulprint_confidence * 100)}%` : undefined)} ok={track.soulprint_verified || track.protection?.soulprint_verified} />
        <MiniBadge label="VICS" value={track.vics_signature || track.royalty_risk?.verdict} ok={track.royalty_trust !== false} />
      </div>
    </article>
  );
}

function MiniBadge({ label, value, ok }: { label: string; value?: string; ok?: boolean }) {
  return <div className={`rounded-xl border px-3 py-2 text-xs ${ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-zinc-700 bg-zinc-950 text-zinc-400"}`}><span className="font-semibold">{label}:</span> <span className="break-all">{value || 'pending'}</span></div>;
}
