import { useState, useRef } from 'react';
import { Users, Play, Pause, Loader2, FileText, Mic2, Database, Lock, BrainCircuit, Coins, Layers } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { motion, AnimatePresence } from 'framer-motion';
import { VOCAL_PROFILES } from './VoiceAuditionGallery';
import { pcmToWav } from '../../lib/audioUtils';

const CONCRETE_CONSTELLATIONS_PAYLOAD = {
  track_metadata: {
    title: "Concrete Constellations",
    core_genre: "Chicano Dream-Soul / Trap-Corrido",
    s2_mutation: "Dissociated Ambient Pads + Aggressive 808 Corrido Rhythm",
    dna_tag_preview: "trk_duo_aether_ignis_991z"
  },
  ccna_ghostwriter_directive: {
    corpus: "Struggle & Diversity",
    subtext: "staring_at_ruins_while_the_bass_shakes_the_foundation"
  },
  epd_vocal_blueprint: {
    vulnerability_level: 0.92,
    biometric_artifacts: ["<exhausted_inhale>", "<acoustic_grit>", "<emotional_crack>"],
    phonation: "hollow_falsetto_colliding_with_smoke_damaged_baritone"
  },
  acoustic_primitives: {
    groove: "80bpm_trap_corrido_waltz_with_vinyl_crackle",
    texture: "tape_degraded_warmth_meets_surgical_sub_bass"
  }
};

const SRI_PAYLOAD = {
  sri_explainable_rationale: {
    target_asset: "Concrete Constellations",
    collision_analysis: "Chicano Dream-Soul vs. Trap-Corrido",
    epd_decisions: [
      {
        action: "Applied aggressive sidechain compression to Aether's 2-4kHz frequency range.",
        rationale: "To prevent Ignis's glottal stops from masking Aether's breathy falsetto. Ensures 'dissociated' emotional subtext is not lost in the 'industrial' physical weight."
      },
      {
        action: "Introduced 15ms late-pocket drag to the 808 sub-bass.",
        rationale: "Aligns with the 'Struggle & Diversity' CCNA directive. Mimics the dragging, heavy footfalls of exhaustion while maintaining the aggressive Trap-Corrido waltz signature."
      }
    ],
    vics_ledger_status: {
      aether_royalty_split: "50% routing via smart contract 0xA1...",
      ignis_royalty_split: "50% routing via smart contract 0xI9..."
    }
  }
};

const FLIP_IT_PAYLOAD = {
  flip_it_ledger_transaction: {
    derivative_track: "Concrete Constellations (Ignis Slow-Drag Flip)",
    isolated_stem: "usr_ignis_404x_vox_stem.wav",
    s2_mutation_applied: "time_stretch_down_pitch_cassette_degradation",
    vics_steward_verification: "AUTHORIZED",
    micro_royalty_routing: [
      {
        creator_id: "usr_ignis_404x",
        contribution: "Vocal DNA / Performance",
        fractional_usd_payout: "$0.015",
        smart_contract_tx: "0x88F...D42A"
      },
      {
        creator_id: "empire_1_syndicate_pool",
        contribution: "MSGO Infrastructure",
        fractional_usd_payout: "$0.005",
        smart_contract_tx: "0x99A...E11B"
      }
    ],
    new_dna_tag_minted: "trk_flip_ignis_lofi_112y"
  }
};

