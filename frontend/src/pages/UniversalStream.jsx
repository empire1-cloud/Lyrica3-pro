import React, { useEffect, useRef, useState } from "react";
import { getBloodlines, getLedger, WS_URL } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Globe, Radio, TrendingUp, Fingerprint, Zap, Repeat2, Crown } from "lucide-react";

const COLOR_RING = ["#F5C542", "#FF2EBE", "#00E6FF", "#00E6FF", "#F5C542"];

function BloodlineCard({ bl, rank, accent }) {
  return (
    <div className="panel rounded-[6px] p-4 md:p-5 relative overflow-hidden" data-testid={`bloodline-${bl.root_dna}`}>
      <div className="absolute -top-16 -right-16 w-[200px] h-[200px] rounded-full blur-3xl pointer-events-none"
           style={{ background: `${accent}22` }}/>
      <div className="flex items-start justify-between gap-3 flex-wrap relative">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-mono font-bold"
                 style={{ background: `${accent}33`, color: accent, border: `1px solid ${accent}66` }}>
              {rank}
            </div>
            <div className="etched text-[#9CA3B0]">{bl.root_matrix}</div>
          </div>
          <h3 className="font-display text-[20px] md:text-[24px] text-[#F5F7FA] mt-1.5 tracking-tight leading-tight">
            {bl.root_title}
            {rank === 1 && <Crown size={16} className="inline ml-2 -translate-y-[2px] text-[#F5C542]"/>}
          </h3>
          <div className="text-[11px] md:text-[12px] font-mono text-[#9CA3B0] mt-1">
            root: <span className="text-[#F5C542]">{bl.root_creator}</span>
            <span className="mx-2">·</span>
            <span className="text-[#00E6FF]">{bl.depth} node{bl.depth === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-[22px] md:text-[28px] tabular-nums" style={{ color: accent }}>
            ${bl.total_earnings_usd.toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-[#6B7280] uppercase tracking-[0.16em]">
            {bl.total_streams.toLocaleString()} streams · {bl.total_flips} flips
          </div>
        </div>
      </div>

      {/* Lineage chain viz */}
      <div className="mt-4 md:mt-5 relative">
        <div className="flex items-center gap-0 overflow-x-auto pb-1 relative">
          {bl.chain.map((c, i) => {
            const isRoot = c.is_root;
            const nodeColor = isRoot ? accent : "#00E6FF";
            return (
              <React.Fragment key={c.dna_tag}>
                {i > 0 && (
                  <div className="flex-1 min-w-[24px] h-[2px] mx-1 relative"
                       style={{ background: `linear-gradient(90deg, ${isRoot ? accent : "#00E6FF"}66, ${accent}66)` }}>
                    <Repeat2 size={10} className="absolute left-1/2 -translate-x-1/2 -top-[5px] text-[#FF2EBE] bg-[#0a0a0c] px-[1px]"/>
                  </div>
                )}
                <div className="shrink-0 min-w-[130px] md:min-w-[150px] max-w-[180px] bg-[#0E0F17] border rounded-[4px] px-2.5 py-2"
                     style={{ borderColor: `${nodeColor}55`, boxShadow: `inset 0 0 10px ${nodeColor}22` }}>
                  <div className="flex items-center gap-1.5">
                    <Fingerprint size={10} style={{ color: nodeColor }}/>
                    <span className="etched text-[#9CA3B0] text-[9px] truncate">
                      {isRoot ? "ROOT" : `FLIP ${i}`}
                    </span>
                  </div>
                  <div className="font-display text-[12px] md:text-[13px] text-[#F5F7FA] mt-1 truncate leading-tight">
                    {c.title}
                  </div>
                  <div className="font-mono text-[9px] text-[#6B7280] truncate mt-0.5">{c.creator}</div>
                  <div className="flex items-center justify-between mt-1.5 font-mono">
                    <span className="text-[9px] text-[#6B7280]">{c.streams.toLocaleString()}</span>
                    <span className="text-[10px]" style={{ color: nodeColor }}>
                      ${c.earnings_usd.toFixed(2)}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
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

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3 flex-wrap">
        <div>
          <div className="etched text-[#9CA3B0]">// UNIVERSAL STREAM</div>
          <h2 className="font-display text-[26px] md:text-[40px] text-[#F5F7FA] tracking-tight leading-[1.05] mt-1">
            Bloodline <span className="text-[#FF2EBE]">Remix</span> Leaderboard
          </h2>
          <p className="font-serif italic text-[#9CA3B0] mt-1 md:mt-2 text-[12px] md:text-[14px]">
            Rolling 24h rank · whose cultural bloodline is generating the most micro-royalties globally
          </p>
        </div>
        <div className="panel rounded-[6px] px-4 py-3 flex items-center gap-3">
          <Radio size={14} className="text-[#00E6FF] animate-pulse"/>
          <div>
            <div className="etched text-[#C8CCD8]">Live events</div>
            <div className="font-mono text-[#F5C542] text-[14px]">{live.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* leaderboard */}
        <div className="col-span-12 lg:col-span-8 space-y-4 md:space-y-5" data-testid="bloodline-list">
          {bloodlines.length === 0 && (
            <div className="panel rounded-[6px] p-6 text-center text-[#9CA3B0] font-mono text-[12px]">
              No bloodlines yet · flip a track to seed the lineage graph
            </div>
          )}
          {bloodlines.map((bl, i) => (
            <BloodlineCard key={bl.root_dna} bl={bl} rank={i + 1} accent={COLOR_RING[i % COLOR_RING.length]}/>
          ))}
        </div>

        {/* right rail */}
        <div className="col-span-12 lg:col-span-4 space-y-4 md:space-y-5">
          <NetworkGravityOrbit bloodlines={bloodlines}/>

          <div className="panel rounded-[6px] p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-[#F5C542]"/>
              <span className="etched text-[#F5C542]">Immutable Ledger · Last Events</span>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-hidden">
              {ledger.length === 0 && <div className="text-[#6B7280] font-mono text-[11px]">Ledger idle…</div>}
              {ledger.slice(0, 10).map((e) => (
                <div key={e.id} className="bg-[#0E0F17] border border-[#0E0F17] rounded-[3px] p-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em]"
                         style={{ color: e.kind === "mint" ? "#F5C542" : e.kind === "flip" ? "#FF2EBE" : "#00E6FF" }}>
                      {e.kind}
                    </div>
                    <div className="font-mono text-[10px] text-[#C8CCD8] truncate mt-0.5">{e.dna_tag?.slice(0,18)}…</div>
                  </div>
                  <div className="text-[10px] font-mono text-[#6B7280] shrink-0 ml-2">{e.actor?.slice(0,14)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
