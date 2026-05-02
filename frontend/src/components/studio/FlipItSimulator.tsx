import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Loader2, Database, Fingerprint, Coins, ArrowRight, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBarrioVault } from '../../lib/useBarrioVault';

const IGNIS_LOFI_FLIP_PAYLOAD = {
  track_metadata: {
    title: "Concrete Constellations (Ignis Lo-Fi Flip)",
    core_genre: "Lo-Fi Chicano Soul",
    s2_mutation: "Trap-Corrido Vocal Transplantation + Severe Cassette Degradation",
    dna_tag_preview: "trk_flip_ignis_lofi_112y"
  },
  ccna_ghostwriter_directive: {
    corpus: "Heartbreak",
    subtext: "exhausted_resignation_in_slow_motion"
  },
  epd_vocal_blueprint: {
    vulnerability_level: 0.95,
    biometric_artifacts: ["<acoustic_grit>", "<slow_exhale>", "<tape_hiss_bleed>"],
    phonation: "isolated_smoke_damaged_baritone_time_stretched"
  },
  acoustic_primitives: {
    groove: "70bpm_heavy_drag_sp404_swing",
    texture: "cassette_tape_degradation_low_pass_filtered_sub"
  },
  lyrics_payload: [
    {"line": "Ignis: The streets remember what the history books erased...", "artifact_trigger": "<slow_exhale>"},
    {"line": "Ignis: We still here. [Time-stretched, pitching down]", "artifact_trigger": "<acoustic_grit>"}
  ]
};

export default function FlipItSimulator() {
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isRendered, setIsRendered] = useState(false);
  
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipLog, setFlipLog] = useState<string[]>([]);

  const { triggerFlipRoyalty } = useBarrioVault();

  const handleRender = () => {
    setIsRendering(true);
    setRenderProgress(0);
    
    const interval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRendering(false);
          setIsRendered(true);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleFlip = () => {
    setIsFlipping(true);
    setFlipLog([]);

    // Trigger Ledger Royalty Event
    triggerFlipRoyalty(IGNIS_LOFI_FLIP_PAYLOAD.track_metadata.dna_tag_preview);
    
    const steps = [
      "Initiating S2 Transplantation Protocol...",
      "MSGO Isolation: Extracting Ignis Vocal Stem (trk_duo_aether_ignis_991z_vox_ignis)",
      "Applying Mutation: Time-stretching & Severe Cassette Degradation",
      "Verifying VICS Biometric DNA...",
      "DNA Match Confirmed: Ignis (usr_ignis_404x)",
      "Executing Smart Contract via Barrio Vault...",
      "Ledger Ping: $0.015 routed to usr_ignis_404x (Tx: 0x99F...D42)",
      "Minting Derivative DNA Tag (trk_flip_ignis_lofi_112y)...",
      "Transplantation Complete. Ledger Updated."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setFlipLog(prev => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsFlipping(false);
      }
    }, 800);
  };

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 space-y-8">
      <div className="flex items-center gap-4 border-b border-neutral-800 pb-6">
        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
          <Activity className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Project "Concrete Constellations (Ignis Lo-Fi Flip)"</h2>
          <p className="text-sm text-neutral-400">S2 Transplantation & Empire 1 Ledger Console</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* MSGO Render Engine */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            S2 Mutation Payload
          </h3>
          
          <div className="bg-black/50 border border-neutral-800 rounded-xl p-4 font-mono text-xs text-neutral-400 overflow-x-auto">
            <pre>{JSON.stringify(IGNIS_LOFI_FLIP_PAYLOAD, null, 2)}</pre>
          </div>

          {!isRendered ? (
            <button
              onClick={handleRender}
              disabled={isRendering}
              className="w-full py-4 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 font-bold tracking-wide transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  RENDERING SOULFIRE ({renderProgress}%)
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  EXECUTE RENDER
                </>
              )}
            </button>
          ) : (
            <div className="w-full py-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold tracking-wide flex items-center justify-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              STEMS MINTED & LOCKED
            </div>
          )}
        </div>

        {/* Flip It Test Environment */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-emerald-400" />
            Empire 1 Ledger Console
          </h3>

          <div className="bg-black/50 border border-neutral-800 rounded-xl p-6 min-h-[250px] flex flex-col">
            <div className="flex-1 space-y-3 font-mono text-xs">
              <AnimatePresence>
                {flipLog.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-2 ${
                      log.includes('Routing') ? 'text-emerald-400 font-bold' :
                      log.includes('Confirmed') ? 'text-blue-400' :
                      'text-neutral-400'
                    }`}
                  >
                    <span className="text-neutral-600 mt-0.5">{'>'}</span>
                    <span>{log}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isFlipping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-neutral-500"
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing...
                </motion.div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-800">
              <button
                onClick={handleFlip}
                disabled={!isRendered || isFlipping}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Coins className="w-5 h-5" />
                TEST STEM ISOLATION (FLIP)
              </button>
              {!isRendered && (
                <p className="text-center text-xs text-neutral-500 mt-3 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Render stems first to enable Flip testing
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
