import React, { useState } from "react";
import { useNavigate } from "react-router";
import { createTrack, generateLyrics, clearAuthToken, getAuthToken } from "../lib/api";
import { Wand2, Shield, Music, FileText } from "lucide-react";

export function MakeMusic() {
  const [lyrics, setLyrics] = useState("");
  const [genre, setGenre] = useState("west coast");
  const [mood, setMood] = useState("soulful");
  const [title, setTitle] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const navigate = useNavigate();

  if (!getAuthToken()) {
    navigate("/auth", { replace: true });
    return null;
  }

  const handleGenerate = async () => {
    setGenLoading(true);
    try {
      const res = await generateLyrics(lyrics || "a soulful west coast anthem");
      setLyrics(res.lyrics);
    } catch {
      // fallback lyrics already in response
    } finally {
      setGenLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await createTrack(lyrics, genre, mood, title || undefined);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Make Music</h1>

      {!result ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 block mb-1">Title</label>
            <input
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Track"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Genre</label>
              <select
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                <option>west coast</option>
                <option>pop</option>
                <option>hip hop</option>
                <option>r&b</option>
                <option>corrido</option>
                <option>electronic</option>
                <option>rock</option>
                <option>soul</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Mood</label>
              <select
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              >
                <option>soulful</option>
                <option>chill</option>
                <option>energetic</option>
                <option>dark</option>
                <option>uplifting</option>
                <option>melancholic</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-zinc-400">Lyrics</label>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={genLoading}
                className="text-xs text-fuchsia-400 hover:underline flex items-center gap-1"
              >
                <Wand2 className="w-3 h-3" /> Generate
              </button>
            </div>
            <textarea
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-fuchsia-500 min-h-[120px]"
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Enter your lyrics or hit Generate..."
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-medium rounded-xl px-4 py-3 transition-colors flex items-center justify-center gap-2"
          >
            <Music className="w-4 h-4" />
            {loading ? "Creating..." : "Create Protected Track"}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-1">{result.title}</h2>
            <p className="text-sm text-zinc-500 mb-4">by {result.creator}</p>

            {result.audio_url && (
              <div className="mb-4">
                <audio controls className="w-full rounded-xl" src={result.audio_url}>
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <StatusBadge label="DNA Verified" ok={result.protection?.dna_verified} />
              <StatusBadge label="Soulprint" ok={result.protection?.soulprint_verified} confidence={result.protection?.soulprint_confidence} />
              <StatusBadge label="Royalty Trust" ok={result.royalty_risk?.decision !== "block_payout"} />
              <StatusBadge label="Payout" ok={result.royalty_risk?.verdict} neutral={result.royalty_risk?.verdict?.includes("delayed")} />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/music/tracks")}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
            >
              My Tracks
            </button>
            <button
              onClick={() => { setResult(null); setTitle(""); setLyrics(""); }}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Make Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ label, ok, confidence, neutral }: { label: string; ok?: boolean; confidence?: number; neutral?: boolean }) {
  const color = neutral ? "text-yellow-400" : ok ? "text-emerald-400" : "text-red-400";
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={`text-sm font-medium ${color}`}>
        {ok ? "Active" : neutral ? "Delayed" : "Inactive"}
        {confidence !== undefined && <span className="text-zinc-500 ml-1">({(confidence * 100).toFixed(0)}%)</span>}
      </p>
    </div>
  );
}
