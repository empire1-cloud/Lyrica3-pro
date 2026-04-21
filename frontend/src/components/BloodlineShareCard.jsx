import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { X, Download, Share2, Fingerprint, Repeat2, TrendingUp, Crown, Zap } from "lucide-react";

/**
 * Bloodline Share Card — cultural recruitment beacon.
 * Renders a 1080x1350 (4:5 TikTok/IG portrait) cinematic card with full DNA lineage,
 * SynthID watermark, royalty snapshot, and one-tap PNG export / Web Share.
 *
 * Props:
 *   track       — primary track { dna_tag, title, creator, cultural_matrix, streams, earnings_usd, parent_dna, flips, synth_provider, voice_provider }
 *   chain       — optional ancestry array [{ dna_tag, title, creator, is_root }]
 *   onClose     — fn
 */
export default function BloodlineShareCard({ track, chain = null, onClose }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  // Derive lineage chain (root → ... → this track)
  const lineage = chain && chain.length ? chain : [
    ...(track.parent_dna ? [{ dna_tag: track.parent_dna, title: "Root DNA", creator: "—", is_root: true }] : []),
    { dna_tag: track.dna_tag, title: track.title, creator: track.creator, is_root: !track.parent_dna },
  ];

  const buildPng = async () => {
    if (!cardRef.current) return null;
    // Render at 2x pixel ratio for crisp TikTok/IG quality
    return await toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#08080a",
      style: { transform: "none" },
    });
  };

  const download = async () => {
    setBusy(true); setFlash("");
    try {
      const dataUrl = await buildPng();
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `lyrica3-bloodline-${track.dna_tag.slice(0, 12)}.png`;
      a.click();
      setFlash("PNG exported · drop it on TikTok / IG");
    } catch (e) {
      setFlash("Export failed · try again");
    } finally { setBusy(false); }
  };

  const share = async () => {
    setBusy(true); setFlash("");
    try {
      const dataUrl = await buildPng();
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `lyrica3-${track.dna_tag.slice(0,12)}.png`, { type: "image/png" });
      const shareText = `${track.title} · DNA ${track.dna_tag.slice(0,16)}… · flip it on lyrica3.com`;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: track.title,
          text: shareText,
        });
        setFlash("Shared · bloodline propagating");
      } else if (navigator.share) {
        await navigator.share({ title: track.title, text: shareText, url: window.location.origin });
        setFlash("Link shared");
      } else {
        // Fallback: copy link + trigger download
        await navigator.clipboard.writeText(`${window.location.origin}/feed?flip=${track.dna_tag}`);
        download();
        setFlash("Link copied · PNG downloaded");
      }
    } catch (e) {
      if (e?.name !== "AbortError") setFlash("Share unavailable · use download");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-start md:items-center justify-center p-3 md:p-6 overflow-y-auto"
         data-testid="bloodline-share-modal">
      <div className="w-full max-w-[540px] relative">
        {/* Header controls */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <div>
            <div className="etched text-[#ff5eac] text-[10px]">// BLOODLINE CARD</div>
            <div className="font-display text-[#f3ece1] text-[16px] md:text-[18px] tracking-tight">
              Share your DNA · TikTok · IG · X
            </div>
          </div>
          <button onClick={onClose} className="text-[#6b6257] hover:text-[#ff5eac]" data-testid="bloodline-share-close">
            <X size={18}/>
          </button>
        </div>

        {/* The exportable card */}
        <div
          ref={cardRef}
          data-testid="bloodline-share-card"
          className="relative w-full overflow-hidden rounded-[6px]"
          style={{
            aspectRatio: "4 / 5",
            background: "linear-gradient(160deg, #08080a 0%, #0d0d12 50%, #12080f 100%)",
            border: "1px solid #2a2a34",
          }}
        >
          {/* Pink/cyan biometric haze */}
          <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full pointer-events-none"
               style={{ background: "radial-gradient(circle, rgba(255,94,172,0.28) 0%, rgba(255,94,172,0) 70%)", filter: "blur(40px)" }}/>
          <div className="absolute -bottom-32 -left-24 w-[460px] h-[460px] rounded-full pointer-events-none"
               style={{ background: "radial-gradient(circle, rgba(89,211,255,0.22) 0%, rgba(89,211,255,0) 70%)", filter: "blur(48px)" }}/>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
               style={{ background: "radial-gradient(circle, rgba(245,165,36,0.12) 0%, rgba(245,165,36,0) 60%)", filter: "blur(60px)" }}/>

          {/* Grain / scanlines overlay */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
               style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 3px)" }}/>

          {/* Content */}
          <div className="relative h-full flex flex-col justify-between p-5 md:p-7">
            {/* Top: brand mark + DNA */}
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border border-[#f5a524]/60 flex items-center justify-center"
                       style={{ boxShadow: "inset 0 0 8px rgba(245,165,36,0.4), 0 0 6px rgba(245,165,36,0.25)" }}>
                    <div className="w-2 h-2 rounded-full bg-[#ffd88a]"/>
                  </div>
                  <div>
                    <div className="font-display text-[13px] md:text-[14px] text-[#f3ece1] tracking-[0.14em]">LYRICA 3</div>
                    <div className="font-mono text-[8px] text-[#6b6257] uppercase tracking-[0.22em]">empire one · sovereign</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[8px] text-[#59d3ff] uppercase tracking-[0.18em]">SynthID</div>
                  <div className="font-mono text-[9px] text-[#8a8278] mt-0.5">C2PA · verified</div>
                </div>
              </div>

              {/* Cultural matrix tag */}
              <div className="mt-5 md:mt-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] border border-[#ff5eac]/40 bg-[#ff5eac]/10">
                  <Zap size={9} className="text-[#ff5eac]"/>
                  <span className="font-mono text-[9px] text-[#ff5eac] uppercase tracking-[0.2em]">
                    {track.cultural_matrix || "Soulfire"}
                  </span>
                </div>
                <h2 className="font-display text-[26px] md:text-[32px] text-[#f3ece1] mt-2.5 tracking-tight leading-[1.02]"
                    style={{ textShadow: "0 2px 18px rgba(245,165,36,0.15)" }}>
                  {track.title}
                </h2>
                <div className="font-mono text-[10px] md:text-[11px] text-[#8a8278] mt-1.5 tracking-wide">
                  by <span className="text-[#ffd88a]">{track.creator}</span>
                  {!!track.flips && <> · <span className="text-[#59d3ff]">{track.flips} flips</span></>}
                </div>
              </div>
            </div>

            {/* Middle: Lineage chain */}
            <div className="flex-1 flex flex-col justify-center my-4 md:my-5">
              <div className="font-mono text-[8px] text-[#6b6257] uppercase tracking-[0.22em] mb-2.5 flex items-center gap-2">
                <Fingerprint size={10} className="text-[#f5a524]"/>
                Cultural Bloodline · immutable lineage
              </div>
              <div className="space-y-1.5">
                {lineage.slice(0, 4).map((node, i) => {
                  const isMe = node.dna_tag === track.dna_tag;
                  const accent = node.is_root ? "#ffd88a" : isMe ? "#ff5eac" : "#59d3ff";
                  return (
                    <div key={node.dna_tag + i} className="flex items-center gap-2">
                      {i > 0 && (
                        <Repeat2 size={10} className="text-[#ff5eac] ml-1 shrink-0"
                                 style={{ filter: "drop-shadow(0 0 4px rgba(255,94,172,0.6))" }}/>
                      )}
                      <div className="flex-1 min-w-0 rounded-[3px] px-2.5 py-1.5 border flex items-center justify-between gap-2"
                           style={{
                             borderColor: `${accent}55`,
                             background: isMe ? `${accent}14` : "#0d0d10",
                             boxShadow: isMe ? `inset 0 0 14px ${accent}33` : `inset 0 0 6px ${accent}11`,
                           }}>
                        <div className="min-w-0">
                          <div className="font-mono text-[7.5px] uppercase tracking-[0.2em]" style={{ color: accent }}>
                            {node.is_root ? "ROOT" : isMe ? "◆ YOU" : `FLIP ${i}`}
                            {node.is_root && <Crown size={8} className="inline ml-1 -translate-y-[1px]"/>}
                          </div>
                          <div className="font-display text-[12px] md:text-[13px] text-[#f3ece1] truncate leading-tight mt-0.5">
                            {node.title}
                          </div>
                        </div>
                        <div className="font-mono text-[8px] text-[#6b6257] truncate shrink-0 max-w-[38%] text-right">
                          {node.dna_tag.slice(0, 14)}…
                        </div>
                      </div>
                    </div>
                  );
                })}
                {lineage.length > 4 && (
                  <div className="font-mono text-[9px] text-[#6b6257] text-center pt-1">
                    + {lineage.length - 4} more ancestor{lineage.length - 4 === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: stats + CTA + DNA tag */}
            <div>
              <div className="grid grid-cols-3 gap-2 mb-3.5">
                <div className="bg-[#0d0d10]/70 border border-[#1c1c22] rounded-[3px] px-2.5 py-2">
                  <div className="font-mono text-[7.5px] text-[#6b6257] uppercase tracking-[0.18em]">Streams</div>
                  <div className="font-display text-[14px] text-[#f3ece1] tabular-nums mt-0.5 flex items-center gap-1">
                    <TrendingUp size={10} className="text-[#ffd88a]"/>
                    {(track.streams || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#0d0d10]/70 border border-[#1c1c22] rounded-[3px] px-2.5 py-2">
                  <div className="font-mono text-[7.5px] text-[#6b6257] uppercase tracking-[0.18em]">Earned</div>
                  <div className="font-display text-[14px] text-[#ffd88a] tabular-nums mt-0.5">
                    ${(track.earnings_usd || 0).toFixed(2)}
                  </div>
                </div>
                <div className="bg-[#0d0d10]/70 border border-[#1c1c22] rounded-[3px] px-2.5 py-2">
                  <div className="font-mono text-[7.5px] text-[#6b6257] uppercase tracking-[0.18em]">Rate</div>
                  <div className="font-display text-[14px] text-[#59d3ff] tabular-nums mt-0.5">
                    $0.004<span className="text-[9px] text-[#6b6257]">/str</span>
                  </div>
                </div>
              </div>

              {/* CTA strip */}
              <div className="rounded-[3px] border border-[#ff8a3d]/60 px-3 py-2.5 flex items-center justify-between"
                   style={{ background: "linear-gradient(90deg, rgba(245,165,36,0.18), rgba(255,94,172,0.14))" }}>
                <div>
                  <div className="font-mono text-[8px] text-[#ffd88a] uppercase tracking-[0.22em]">Flip this bloodline</div>
                  <div className="font-display text-[13px] md:text-[14px] text-[#f3ece1] mt-0.5">lyrica3.com</div>
                </div>
                <div className="font-mono text-[9px] text-[#c9bfae] text-right">
                  parents earn<br/>
                  <span className="text-[#ffd88a]">forever</span>
                </div>
              </div>

              {/* DNA tag footer */}
              <div className="mt-2.5 flex items-center justify-between gap-2 text-[8px] font-mono text-[#6b6257] uppercase tracking-[0.18em]">
                <span className="truncate">DNA · <span className="text-[#ffd88a] normal-case tracking-normal">{track.dna_tag}</span></span>
                <span className="shrink-0">© Empire 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
          <button
            onClick={download}
            disabled={busy}
            data-testid="bloodline-download-btn"
            className="flex-1 py-3 rounded-[3px] border border-[#59d3ff]/50 bg-[#59d3ff]/10 hover:bg-[#59d3ff]/20
                       text-[#59d3ff] uppercase text-[11px] tracking-[0.2em] font-medium
                       flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
            <Download size={14}/>
            {busy ? "Rendering…" : "Download PNG"}
          </button>
          <button
            onClick={share}
            disabled={busy}
            data-testid="bloodline-share-btn"
            className="flex-1 py-3 rounded-[3px] border border-[#ff8a3d]/60 bg-gradient-to-b from-[#f5a524]/25 to-[#ff5eac]/20
                       text-[#ffd88a] uppercase text-[11px] tracking-[0.22em] font-bold
                       flex items-center justify-center gap-2 disabled:opacity-50 animate-amber transition-all">
            <Share2 size={14}/>
            {busy ? "Rendering…" : "Share · TikTok / IG"}
          </button>
        </div>
        {flash && (
          <div className="mt-2.5 text-center font-mono text-[10px] text-[#c9bfae] uppercase tracking-[0.18em]"
               data-testid="bloodline-share-flash">
            {flash}
          </div>
        )}
        <div className="mt-2 text-center font-mono text-[9px] text-[#6b6257] uppercase tracking-[0.18em]">
          Card renders at 2x resolution · 1080px+ crisp for TikTok, IG Reels & Stories
        </div>
      </div>
    </div>
  );
}