export default function DuoSoulEngine() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRenderComplete, setIsRenderComplete] = useState(false);
  const [flipState, setFlipState] = useState<'idle' | 'extracting' | 'routing' | 'complete'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Dynamic State
  const [voice1Name, setVoice1Name] = useState('Joey');
  const [voice1Model, setVoice1Model] = useState('puck');
  const [voice2Name, setVoice2Name] = useState('Xochitl');
  const [voice2Model, setVoice2Model] = useState('kore');
  const [lyrics, setLyrics] = useState(
`Joey: Baby, let the rhythm take control of your soul.
Xochitl: El canto de las flores despierta el amanecer.
Joey: I can feel the magic in the air tonight.
Xochitl: Bajo la luna, bailamos con el viento.`
  );

  const handleInputChange = () => {
    if (audioUrl || isRenderComplete) {
      setAudioUrl(null);
      setIsPlaying(false);
      setIsRenderComplete(false);
      setFlipState('idle');
    }
  };

  const generateDuet = async () => {
    if (audioUrl || isRenderComplete) {
      if (audioRef.current && audioUrl) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(console.error);
        }
        setIsPlaying(!isPlaying);
      }
      return;
    }

    if (!lyrics.trim()) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `TTS the following conversation between ${voice1Name} and ${voice2Name} using the Aether-Ensemble-v2 engine. 
      
      FORMATTING REQUIREMENT (Soulfire Injected):
      Ensure distinct emotional delivery for each speaker. Break the perfect rhythm. 
      Introduce micro-pauses (using ...), phonetic stutters, and bracketed stage directions (e.g., (sharp inhale), (pause), (shaky exhale)).
      
      Conversation:
      \n\n${lyrics}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: voice1Name,
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: voice1Model } }
                },
                {
                  speaker: voice2Name,
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: voice2Model } }
                }
              ]
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const url = pcmToWav(base64Audio);
        setAudioUrl(url);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play().catch(console.error);
          setIsPlaying(true);
        }
        setIsRenderComplete(true);
      }
    } catch (error) {
      console.error("Failed to generate duet:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const executeFlip = () => {
    setFlipState('extracting');
    setTimeout(() => setFlipState('routing'), 2000);
    setTimeout(() => setFlipState('complete'), 4500);
  };

  return (
    <div className="glass-card p-6 md:p-8 flex flex-col h-full">
      <audio 
        ref={audioRef} 
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        className="hidden" 
      />
      
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
          <Users className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Duo-Soul Engine: Metamorphic Collision</h3>
          <p className="text-sm text-slate-400">S2 Serendipity Synthesizer & CPIM Stress Test</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Payload */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium mb-4">
            <Database className="w-4 h-4 text-purple-400" />
            Project "Concrete Constellations"
          </div>
          <div className="flex-1 bg-black/40 rounded-xl p-4 overflow-auto font-mono text-[10px] text-purple-300/60 h-[180px] custom-scrollbar">
            <pre>{JSON.stringify(CONCRETE_CONSTELLATIONS_PAYLOAD, null, 2)}</pre>
          </div>
        </div>

        {/* Security / Routing */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
            <Lock className="w-4 h-4 text-purple-400" />
            VICS Steward & Barrio Vault Routing
          </div>
          
          <div className="space-y-3 text-[10px] font-mono">
            <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-slate-500">VICS Lock: Aether</span>
              <span className="text-purple-400 font-bold">VERIFIED (usr_aether_88x)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-slate-500">VICS Lock: Ignis</span>
              <span className="text-purple-400 font-bold">VERIFIED (usr_ignis_404x)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-slate-500">CSPIW Watermark</span>
              <span className="text-fuchsia-400 font-bold">DUAL-SIGNATURE MINTED</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
              <span className="text-slate-500">Barrio Vault Fabric</span>
              <span className="text-purple-300 font-bold">ROUTING ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {/* Voice Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Voice 1 */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Voice 1</span>
            </div>
            <div className="space-y-3">
              <input 
                type="text" 
                value={voice1Name}
                onChange={(e) => { setVoice1Name(e.target.value); handleInputChange(); }}
                placeholder="Character Name"
                className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-purple-500 outline-none transition-all"
              />
              <div className="relative">
                <Mic2 className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <select 
                  value={voice1Model}
                  onChange={(e) => { setVoice1Model(e.target.value); handleInputChange(); }}
                  className="w-full bg-black/60 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white appearance-none focus:border-purple-500 outline-none cursor-pointer"
                >
                  {VOCAL_PROFILES.map(v => <option key={v.id} value={v.voiceName}>{v.name} ({v.timbre})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Voice 2 */}
          <div className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Voice 2</span>
            </div>
            <div className="space-y-3">
              <input 
                type="text" 
                value={voice2Name}
                onChange={(e) => { setVoice2Name(e.target.value); handleInputChange(); }}
                placeholder="Character Name"
                className="w-full bg-black/60 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:border-fuchsia-500 outline-none transition-all"
              />
              <div className="relative">
                <Mic2 className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <select 
                  value={voice2Model}
                  onChange={(e) => { setVoice2Model(e.target.value); handleInputChange(); }}
                  className="w-full bg-black/60 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white appearance-none focus:border-fuchsia-500 outline-none cursor-pointer"
                >
                  {VOCAL_PROFILES.map(v => <option key={v.id} value={v.voiceName}>{v.name} ({v.timbre})</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lyrics Input */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
              <FileText className="w-4 h-4 text-blue-400" />
              Duet Script
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Format: "Name: Lyric"</span>
          </div>
          <textarea
            value={lyrics}
            onChange={(e) => { setLyrics(e.target.value); handleInputChange(); }}
            placeholder={`${voice1Name}: Hello there.\n${voice2Name}: Hi!`}
            className="w-full h-40 bg-black/40 border border-white/5 rounded-xl p-4 text-sm text-slate-300 font-mono resize-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all custom-scrollbar"
          />
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={generateDuet}
          disabled={isGenerating || !lyrics.trim()}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold tracking-widest uppercase transition-all ${
            isPlaying
              ? 'bg-purple-900/40 text-purple-400 border border-purple-500/30'
              : 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isGenerating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Generating Duo Session...</>
          ) : isPlaying ? (
            <><Pause className="w-5 h-5" /> Pause Session</>
          ) : audioUrl ? (
            <><Play className="w-5 h-5" /> Play Session</>
          ) : (
            <><Play className="w-5 h-5" /> Generate Duo Session</>
          )}
        </button>
      </div>

      {/* SRI Readout Panel */}
      {(isRenderComplete || isGenerating) && (
        <div className="mt-8 bg-black/40 border border-white/5 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 text-purple-400 text-[10px] font-bold mb-4 uppercase tracking-[0.2em]">
            <BrainCircuit className="w-4 h-4" />
            SRI (Soulfire Rationale Interface)
          </div>
          <div className="bg-black/40 rounded-xl p-4 overflow-auto font-mono text-[11px] text-purple-300/60 border border-white/5 h-[150px] custom-scrollbar">
            <pre className="whitespace-pre-wrap">{JSON.stringify(SRI_PAYLOAD, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Flip It Ledger Console */}
      {isRenderComplete && (
        <div className="mt-8 bg-black/40 border border-white/5 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                <Coins className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Barrio Vault: "Flip It" Ledger Console</h3>
                <p className="text-sm text-slate-400">Contagion Test: Ignis Vocal Isolation</p>
              </div>
            </div>
            {flipState === 'idle' && (
              <button
                onClick={executeFlip}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl tracking-widest uppercase transition-all flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)]"
              >
                <Layers className="w-4 h-4" />
                Execute Stem Flip
              </button>
            )}
          </div>

          {flipState !== 'idle' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Visualizer */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden">
                <div className="flex gap-4 w-full justify-center items-end h-32">
                  {['Drums', 'Bass', 'Melody'].map((stem, i) => (
                    <motion.div
                      key={stem}
                      animate={{
                        opacity: flipState === 'extracting' ? 0.3 : 0.1,
                        y: flipState === 'extracting' ? 20 : 0
                      }}
                      className="w-16 h-full bg-slate-800 rounded-xl flex items-end justify-center pb-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                    >
                      {stem}
                    </motion.div>
                  ))}
                  <motion.div
                    animate={{
                      y: flipState === 'extracting' ? -20 : (flipState === 'routing' || flipState === 'complete' ? -40 : 0),
                      scale: flipState === 'routing' || flipState === 'complete' ? 1.1 : 1,
                      borderColor: flipState === 'complete' ? '#a855f7' : '#d946ef',
                      boxShadow: flipState === 'complete' ? '0 0 30px rgba(168, 85, 247, 0.3)' : 'none'
                    }}
                    className="w-16 h-full bg-purple-500/10 border-2 border-purple-500/30 rounded-xl flex items-end justify-center pb-3 text-[10px] font-bold text-purple-400 uppercase tracking-wider z-10"
                  >
                    Vocals
                  </motion.div>
                </div>
                
                <AnimatePresence>
                  {(flipState === 'routing' || flipState === 'complete') && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-8 left-0 right-0 flex justify-center"
                    >
                      <div className="bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-mono px-6 py-2.5 rounded-full flex items-center gap-3 shadow-xl backdrop-blur-md">
                        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        Routing $0.015 to usr_ignis_404x
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Terminal */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-6 font-mono text-[11px] text-purple-400 overflow-auto h-[280px] shadow-inner custom-scrollbar">
                <div className="mb-4 text-slate-600">{"// BARRIO VAULT LEDGER TRANSACTION"}</div>
                {flipState === 'extracting' && <div className="text-slate-300">[+] Isolating stem: usr_ignis_404x_vox_stem.wav...</div>}
                {(flipState === 'routing' || flipState === 'complete') && (
                  <div className="space-y-2">
                    <div className="text-slate-400">[+] Isolating stem: usr_ignis_404x_vox_stem.wav... <span className="text-purple-400">[DONE]</span></div>
                    <div className="text-slate-400">[+] Applying S2 Mutation: time_stretch_down_pitch_cassette_degradation... <span className="text-purple-400">[DONE]</span></div>
                    <div className="text-slate-400">[+] Verifying VICS Steward... <span className="text-purple-400 font-bold">AUTHORIZED</span></div>
                    {flipState === 'routing' && <div className="animate-pulse text-fuchsia-400 mt-4">[!] Calculating Micro-Royalties & Minting DNA...</div>}
                  </div>
                )}
                {flipState === 'complete' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 pt-6 border-t border-white/5">
                    <pre className="whitespace-pre-wrap text-slate-400">{JSON.stringify(FLIP_IT_PAYLOAD, null, 2)}</pre>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
