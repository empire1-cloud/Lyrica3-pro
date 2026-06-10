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
      <div className="absolute -top-20 -right-20 w-[180px] md:w-[200px] h-[180px] md:h-[200px] rounded-full bg-[#F5C542]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[180px] md:w-[200px] h-[180px] md:h-[200px] rounded-full bg-[#FF2EBE]/8 blur-3xl pointer-events-none" />

      <div className="flex items-start justify-between relative gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="etched text-[#9CA3B0]">{t.cultural_matrix}</div>
          <h3 className="font-display text-[20px] md:text-[26px] text-[#F5F7FA] mt-1 tracking-tight leading-tight">{t.title}</h3>
          <div className="text-[11px] md:text-[12px] font-mono text-[#9CA3B0] mt-1 md:mt-2">
            by <span className="text-[#F5C542]">{t.creator}</span>
            {t.parent_dna && <> · <span className="text-[#00E6FF]">flipped from {t.parent_dna.slice(0, 16)}…</span></>}
          </div>
          <div className="mt-2">
            <ProviderBadge synth={t.synth_provider || "blackbox"} voice={t.voice_provider || "blackbox"} size="sm" />
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end text-[#F5C542] font-mono text-[11px]">
            <TrendingUp size={11}/>
            {t.streams.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-[#6B7280] mt-1">streams</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3 md:mt-4 bg-[#0E0F17] border border-[#0E0F17] rounded-[3px] px-3 py-2 relative">
        <Fingerprint size={12} className="text-[#F5C542] shrink-0"/>
        <span className="etched text-[#9CA3B0]">DNA</span>
        <span className="font-mono text-[11px] text-[#F5C542] truncate">{t.dna_tag}</span>
        <span className="ml-auto hidden md:inline text-[9px] font-mono text-[#6B7280] uppercase tracking-[0.16em]">SynthID · Empire 1</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          ["Beat Maker", 0.5, "#F5C542"],
          ["Vocalist",   0.3, "#FF2EBE"],
          ["Lyricist",   0.2, "#00E6FF"],
        ].map(([name, pct, c]) => (
          <div key={name} className="bg-[#0E0F17] border border-[#0E0F17] rounded-[3px] p-2 md:p-2.5">
            <div className="etched text-[#6B7280] text-[9px]">{name}</div>
            <div className="font-mono text-[13px] md:text-[14px] mt-1" style={{ color: c }}>{(pct*100).toFixed(0)}%</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 md:mt-4 relative gap-2 flex-wrap">
        <div className="text-[10px] font-mono text-[#6B7280] uppercase tracking-[0.18em]">
          <Repeat2 size={12} className="inline mr-1 text-[#FF2EBE]"/>{t.flips} flips
          <span className="mx-2">·</span>
          earned <span className="text-[#F5C542]">${t.earnings_usd.toFixed(2)}</span>
        </div>
        <button
          onClick={() => onShare(t)}
          data-testid={`share-card-btn-${t.dna_tag}`}
          className="px-3 md:px-4 py-2 md:py-2.5 rounded-[3px] border border-[#00E6FF]/50 bg-[#00E6FF]/10
                     text-[#00E6FF] uppercase text-[10px] md:text-[11px] tracking-[0.2em] font-medium
                     hover:bg-[#00E6FF]/20 transition-all">
          <Share2 size={12} className="inline mr-1.5 -translate-y-[1px]"/>
          Share Card
        </button>
        <button
          onClick={() => onFlip(t)}
          data-testid={`flip-btn-${t.dna_tag}`}
          className="relative px-4 md:px-5 py-2 md:py-2.5 rounded-[3px] border border-[#FF2EBE]/60 bg-gradient-to-b from-[#F5C542]/25 to-[#FF2EBE]/15
                     text-[#F5C542] uppercase text-[10px] md:text-[11px] tracking-[0.2em] font-medium
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
  const [genre, setGenre] = useState("SGV Oldies");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [isFlipping, setIsFlipping] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true); setErr("");
    setIsFlipping(true);
    try { 
      // Add artificial delay for the animation effect before backend processing
      await new Promise(resolve => setTimeout(resolve, 2500));
      await onSubmit(title, genre); 
    }
    catch (ex) { 
      setErr(ex?.response?.data?.detail || "Flip failed."); 
      setLoading(false); 
      setIsFlipping(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#05060D]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all" onClick={onClose}>
      <div className="w-full max-w-xl" onClick={e => e.stopPropagation()}>
        <div className="bg-[#0E0F17] border border-[#1A1C2E] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(255,46,190,0.15)] relative">
          
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF2EBE]/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#00E6FF]/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 p-6 border-b border-[#1A1C2E] flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-display flex items-center gap-3 text-[#FF2EBE]">
                <Repeat2 className={`w-6 h-6 ${isFlipping ? "animate-spin text-[#00E6FF]" : ""}`} /> 
                Bloodline Flip
              </h2>
              <p className="text-[12px] font-mono text-[#9CA3B0] mt-1">Remixing <span className="text-[#F5F7FA] font-bold">"{track.title}"</span></p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#1A1C2E] rounded-full transition-colors text-[#6B7280] hover:text-[#F5F7FA]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={submit} className="relative z-10 p-6 space-y-6">
            {isFlipping ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-6">
                 <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-[#1A1C2E] rounded-full" />
                    <div className="absolute inset-0 border-4 border-[#FF2EBE] rounded-full border-t-transparent animate-spin" />
                    <div className="absolute inset-0 border-4 border-[#00E6FF] rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    <Fingerprint className="w-8 h-8 text-[#FF2EBE] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                 </div>
                 <div>
                   <h3 className="text-xl font-display text-[#F5F7FA] mb-2 animate-pulse">Injecting Cultura...</h3>
                   <p className="text-[11px] font-mono text-[#9CA3B0]">Verifying Voice DNA • Re-pitching Stems • Routing Royalties</p>
                 </div>
              </div>
            ) : (
              <>
                <p className="text-[11px] md:text-[12px] font-mono text-[#9CA3B0]">
                  Original DNA <span className="text-[#F5C542] break-all">{track.dna_tag}</span> routes residual royalties on every stream.
                </p>

                <div className="space-y-4 mt-6">
                  <div>
                    <div className="etched text-[#C8CCD8] mb-2">New Title</div>
                    <input value={title} onChange={e=>setTitle(e.target.value)}
                      data-testid="flip-title-input"
                      className="w-full bg-[#05060D] border border-[#1A1C2E] focus:border-[#00E6FF] rounded-lg px-4 py-3 text-[#F5F7FA] font-mono text-[13px] outline-none transition-all"/>
                  </div>

                  {/* Visual Style Presets (Mapped to Genres) */}
                  <div>
                    <h3 className="text-[11px] font-mono text-[#C8CCD8] uppercase tracking-wider mb-3 flex items-center gap-2 etched">
                      Select Mutation Style
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'SGV Oldies', desc: 'Chicano swing + Heavy 808s' },
                        { id: 'Corridos', desc: 'Acoustic brass + Regional' },
                        { id: 'Street Bounce', desc: 'Aggressive 808s + Synth' },
                        { id: 'Bossa Nova', desc: 'Smooth + Acoustic' }
                      ].map(style => (
                        <div
                          key={style.id}
                          onClick={() => setGenre(style.id)}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                            genre === style.id
                              ? "bg-[#FF2EBE]/10 border-[#FF2EBE] shadow-[0_0_15px_rgba(255,46,190,0.2)]"
                              : "bg-[#05060D] border-[#1A1C2E] hover:border-[#3a3a44]"
                          }`}
                        >
                          <div className={`font-display text-sm mb-1 ${genre === style.id ? "text-[#FF2EBE]" : "text-[#F5F7FA]"}`}>{style.id}</div>
                          <div className="text-[10px] font-mono text-[#6B7280] leading-relaxed">{style.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Select fallback for other genres */}
                  <div className="pt-2">
                    <div className="etched text-[#6B7280] mb-2 text-[9px]">Or select from all genres:</div>
                    <select value={genre} onChange={e=>setGenre(e.target.value)}
                      className="w-full bg-[#05060D] border border-[#1A1C2E] focus:border-[#F5C542] rounded-lg px-3 py-2 text-[#9CA3B0] font-mono text-[11px] outline-none">
                      {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                {err && <div className="mt-4 text-[12px] text-[#FF2EBE] font-mono">{err}</div>}
              </>
            )}

            {!isFlipping && (
              <div className="relative z-10 pt-4 mt-6 border-t border-[#1A1C2E] flex gap-3">
                <button type="button" className="flex-1 py-3 text-[12px] font-mono text-[#9CA3B0] hover:text-[#F5F7FA] transition-colors" onClick={onClose}>Cancel</button>
                <button type="submit" disabled={loading}
                  data-testid="flip-submit-btn"
                  className="flex-[2] py-3 rounded-lg border border-[#FF2EBE]/70 bg-gradient-to-r from-[#FF2EBE]/20 to-[#00E6FF]/20 text-[#F5F7FA]
                             uppercase text-[12px] tracking-[0.2em] font-bold hover:brightness-125 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  <Repeat2 className="w-4 h-4 text-[#FF2EBE]" /> Flip It
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function RoyaltyTicker({ events }) {
  return (
    <div className="panel rounded-[6px] p-4 md:p-5 h-full overflow-hidden" data-testid="royalty-ticker">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <Radio size={14} className="text-[#00E6FF] animate-pulse"/>
        <span className="etched text-[#00E6FF]">Live Micro-Royalty Stream</span>
      </div>
      <div className="text-[10px] font-mono text-[#6B7280] uppercase tracking-[0.18em] mb-3">
        $0.004 / stream · split across 3 roles
      </div>
      <div className="space-y-2 max-h-[380px] md:max-h-[440px] overflow-hidden">
        {events.length === 0 && <div className="text-[#6B7280] font-mono text-[12px]">Awaiting ledger sync…</div>}
        {events.slice(0, 14).map((e, i) => (
          <div key={e.ts + i}
               className="bg-[#0E0F17] border border-[#0E0F17] rounded-[3px] p-3 flex items-center justify-between"
               style={{ animation: i === 0 ? "royalty-drop 0.8s ease" : undefined }}>
            <div className="min-w-0">
              <div className="text-[11px] text-[#F5F7FA] truncate font-mono">{e.title}</div>
              <div className="text-[9px] font-mono text-[#6B7280] uppercase tracking-[0.16em] mt-0.5">
                {e.dna_tag?.slice(0,18)}…
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <div className="font-mono text-[13px] text-[#F5C542] tabular-nums">+${e.amount_usd.toFixed(4)}</div>
              <div className="text-[9px] font-mono text-[#6B7280] mt-0.5">
                BM ${e.splits_usd.beat_maker.toFixed(4)} · V ${e.splits_usd.vocalist.toFixed(4)} · L ${e.splits_usd.lyricist.toFixed(4)}
              </div>
              {e.parent_residual_usd > 0 && (
                <div className="text-[9px] font-mono text-[#FF2EBE] mt-0.5">
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
      const seen = new Set();
      setTracks(Array.isArray(ts) ? ts.filter(t => { if (seen.has(t.dna_tag)) return false; seen.add(t.dna_tag); return true; }) : ts);
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

  const connectWs = useCallback(() => {
    if (!user) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      setEvents((prev) => [d, ...prev].slice(0, 40));
      if (d.wallet_delta_usd) setLiveBal((b) => +(b + d.wallet_delta_usd).toFixed(4));
    };
    ws.onclose = () => {
      setTimeout(() => {
        if (user) connectWs();
      }, 3000);
    };
  }, [user]);

  useEffect(() => {
    refresh();
    connectWs();
    return () => {
      try {
        if (wsRef.current) wsRef.current.close();
      } catch {}
    };
  }, [refresh, connectWs]);

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
          <div className="etched text-[#9CA3B0]">// FEED</div>
          <h2 className="font-display text-[26px] md:text-[40px] text-[#F5F7FA] tracking-tight leading-[1.05] mt-1">
            Flip-It Economy <span className="text-[#FF2EBE]">·</span> Empire 1 Ledger
          </h2>
          <p className="font-serif italic text-[#9CA3B0] mt-1 md:mt-2 text-[12px] md:text-[14px]">
            Every flip mints a child DNA · parents earn forever
          </p>
        </div>
        <div className="panel rounded-[6px] px-4 md:px-5 py-3" data-testid="live-wallet">
          <div className="etched text-[#C8CCD8] mb-1">Sovereign Wallet</div>
          <div className="font-display text-[22px] md:text-[26px] text-[#F5C542] tabular-nums">
            <Odometer value={liveBal} decimals={4} prefix="$"/>
          </div>
          <div className="text-[9px] font-mono text-[#6B7280] uppercase tracking-[0.18em] mt-1">
            {wallet?.lifetime_streams?.toLocaleString() ?? 0} streams · {wallet?.active_tracks ?? 0} tracks
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-4 md:space-y-5" data-testid="track-feed">
          {tracks.length === 0 && <div className="text-[#9CA3B0] font-mono">Loading Empire 1 feed…</div>}
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
