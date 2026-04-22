import React, { useCallback, useEffect, useRef, useState } from "react";
import { getTracks, getLedger, flipTrack, getWallet, WS_URL } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Radio, Repeat2, Fingerprint, TrendingUp, X, Share2 } from "lucide-react";
import Odometer from "../components/Odometer";
import MintingModal from "../components/MintingModal";
import ProviderBadge from "../components/ProviderBadge";
import BloodlineShareCard from "../components/BloodlineShareCard";

const GENRES = [
  "SGV Oldies", "Corridos", "Oldies", "Street Bounce", "Cruising", "Resilience",
  "UK Garage", "Afrobeats", "Drill", "Jersey Club", "Bossa Nova",
];

function TrackCard({ t, onFlip, onShare }) {
  return (
    <div className="panel rounded-[6px] p-4 md:p-5 relative overflow-hidden group" data-testid={`track-card-${t.dna_tag}`}>
      <div className="absolute -top-20 -right-20 w-[180px] md:w-[200px] h-[180px] md:h-[200px] rounded-full bg-[#f5a524]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[180px] md:w-[200px] h-[180px] md:h-[200px] rounded-full bg-[#ff5eac]/8 blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between relative gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="etched text-[#8a8278]">{t.cultural_matrix}</div>
          <h3 className="font-display text-[20px] md:text-[26px] text-[#f3ece1] mt-1 tracking-tight leading-tight">{t.title}</h3>
          <div className="text-[11px] md:text-[12px] font-mono text-[#8a8278] mt-1 md:mt-2">
            by <span className="text-[#ffd88a]">{t.creator}</span>
            {t.parent_dna && <> · <span className="text-[#59d3ff]">flipped from {t.parent_dna.slice(0, 16)}…</span></>}
          </div>
          <div className="mt-2">
            <ProviderBadge synth={t.synth_provider || "blackbox"} voice={t.voice_provider || "blackbox"} size="sm" />
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

      <div className="flex items-center gap-2 mt-3 md:mt-4 bg-[#0d0d10] border border-[#1c1c22] rounded-[3px] px-3 py-2 relative">
        <Fingerprint size={12} className="text-[#f5a524] shrink-0"/>
        <span className="etched text-[#8a8278]">DNA</span>
        <span className="font-mono text-[11px] text-[#ffd88a] truncate">{t.dna_tag}</span>
        <span className="ml-auto hidden md:inline text-[9px] font-mono text-[#6b6257] uppercase tracking-[0.16em]">SynthID · Empire 1</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          ["Beat Maker", 0.5, "#f5a524"],
          ["Vocalist",   0.3, "#ff5eac"],
          ["Lyricist",   0.2, "#59d3ff"],
        ].map(([name, pct, c]) => (
          <div key={name} className="bg-[#0d0d10] border border-[#1c1c22] rounded-[3px] p-2 md:p-2.5">
            <div className="etched text-[#6b6257] text-[9px]">{name}</div>
            <div className="font-mono text-[13px] md:text-[14px] mt-1" style={{ color: c }}>{(pct*100).toFixed(0)}%</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 md:mt-4 relative gap-2 flex-wrap">
        <div className="text-[10px] font-mono text-[#6b6257] uppercase tracking-[0.18em]">
          <Repeat2 size={12} className="inline mr-1 text-[#ff5eac]"/>{t.flips} flips
          <span className="mx-2">·</span>
          earned <span className="text-[#ffd88a]">${t.earnings_usd.toFixed(2)}</span>
        </div>
        <button
          onClick={() => onShare(t)}
          data-testid={`share-card-btn-${t.dna_tag}`}
          className="px-3 md:px-4 py-2 md:py-2.5 rounded-[3px] border border-[#59d3ff]/50 bg-[#59d3ff]/10
                     text-[#59d3ff] uppercase text-[10px] md:text-[11px] tracking-[0.2em] font-medium
                     hover:bg-[#59d3ff]/20 transition-all">
          <Share2 size={12} className="inline mr-1.5 -translate-y-[1px]"/>
          Share Card
        </button>
        <button
          onClick={() => onFlip(t)}
          data-testid={`flip-btn-${t.dna_tag}`}
          className="relative px-4 md:px-5 py-2 md:py-2.5 rounded-[3px] border border-[#ff8a3d]/60 bg-gradient-to-b from-[#f5a524]/25 to-[#ff5eac]/15
                     text-[#ffd88a] uppercase text-[10px] md:text-[11px] tracking-[0.2em] font-medium
                     animate-amber hover:scale-[1.02] transition-all">
          <Repeat2 size={13} className="inline mr-2 -translate-y-[1px]"/>
          Flip It · Remix Stems
        </button>
      </div>
    </div>
  );
}

function FlipForm({ track, onClose, onSubmit }) {
  const [title, setTitle] = useState(`${track.title} (Flipped)`);
  const [genre, setGenre] = useState("Resilience");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true); setErr("");
    try { await onSubmit(title, genre); }
    catch (ex) { setErr(ex?.response?.data?.detail || "Flip failed."); setLoading(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" data-testid="flip-modal">
      <form onSubmit={submit} className="panel rounded-[6px] p-6 md:p-8 w-full max-w-lg relative animate-amber">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-[#6b6257] hover:text-[#ff5eac]"><X size={18}/></button>
        <div className="etched text-[#ff5eac] mb-1">Flip Protocol</div>
        <h3 className="font-display text-[22px] md:text-[24px] text-[#f3ece1] tracking-tight">Remix "{track.title}"</h3>
        <p className="text-[11px] md:text-[12px] font-mono text-[#8a8278] mt-2">
          Original DNA <span className="text-[#ffd88a] break-all">{track.dna_tag}</span> routes residual royalties on every stream.
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

        <button type="submit" disabled={loading}
          data-testid="flip-submit-btn"
          className="w-full mt-6 py-3 rounded-[3px] border border-[#ff8a3d]/70 bg-gradient-to-b from-[#f5a524] to-[#b97316] text-[#1a0e00]
                     uppercase text-[12px] tracking-[0.24em] font-bold hover:brightness-110 disabled:opacity-50">
          {loading ? "Locking parent DNA…" : "Commit Flip · Mint Child DNA"}
        </button>
      </form>
    </div>
  );
}

function RoyaltyTicker({ events }) {
  return (
    <div className="panel rounded-[6px] p-4 md:p-5 h-full overflow-hidden" data-testid="royalty-ticker">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <Radio size={14} className="text-[#59d3ff] animate-pulse"/>
        <span className="etched text-[#59d3ff]">Live Micro-Royalty Stream</span>
      </div>
      <div className="text-[10px] font-mono text-[#6b6257] uppercase tracking-[0.18em] mb-3">
        $0.004 / stream · split across 3 roles
      </div>
      <div className="space-y-2 max-h-[380px] md:max-h-[440px] overflow-hidden">
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
  const { user } = useAuth();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tracks, setTracks] = useState([]);
  const [flipOpen, setFlipOpen] = useState(null);
  const [shareOpen, setShareOpen] = useState(null);
  const [events, setEvents] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [liveBal, setLiveBal] = useState(0);
  const [minting, setMinting] = useState(null);
  const wsRef = useRef(null);

  const refresh = useCallback(() => {
    getTracks().then((ts) => {
      setTracks(ts);
      // Discord deep-link: /feed?flip=<dna> auto-opens the flip modal
      const flipDna = searchParams.get("flip");
      if (flipDna) {
        const match = ts.find((t) => t.dna_tag === flipDna);
        if (match) setFlipOpen(match);
        // clear the param so it doesn't reopen on refresh
        const next = new URLSearchParams(searchParams);
        next.delete("flip");
        setSearchParams(next, { replace: true });
      }
    });
    getWallet()
      .then((w) => { setWallet(w); setLiveBal(w?.balance_usd ?? 0); })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("wallet refresh failed", err);
        }
      });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      setEvents((prev) => [d, ...prev].slice(0, 40));
      if (d.wallet_delta_usd) setLiveBal((b) => +(b + d.wallet_delta_usd).toFixed(4));
    };
    ws.onerror = (err) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("ws error", err);
      }
    };
    return () => {
      try {
        ws.close();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.warn("ws close failed", err);
        }
      }
    };
  }, [refresh, user]);

  const submitFlip = async (newTitle, newGenre) => {
    const parent = flipOpen;
    setFlipOpen(null);
    setMinting({ parent, newTitle, newGenre, child: null });
    const child = await flipTrack(parent.dna_tag, { new_title: newTitle, new_genre: newGenre });
    setMinting((m) => (m ? { ...m, child } : null));
  };

  const onMintComplete = (child) => {
    setMinting(null);
    refresh();
    nav("/deck");
  };

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3 flex-wrap">
        <div>
          <div className="etched text-[#8a8278]">// FEED</div>
          <h2 className="font-display text-[26px] md:text-[40px] text-[#f3ece1] tracking-tight leading-[1.05] mt-1">
            Flip-It Economy <span className="text-[#ff5eac]">·</span> Empire 1 Ledger
          </h2>
          <p className="font-serif italic text-[#8a8278] mt-1 md:mt-2 text-[12px] md:text-[14px]">
            Every flip mints a child DNA · parents earn forever
          </p>
        </div>
        <div className="panel rounded-[6px] px-4 md:px-5 py-3" data-testid="live-wallet">
          <div className="etched text-[#c9bfae] mb-1">Sovereign Wallet</div>
          <div className="font-display text-[22px] md:text-[26px] text-[#ffd88a] tabular-nums">
            <Odometer value={liveBal} decimals={4} prefix="$"/>
          </div>
          <div className="text-[9px] font-mono text-[#6b6257] uppercase tracking-[0.18em] mt-1">
            {wallet?.lifetime_streams?.toLocaleString() ?? 0} streams · {wallet?.active_tracks ?? 0} tracks
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-4 md:space-y-5" data-testid="track-feed">
          {tracks.length === 0 && <div className="text-[#8a8278] font-mono">Loading Empire 1 feed…</div>}
          {tracks.map((t) => <TrackCard key={t.dna_tag} t={t} onFlip={setFlipOpen} onShare={setShareOpen}/>)}
        </div>
        <div className="col-span-12 lg:col-span-4">
          <RoyaltyTicker events={events}/>
        </div>
      </div>

      {flipOpen && (
        <FlipForm
          track={flipOpen}
          onClose={() => setFlipOpen(null)}
          onSubmit={submitFlip}
        />
      )}

      {shareOpen && (
        <BloodlineShareCard
          track={shareOpen}
          onClose={() => setShareOpen(null)}
        />
      )}

      {minting && (
        <MintingModal
          parentTrack={minting.parent}
          newTitle={minting.newTitle}
          newGenre={minting.newGenre}
          child={minting.child}
          onComplete={onMintComplete}
        />
      )}
    </div>
  );
}
