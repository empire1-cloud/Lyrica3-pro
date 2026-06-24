import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { myTracks, getAuthToken } from "../lib/api";
import { Shield, Music } from "lucide-react";

export function MyTracks() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  if (!getAuthToken()) {
    navigate("/auth", { replace: true });
    return null;
  }

  useEffect(() => {
    myTracks()
      .then(setTracks)
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Tracks</h1>
        <button
          onClick={() => navigate("/music/make")}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-sm font-medium rounded-xl px-4 py-2 transition-colors flex items-center gap-2"
        >
          <Music className="w-4 h-4" /> New Track
        </button>
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : tracks.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No tracks yet</p>
          <button
            onClick={() => navigate("/music/make")}
            className="text-fuchsia-400 hover:underline text-sm mt-2"
          >
            Create your first protected track
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tracks.map((t) => (
            <div
              key={t.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 transition-colors"
            >
              <div
                onClick={() => navigate(`/music/${t.id}/proof`)}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{t.title}</h3>
                  <span className="text-xs text-zinc-500">{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 flex-wrap mb-2">
                  <MiniBadge label="DNA" ok={t.soulprint_verified} />
                  <MiniBadge label="Ledger" ok={t.ledger_valid} />
                  <MiniBadge label="Trust" ok={t.royalty_trust} />
                  <span className="text-xs text-zinc-600 font-mono">{t.dna_tag?.slice(0, 16)}...</span>
                </div>
              </div>
              <audio controls className="w-full rounded-xl mt-1" src={`/api/music/${t.id}/audio`}>
                Your browser does not support the audio element.
              </audio>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniBadge({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${ok ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300"}`}>
      {label}: {ok ? "OK" : "—"}
    </span>
  );
}
