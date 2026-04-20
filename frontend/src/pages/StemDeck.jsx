import React, { useEffect, useRef, useState } from "react";
import { getTracks, getWallet, uploadForDemucs } from "../lib/api";
import StemMixer from "../components/StemMixer";
import { Activity, Fingerprint, Zap, Heart, Sparkles, UploadCloud, Loader2 } from "lucide-react";

/** Glowing qualitative chip — no decimals, no math, just vibe. */
const QualChip = ({ icon: Icon, label, value, color = "#f5a524", testId }) => (
  <div className="bg-[#0d0d10] border border-[#1c1c22] rounded-[4px] p-3 md:p-4 flex items-center gap-3"
       data-testid={testId}>
    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0"
         style={{ background: `radial-gradient(circle at 40% 35%, ${color}33, transparent 70%)`,
                  boxShadow: `0 0 14px ${color}55, inset 0 0 8px ${color}33`,
                  border: `1px solid ${color}55` }}>
      <Icon size={16} style={{ color }} strokeWidth={1.6}/>
    </div>
    <div className="min-w-0 flex-1">
      <div className="etched text-[#8a8278] text-[9px] md:text-[10px]">{label}</div>
      <div className="font-display text-[15px] md:text-[17px] text-[#f3ece1] tracking-tight mt-0.5 truncate"
           style={{ textShadow: `0 0 10px ${color}44` }}>
        {value}
      </div>
    </div>
  </div>
);

