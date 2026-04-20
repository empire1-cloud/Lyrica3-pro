import React, { useEffect, useRef, useState } from "react";
import { getTracks, getLedger, flipTrack, getWallet } from "../lib/api";
import { WS_URL } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Radio, Repeat2, Music2, Fingerprint, TrendingUp, X } from "lucide-react";

const GENRES = [
  "LA SGV Chicano Heritage", "Raw Spanish Corridos", "Art Laboe Oldies",
  "Late-Pocket Street Bounce", "Late Night Cruising Melancholy", "Street-Soft Resilience",
  "UK Garage", "Afrobeats", "Drill", "Jersey Club", "Bossa Nova",
];

function TrackCard({ t, onFlip }) {
  return (
    <div className="panel rounded-[6px] p-5 relative overflow-hidden group" data-testid={`track-card-${t.dna_tag}`}>
      {/* ambient glow */}
      <div className="absolute -top-20 -right-20 w-[200px] h-[200px] rounded-full bg-[#f5a524]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[200px] h-[200px] rounded-full bg-[#ff5eac]/8 blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between relative">
        <div>
          <div className="etched text-[#8a8278]">{t.cultural_matrix}</div>
          <h3 className="font-display text-[26px] text-[#f3ece1] mt-1 tracking-tight leading-tight">{t.title}</h3>
          <div className="text-[12px] font-mono text-[#8a8278] mt-2">
            by <span className="text-[#ffd88a]">{t.creator}</span>
            {t.parent_dna && <> · <span className="text-[#59d3ff]">flipped from {t.parent_dna.slice(0,16)}…</span></>}
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-[#ffd88a] font-mono text-[11px]">
            <TrendingUp size={11}/>
            {t.streams.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-[#6b6257] mt-1">streams</div>
        </div>
      </div>

      {/* DNA strip */}
      <div className="flex items-center gap-2 mt-4 bg-[#0d0d10] border border-[#1c1c22] rounded-[3px] px-3 py-2 relative">
        <Fingerprint size={12} className="text-[#f5a524]"/>
        <span className="etched text-[#8a8278]">DNA</span>
        <span className="font-mono text-[11px] text-[#ffd88a]">{t.dna_tag}</span>
        <span className="ml-auto text-[9px] font-mono text-[#6b6257] uppercase tracking-[0.16em]">SynthID · Empire 1</span>
      </div>

      {/* Splits */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          ["Beat Maker", 0.5, "#f5a524"],
          ["Vocalist",  0.3, "#ff5eac"],
          ["Lyricist",  0.2, "#59d3ff"],
        ].map(([name, pct, c]) => (
          <div key={name} className="bg-[#0d0d10] border border-[#1c1c22] rounded-[3px] p-2.5">
            <div className="etched text-[#6b6257] text-[9px]">{name}</div>
            <div className="font-mono text-[14px] mt-1" style={{ color: c }}>{(pct*100).toFixed(0)}%</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 relative">
        <div className="text-[10px] font-mono text-[#6b6257] uppercase tracking-[0.2em]">
          <Repeat2 size={12} className="inline mr-1 text-[#ff5eac]"/>{t.flips} flips
          <span className="mx-2">·</span>
          earned <span className="text-[#ffd88a]">${t.earnings_usd.toFixed(2)}</span>
        </div>
        <button
          onClick={() => onFlip(t)}
          data-testid={`flip-btn-${t.dna_tag}`}
          className="relative px-5 py-2.5 rounded-[3px] border border-[#ff8a3d]/60 bg-gradient-to-b from-[#f5a524]/25 to-[#ff5eac]/15
                     text-[#ffd88a] uppercase text-[11px] tracking-[0.22em] font-medium
                     animate-amber hover:scale-[1.02] transition-all">
          <Repeat2 size={13} className="inline mr-2 -translate-y-[1px]"/>
          Flip It · Remix Stems
        </button>
      </div>
    </div>
  );
}

function FlipModal({ track, onClose, onDone }) {
  const [title, setTitle] = useState(`${track.title} (Flipped)`);
  const [genre, setGenre] = useState(GENRES[6]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    setLoading(true); setErr("");
    try {
      const child = await flipTrack(track.dna_tag, { new_title: title, new_genre: genre });
      onDone(child);
    } catch (e) { setErr(e?.response?.data?.detail || "Flip failed."); }
    finally { setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6" data-testid="flip-modal">
      <div className="panel rounded-[6px] p-8 w-full max-w-lg relative animate-amber">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#6b6257] hover:text-[#ff5eac]"><X size={18}/></button>
        <div className="etched text-[#ff5eac] mb-1">Flip Protocol</div>
        <h3 className="font-display text-[24px] text-[#f3ece1] tracking-tight">Remix "{track.title}"</h3>
        <p className="text-[12px] font-mono text-[#8a8278] mt-2">
          Original DNA <span className="text-[#ffd88a]">{track.dna_tag}</span> will route residual royalties on every stream.
        </p>

        <div className="space-y-4 mt-6">
          <div>
            <div className="etched text-[#c9bfae] mb-2">New Title</div>
            <input value={title} onChange={e=>setTitle(e.target.value)}
              data-testid="flip-title-input"
              className="w-full bg-[#0d0d10] border border-[#22222a] focus:border-[#f5a524] rounded-[3px] px-3 py-2.5 text-[#f3ece1] font-mono text-[13px] outline-none"/>
          </div>
          <div>
            <div className="etched text-[#c9bfae] mb-2">Mutate Into</div>
            <select value={genre} onChange={e=>setGenre(e.target.value)}
              data-testid="flip-genre-select"
              className="w-full bg-[#0d0d10] border border-[#22222a] focus:border-[#f5a524] rounded-[3px] px-3 py-2.5 text-[#f3ece1] font-mono text-[13px] outline-none">
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {err && <div className="mt-4 text-[12px] text-[#ff5eac] font-mono">{err}</div>}

        <button onClick={submit} disabled={loading}
          data-testid="flip-submit-btn"
          className="w-full mt-6 py-3 rounded-[3px] border border-[#ff8a3d]/70 bg-gradient-to-b from-[#f5a524] to-[#b97316] text-[#1a0e00]
                     uppercase text-[12px] tracking-[0.24em] font-bold hover:brightness-110 disabled:opacity-50">
          {loading ? "Minting Flip DNA…" : "Commit Flip · Mint Child DNA"}
        </button>
      </div>
    </div>
  );
}

function RoyaltyTicker({ events }) {
  return (
    <div className="panel rounded-[6px] p-5 h-full overflow-hidden" data-testid="royalty-ticker">
      <div className="flex items-center gap-2 mb-4">
        <Radio size={14} className="text-[#59d3ff] animate-pulse"/>
        <span className="etched text-[#59d3ff]">Live Micro-Royalty Stream</span>
      </div>
      <div className="text-[10px] font-mono text-[#6b6257] uppercase tracking-[0.18em] mb-3">
        $0.004 / stream · split across 3 roles
      </div>
      <div className="space-y-2 max-h-[440px] overflow-hidden">
        {events.length === 0 && <div className="text-[#6b6257] font-mono text-[12px]">Awaiting ledger sync…</div>}
        {events.slice(0, 14).map((e, i) => (
          <div key={e.ts + i}
               className="bg-[#0d0d10] border border-[#1c1c22] rounded-[3px] p-3 flex items-center justify-between"
               style={{ animation: i === 0 ? "royalty-drop 0.8s ease" : undefined }}>
            <div className="min-w-0">
              <div className="text-[11px] text-[#f3ece1] truncate font-mono">{e.title}</div>
              <div className="text-[9px] font-mono text-[#6b6257] uppercase tracking-[0.16em] mt-0.5">
                {e.dna_tag?.slice(0,18)}…
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <div className="font-mono text-[13px] text-[#ffd88a] tabular-nums">+${e.amount_usd.toFixed(4)}</div>
              <div className="text-[9px] font-mono text-[#6b6257] mt-0.5">
                BM ${e.splits_usd.beat_maker.toFixed(4)} · V ${e.splits_usd.vocalist.toFixed(4)} · L ${e.splits_usd.lyricist.toFixed(4)}
              </div>
              {e.parent_residual_usd > 0 && (
                <div className="text-[9px] font-mono text-[#ff5eac] mt-0.5">
                  ↺ parent +${e.parent_residual_usd.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FlipFeed() {
  const { user, token } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [flipOpen, setFlipOpen] = useState(null);
  const [events, setEvents] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [liveBal, setLiveBal] = useState(0);
  const wsRef = useRef(null);

  const refresh = () => {
    getTracks().then(setTracks);
    getWallet().then(w => { setWallet(w); setLiveBal(w?.balance_usd ?? 0); }).catch(()=>{});
  };

  useEffect(() => {
    refresh();
    if (!token) return;
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      setEvents(prev => [d, ...prev].slice(0, 40));
      if (d.wallet_delta_usd) setLiveBal(b => +(b + d.wallet_delta_usd).toFixed(4));
    };
    ws.onerror = () => {};
    return () => { try { ws.close(); } catch {} };
  }, [token]);

  return (
    <div className="min-h-screen p-8 lg:p-12">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="etched text-[#8a8278]">// FEED</div>
          <h2 className="font-display text-[40px] text-[#f3ece1] tracking-tight leading-[1.05] mt-1">
            Flip-It Economy <span className="text-[#ff5eac]">·</span> Empire 1 Ledger
          </h2>
          <p className="font-serif italic text-[#8a8278] mt-2 text-[14px]">
            Every flip mints a child DNA · parents earn forever
          </p>
        </div>
        <div className="panel rounded-[6px] px-5 py-3" data-testid="live-wallet">
          <div className="etched text-[#c9bfae] mb-1">Sovereign Wallet</div>
          <div className="font-display text-[26px] text-[#ffd88a] tabular-nums">${liveBal.toFixed(4)}</div>
          <div className="text-[9px] font-mono text-[#6b6257] uppercase tracking-[0.18em] mt-1">
            {wallet?.lifetime_streams?.toLocaleString() ?? 0} streams · {wallet?.active_tracks ?? 0} tracks
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-5" data-testid="track-feed">
          {tracks.length === 0 && <div className="text-[#8a8278] font-mono">Loading Empire 1 feed…</div>}
          {tracks.map(t => <TrackCard key={t.dna_tag} t={t} onFlip={setFlipOpen}/>)}
        </div>
        <div className="col-span-12 lg:col-span-4">
          <RoyaltyTicker events={events}/>
        </div>
      </div>

      {flipOpen && <FlipModal track={flipOpen} onClose={() => setFlipOpen(null)}
                              onDone={(child) => { setFlipOpen(null); refresh(); }}/>}
    </div>
  );
}
