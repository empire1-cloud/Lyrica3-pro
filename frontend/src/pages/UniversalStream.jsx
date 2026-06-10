import React, { useEffect, useRef, useState } from "react";
import { getBloodlines, getLedger, WS_URL } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Globe, Radio, TrendingUp, Fingerprint, Zap, Repeat2, Crown, Play, Pause, SkipForward, SkipBack, Volume2, Heart, Share2, Activity, ListMusic } from "lucide-react";

const COLOR_RING = ["#F5C542", "#FF2EBE", "#00E6FF", "#00E6FF", "#F5C542"];

function BloodlineRow({ bl, rank, accent, isPlaying, onPlay }) {
  return (
    <div className={`group flex flex-col p-3 rounded-xl hover:bg-[#1A1C2E]/60 transition-all cursor-pointer border border-transparent ${isPlaying ? 'bg-[#1A1C2E]/80 border-[#00E6FF]/20 shadow-[0_0_20px_rgba(0,230,255,0.05)]' : 'border-b-[#1A1C2E]/50'}`} onClick={onPlay}>
      <div className="flex items-center gap-4">
        <div className="w-8 text-center text-[#9CA3B0] font-mono text-[11px]">
          {isPlaying ? <Activity className="w-4 h-4 mx-auto text-[#00E6FF] animate-pulse" /> : String(rank).padStart(2, '0')}
        </div>
        <div className="w-12 h-12 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
          <div className="absolute inset-0 opacity-20" style={{ background: accent }} />
          <Fingerprint size={24} style={{ color: accent }} />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-display text-[16px] truncate ${isPlaying ? 'text-[#00E6FF]' : 'text-[#F5F7FA] group-hover:text-white'}`}>
            {bl.root_title} {rank === 1 && <Crown size={14} className="inline ml-1 text-[#F5C542] -translate-y-0.5" />}
          </div>
          <div className="font-mono text-[11px] text-[#9CA3B0] truncate mt-1">
            <span className="text-[#F5F7FA]">{bl.root_creator}</span> <span className="mx-1 text-[#1A1C2E]">•</span> {bl.total_streams.toLocaleString()} streams <span className="mx-1 text-[#1A1C2E]">•</span> {bl.total_flips} flips
          </div>
        </div>
        <div className="hidden sm:block w-32 text-right">
          <div className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider mb-1">Total Earned</div>
          <div className="font-mono text-[14px] tabular-nums font-bold" style={{ color: accent }}>${bl.total_earnings_usd.toFixed(2)}</div>
        </div>
        <div className="w-12 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity items-center gap-3">
          <Heart className="w-4 h-4 text-[#9CA3B0] hover:text-[#FF2EBE]" />
        </div>
      </div>

      {/* Lineage Chain - Only visible when playing */}
      {isPlaying && (
        <div className="mt-4 pl-16 pr-4 pb-2 relative animate-accordion-down">
          <div className="text-[10px] font-mono text-[#00E6FF] uppercase tracking-[0.16em] mb-3 flex items-center gap-2">
            <Radio className="w-3 h-3" /> Live Lineage Chain ({bl.depth} Nodes)
          </div>
          <div className="flex items-center gap-0 overflow-x-auto pb-2 scrollbar-hide">
            {bl.chain.map((c, i) => {
              const isRoot = c.is_root;
              const nodeColor = isRoot ? accent : "#00E6FF";
              return (
                <React.Fragment key={c.dna_tag}>
                  {i > 0 && (
                    <div className="flex-1 min-w-[24px] h-[1px] mx-2 relative" style={{ background: `linear-gradient(90deg, ${isRoot ? accent : "#00E6FF"}44, ${accent}44)` }}>
                      <Repeat2 size={10} className="absolute left-1/2 -translate-x-1/2 -top-[4px] text-[#FF2EBE] bg-[#05060D]" />
                    </div>
                  )}
                  <div className="shrink-0 w-[140px] bg-[#0A0B14] border rounded-lg px-3 py-2.5 transition-all hover:bg-[#0E0F17]"
                       style={{ borderColor: `${nodeColor}33`, boxShadow: `inset 0 0 10px ${nodeColor}11` }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Fingerprint size={10} style={{ color: nodeColor }}/>
                      <span className="font-mono text-[#9CA3B0] text-[9px] truncate">
                        {isRoot ? "ROOT" : `FLIP ${i}`}
                      </span>
                    </div>
                    <div className="font-display text-[12px] text-[#F5F7FA] truncate leading-tight">
                      {c.title}
                    </div>
                    <div className="font-mono text-[9px] text-[#6B7280] truncate mt-0.5">{c.creator}</div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function NetworkGravityOrbit({ bloodlines }) {
  // Render bloodlines as an SVG orbit diagram — size ∝ earnings, color cycles
  const size = 320;
  const cx = size / 2, cy = size / 2;
  const maxEarn = Math.max(1, ...bloodlines.map((b) => b.total_earnings_usd));
  return (
    <div className="panel rounded-[6px] p-4 md:p-5" data-testid="network-gravity">
      <div className="flex items-center gap-2 mb-2">
        <Globe size={14} className="text-[#00E6FF]"/>
        <span className="etched text-[#00E6FF]">Network Gravity</span>
      </div>
      <div className="text-[10px] font-mono text-[#6B7280] uppercase tracking-[0.18em] mb-3">
        Cultural bloodline mass · last 24h
      </div>
      <div className="relative w-full aspect-square max-w-[320px] mx-auto">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
          {/* orbits */}
          {[0.32, 0.56, 0.82].map((r, i) => (
            <circle key={i} cx={cx} cy={cy} r={r * (size/2 - 8)}
                    fill="none" stroke="#0E0F17" strokeDasharray="2 4"/>
          ))}
          {/* center star */}
          <circle cx={cx} cy={cy} r="16" fill="#F5C542" opacity="0.25"/>
          <circle cx={cx} cy={cy} r="6"  fill="#F5C542"/>
          <text x={cx} y={cy + 28} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="8"
                fill="#9CA3B0" style={{ letterSpacing: "0.14em" }}>EMPIRE 1</text>
          {bloodlines.slice(0, 8).map((b, i) => {
            const angle = (i / Math.min(8, bloodlines.length)) * Math.PI * 2 - Math.PI / 2;
            const r = (0.42 + (1 - b.total_earnings_usd / maxEarn) * 0.38) * (size/2 - 10);
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            const rad = 6 + 14 * (b.total_earnings_usd / maxEarn);
            const c = COLOR_RING[i % COLOR_RING.length];
            return (
              <g key={b.root_dna}>
                <line x1={cx} y1={cy} x2={x} y2={y} stroke={c} strokeOpacity="0.25" strokeWidth="1"/>
                <circle cx={x} cy={y} r={rad} fill={c} fillOpacity="0.22"
                        stroke={c} strokeWidth="1.5" style={{ filter: `drop-shadow(0 0 6px ${c})` }}/>
                <text x={x} y={y + rad + 10} textAnchor="middle" fontFamily="Unbounded" fontSize="8"
                      fill="#F5F7FA">
                  {(b.root_title || "").slice(0, 16)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default function UniversalStream() {
  const { token } = useAuth();
  const [bloodlines, setBloodlines] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [live, setLive] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const wsRef = useRef(null);

  const refresh = () => {
    getBloodlines().then((d) => setBloodlines(d.bloodlines || [])).catch(() => {});
    getLedger(12).then(setLedger).catch(() => {});
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (m) => {
      const d = JSON.parse(m.data);
      setLive((prev) => [d, ...prev].slice(0, 20));
    };
    ws.onerror = () => {};
    return () => { try { ws.close(); } catch {} };
  }, [token]);

  const playingTrack = bloodlines.find(b => b.root_dna === playingId) || bloodlines[0];

  const handlePlay = (id) => {
    if (playingId === id) {
      setIsPlaying(!isPlaying);
    } else {
      setPlayingId(id);
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060D] text-[#F5F7FA] pb-28">
      {/* Hero Section */}
      <div className="h-[40vh] min-h-[300px] relative overflow-hidden flex items-end p-8 md:p-12 border-b border-[#1A1C2E]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#05060D] via-[#05060D]/60 to-transparent z-10" />
        {playingTrack && (
          <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen filter blur-xl transition-all duration-1000"
               style={{ background: `linear-gradient(45deg, ${COLOR_RING[bloodlines.indexOf(playingTrack) % COLOR_RING.length]}, transparent)` }} />
        )}
        
        <div className="relative z-20 flex gap-6 md:gap-8 items-end w-full">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-xl bg-[#0E0F17] border-2 border-[#1A1C2E] shadow-2xl flex items-center justify-center shrink-0 overflow-hidden relative group">
            {playingTrack ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/20 z-10" />
                <Fingerprint size={80} className="text-[#00E6FF] opacity-30 absolute group-hover:scale-110 transition-transform duration-500" />
                <div className="relative z-20 w-16 h-16 rounded-full bg-[#00E6FF]/20 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-[#00E6FF]/40 transition-colors" onClick={() => handlePlay(playingTrack.root_dna)}>
                  {isPlaying ? <Pause className="w-8 h-8 text-[#00E6FF]" /> : <Play className="w-8 h-8 text-[#00E6FF] ml-1" />}
                </div>
              </>
            ) : (
              <Radio className="w-12 h-12 text-[#1A1C2E]" />
            )}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 mb-2 md:mb-4">
              <span className="px-2 py-1 rounded bg-[#FF2EBE]/10 text-[#FF2EBE] font-mono text-[10px] uppercase tracking-widest border border-[#FF2EBE]/20">
                SL Universal Radio
              </span>
              <span className="text-[#9CA3B0] font-mono text-[11px] flex items-center gap-1">
                <Globe className="w-3 h-3" /> Live Matrix
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tighter mb-2">
              {playingTrack ? playingTrack.root_title : "Select a Track"}
            </h1>
            <p className="font-mono text-[#9CA3B0] text-sm md:text-base">
              {playingTrack ? `By ${playingTrack.root_creator} • ${playingTrack.total_streams.toLocaleString()} Streams` : "Tuning in to the Empire 1 Ledger..."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 lg:p-12 grid grid-cols-12 gap-8 max-w-[1800px] mx-auto">
        {/* Playlist Container */}
        <div className="col-span-12 lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl flex items-center gap-3">
              <ListMusic className="w-6 h-6 text-[#00E6FF]" />
              Global Bloodline Chart
            </h2>
            <div className="font-mono text-[11px] text-[#6B7280] uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00E6FF] animate-pulse"></span>
              Live Ledger Sync
            </div>
          </div>
          
          <div className="space-y-1" data-testid="bloodline-list">
            {bloodlines.length === 0 && (
              <div className="py-12 text-center text-[#6B7280] font-mono text-sm border border-dashed border-[#1A1C2E] rounded-xl">
                Awaiting streams...
              </div>
            )}
            {bloodlines.map((bl, i) => (
              <BloodlineRow 
                key={bl.root_dna} 
                bl={bl} 
                rank={i + 1} 
                accent={COLOR_RING[i % COLOR_RING.length]}
                isPlaying={playingId === bl.root_dna}
                onPlay={() => handlePlay(bl.root_dna)}
              />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <NetworkGravityOrbit bloodlines={bloodlines}/>

          <div className="bg-[#0E0F17]/50 rounded-xl p-5 border border-[#1A1C2E] backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={16} className="text-[#F5C542]"/>
              <span className="font-mono text-xs uppercase tracking-widest text-[#F5C542]">Live Ledger Events</span>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-hidden">
              {ledger.length === 0 && <div className="text-[#6B7280] font-mono text-[11px]">Ledger idle…</div>}
              {ledger.slice(0, 8).map((e) => (
                <div key={e.id} className="flex items-center gap-3 group">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.kind === "mint" ? "#F5C542" : e.kind === "flip" ? "#FF2EBE" : "#00E6FF" }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] text-[#C8CCD8] truncate group-hover:text-white transition-colors">
                      <span className="uppercase tracking-wider" style={{ color: e.kind === "mint" ? "#F5C542" : e.kind === "flip" ? "#FF2EBE" : "#00E6FF" }}>{e.kind}</span>
                      <span className="mx-2">•</span>
                      {e.dna_tag?.slice(0,12)}…
                    </div>
                  </div>
                  <div className="text-[9px] font-mono text-[#6B7280] shrink-0">{e.actor?.slice(0,10)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#0A0B14]/95 backdrop-blur-xl border-t border-[#1A1C2E] z-50 px-4 md:px-8 flex items-center justify-between">
        <div className="w-1/3 flex items-center gap-4">
          {playingTrack ? (
            <>
              <div className="w-14 h-14 rounded-md bg-[#0E0F17] flex items-center justify-center border border-[#1A1C2E] relative overflow-hidden">
                <div className="absolute inset-0 opacity-30" style={{ background: COLOR_RING[bloodlines.indexOf(playingTrack) % COLOR_RING.length] }} />
                <Fingerprint className="w-6 h-6 text-white relative z-10" />
              </div>
              <div className="min-w-0 hidden sm:block">
                <div className="font-display text-sm text-white truncate hover:underline cursor-pointer">{playingTrack.root_title}</div>
                <div className="font-mono text-[10px] text-[#9CA3B0] truncate hover:underline cursor-pointer">{playingTrack.root_creator}</div>
              </div>
              <Heart className="w-4 h-4 text-[#9CA3B0] hover:text-[#FF2EBE] ml-2 cursor-pointer transition-colors" />
            </>
          ) : (
            <div className="font-mono text-xs text-[#6B7280]">No track selected</div>
          )}
        </div>

        <div className="flex-1 max-w-2xl flex flex-col items-center justify-center">
          <div className="flex items-center gap-6 mb-2">
            <SkipBack className="w-5 h-5 text-[#9CA3B0] hover:text-white cursor-pointer transition-colors" />
            <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform" onClick={() => setIsPlaying(!isPlaying)}>
              {isPlaying ? <Pause className="w-5 h-5 text-black" /> : <Play className="w-5 h-5 text-black ml-1" />}
            </button>
            <SkipForward className="w-5 h-5 text-[#9CA3B0] hover:text-white cursor-pointer transition-colors" />
          </div>
          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] font-mono text-[#9CA3B0] w-8 text-right">0:00</span>
            <div className="flex-1 h-1 bg-[#1A1C2E] rounded-full overflow-hidden group cursor-pointer relative">
              <div className="absolute top-0 left-0 bottom-0 bg-[#00E6FF] w-1/3 group-hover:bg-[#FF2EBE] transition-colors" />
            </div>
            <span className="text-[10px] font-mono text-[#9CA3B0] w-8">3:14</span>
          </div>
        </div>

        <div className="w-1/3 flex justify-end items-center gap-4 hidden md:flex">
          <Radio className="w-4 h-4 text-[#00E6FF]" />
          <div className="flex items-center gap-2 w-24">
            <Volume2 className="w-4 h-4 text-[#9CA3B0]" />
            <div className="flex-1 h-1 bg-[#1A1C2E] rounded-full overflow-hidden cursor-pointer">
              <div className="h-full bg-white w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