export default function StemDeck() {
  const [tracks, setTracks] = useState([]);
  const [active, setActive] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [pulse, setPulse] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    getTracks().then((ts) => { setTracks(ts); setActive(ts[0]); });
    getWallet().then(setWallet).catch(() => {});
  }, []);

  const onPulse = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 650);
  };

  const onUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true); setUploadErr("");
    try {
      const { job, stems } = await uploadForDemucs(f);
      // craft a synthetic "uploaded" track that feeds straight into the mixer
      const synthetic = {
        id: job,
        dna_tag: `upload_${job}`,
        title: f.name.replace(/\.[^.]+$/, "") || "Uploaded Track",
        creator: "you",
        cultural_matrix: "User Upload · HTDemucs v4",
        stems,
        biometrics: {
          resonance_quality: "Present", vulnerability_level: "Deep",
          breath_profile: "Present", expressive_range: "Present",
          biometrics_active: true, signature_glyph: "◈◉◇⟡◉",
        },
        streams: 0, flips: 0, earnings_usd: 0,
      };
      setTracks((prev) => [synthetic, ...prev.filter(t => t.dna_tag !== synthetic.dna_tag)]);
      setActive(synthetic);
    } catch (ex) {
      setUploadErr(ex?.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (!active) {
    return <div className="p-12 text-[#8a8278] font-mono">Priming Empire 1 Ledger…</div>;
  }

  const b = active.biometrics || {};
  const setStems = (stems) => setActive({ ...active, stems });

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12">
      {/* header */}
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3 flex-wrap">
        <div>
          <div className="etched text-[#8a8278]">// CONSOLE</div>
          <h2 className="font-display text-[28px] md:text-[40px] text-[#f3ece1] tracking-tight leading-[1.05] mt-1">
            Sonance Pro <span className="text-[#f5a524]">Stem Deck</span>
          </h2>
          <p className="font-serif italic text-[#8a8278] mt-1 md:mt-2 text-[12px] md:text-[14px]">
            Elite-mode SSL console · analog warmth · cyberpunk ledger sync
          </p>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className={`tube-glow w-3 h-3 rounded-full ${pulse ? "animate-breathe" : ""}`} />
          <div className="text-right">
            <div className="etched text-[#c9bfae]">Wallet · Sovereign</div>
            <div className="font-mono text-[12px] md:text-[13px] text-[#ffd88a] mt-1">
              ${wallet?.balance_usd?.toFixed(4) ?? "0.0000"}
            </div>
          </div>
        </div>
      </div>

      {/* track ribbon */}
      <div className="flex gap-2 mb-5 md:mb-6 overflow-x-auto pb-2 -mx-2 px-2 items-center" data-testid="track-ribbon">
        {/* Upload button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          data-testid="demucs-upload-btn"
          className="shrink-0 px-3 md:px-4 py-2 rounded-[3px] border border-[#ff5eac]/50 bg-[#ff5eac]/10 text-[#ffb3d5] uppercase text-[10px] md:text-[11px] tracking-[0.16em] hover:bg-[#ff5eac]/20 transition flex items-center gap-2">
          {uploading ? <Loader2 size={12} className="animate-spin"/> : <UploadCloud size={12}/>}
          {uploading ? "Separating stems…" : "Upload · HTDemucs v4"}
        </button>
        <input
          ref={fileRef} type="file" accept="audio/*,video/*"
          onChange={onUpload}
          className="hidden"
          data-testid="demucs-upload-input"
        />
        {uploadErr && <span className="shrink-0 text-[10px] text-[#ff5eac] font-mono">{uploadErr}</span>}

        {tracks.map((t) => (
          <button
            key={t.dna_tag}
            onClick={() => setActive(t)}
            data-testid={`ribbon-${t.dna_tag}`}
            className={`shrink-0 px-3 md:px-4 py-2 rounded-[3px] border text-[10px] md:text-[11px] uppercase tracking-[0.14em] md:tracking-[0.16em] transition
              ${active.dna_tag === t.dna_tag
                ? "bg-[#f5a524]/15 border-[#f5a524]/60 text-[#ffd88a]"
                : "bg-[#0d0d10] border-[#22222a] text-[#8a8278] hover:text-[#f3ece1]"}`}>
            <span className="font-display">{t.title}</span>
            <span className="text-[#6b6257] mx-2">·</span>
            <span className="font-mono">{t.dna_tag}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* mixer column */}
        <div className="col-span-12 lg:col-span-8">
          <div className="panel rounded-[6px] p-4 md:p-6 mb-5 md:mb-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="etched text-[#8a8278]">Now Loaded</div>
                <h3 className="font-display text-[22px] md:text-[28px] text-[#f3ece1] mt-1 tracking-tight">{active.title}</h3>
                <div className="text-[11px] md:text-[12px] font-mono text-[#8a8278] mt-1">
                  {active.cultural_matrix} · <span className="text-[#f5a524]">{active.dna_tag}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="etched text-[#8a8278]">Creator</div>
                <div className="font-mono text-[12px] md:text-[13px] text-[#c9bfae] mt-1">{active.creator}</div>
              </div>
            </div>
          </div>
          <StemMixer stems={active.stems} onStemsChange={setStems} onPulse={onPulse}/>
        </div>

        {/* biometric + DNA column — qualitative only, IP-safe */}
        <div className="col-span-12 lg:col-span-4 space-y-4 md:space-y-5" data-testid="biometrics-panel">
          <div
            className={`panel rounded-[6px] p-4 md:p-5 relative transition-all duration-300 ${pulse ? "ring-2 ring-[#ff5eac] shadow-[0_0_30px_rgba(255,94,172,0.55)]" : ""}`}
            data-testid="biometric-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Fingerprint size={14} className="text-[#ff5eac]"/>
                <span className="etched text-[#ff5eac]">Biometrics · Human Pipes</span>
              </div>
              <span className={`text-[9px] md:text-[10px] font-mono uppercase tracking-[0.18em] ${pulse ? "text-[#ff5eac] animate-pulse" : "text-[#6b6257]"}`}>
                {pulse ? "◉ emotional crack" : "◈ active"}
              </span>
            </div>

            <div className="space-y-2 md:space-y-3">
              <QualChip icon={Heart}     label="Vulnerability Level"  value={b.vulnerability_level || "—"} color="#ff5eac" testId="chip-vuln"/>
              <QualChip icon={Activity}  label="Vocal Resonance"      value={b.resonance_quality   || "—"} color="#59d3ff" testId="chip-res"/>
              <QualChip icon={Sparkles}  label="Breath Profile"       value={b.breath_profile      || "—"} color="#6a8cff" testId="chip-breath"/>
              <QualChip icon={Zap}       label="Expressive Range"     value={b.expressive_range    || "—"} color="#f5a524" testId="chip-expr"/>
            </div>

            {b.signature_glyph && (
              <div className="mt-4 pt-4 border-t border-[#1c1c22]">
                <div className="etched text-[#8a8278] mb-1.5">Aether-Voice Signature</div>
                <div className="text-[20px] md:text-[22px] tracking-[0.3em] text-[#59d3ff]"
                     style={{ textShadow: "0 0 14px rgba(89,211,255,0.55)" }}>
                  {b.signature_glyph}
                </div>
              </div>
            )}
          </div>

          <div className="panel rounded-[6px] p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-[#ffd88a]"/>
              <span className="etched text-[#ffd88a]">DNA · SynthID</span>
            </div>
            <div className="font-mono text-[11px] text-[#ffd88a] break-all bg-[#0d0d10] p-3 rounded-[3px] border border-[#f5a524]/20">
              {active.dna_tag}
            </div>
            <div className="text-[10px] font-mono text-[#6b6257] mt-2 uppercase tracking-[0.18em]">
              Immutable · Pinned to Empire 1 Ledger
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
