import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Dna, Shuffle, Activity, Lock, Play, Loader2, CheckCircle2, Waves, Zap, User, ChevronDown, AlertTriangle, Key, Mic2, Sparkles } from 'lucide-react';
import { VOCAL_PROFILES } from './VoiceAuditionGallery';
import { generate } from '../../lib/api';

const OBSIDIAN_LACE_PAYLOAD = {
  track_metadata: {
    title: "Obsidian Lace",
    core_genre: "Chicano Souldies / UK Drill",
    s2_mutation: "Vintage Analog Vox + Sliding 808s & Skittering Hi-Hats",
    dna_tag_preview: "trk_s2_terra_drill_404x"
  },
  ccna_ghostwriter_directive: {
    corpus: "Heartbreak",
    subtext: "crying_in_the_rain_while_the_bass_slides_and_shatters"
  },
  epd_vocal_blueprint: {
    vulnerability_level: 0.94,
    biometric_artifacts: ["<vinyl_crackle_bleed>", "<tape_flutter_wobble>", "<emotional_crack>"],
    phonation: "warm_analog_belt_chopped_and_stuttered"
  },
  acoustic_primitives: {
    groove: "140bpm_uk_drill_slide_with_motown_tambourine",
    texture: "dusty_vinyl_sample_chopped_over_surgical_digital_sub"
  }
};

export default function S2Synthesizer() {
  const [isFusing, setIsFusing] = useState(false);
  const [fusionState, setFusionState] = useState<'idle' | 'dissecting' | 'aligning' | 'complete'>('idle');
  const [mutationLevel, setMutationLevel] = useState(75);
  const [disruptionHeuristics, setDisruptionHeuristics] = useState(60);
  const [selectedVoice, setSelectedVoice] = useState('zephyr');
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
  const [songTitle, setSongTitle] = useState('Obsidian Lace');
  const [coreGenre, setCoreGenre] = useState('UK Drill');
  const [vocalState, setVocalState] = useState(85);
  const [fusionHypothesis, setFusionHypothesis] = useState<string | null>(null);
  const [fusionResult, setFusionResult] = useState<any>(null);
  const [fusionError, setFusionError] = useState<string | null>(null);

  const currentProfile = VOCAL_PROFILES.find(p => p.voiceName === selectedVoice) || VOCAL_PROFILES[0];

  // Map UI genre to backend genre values
  const GENRE_MAP: Record<string, string> = {
    'UK Drill': 'Drill',
    'Corrido Tumbado': 'Corridos',
    'Trap': 'Trap Soul',
    'Souldies': 'SGV Oldies',
  };

  const executeFusion = async () => {
    if (isFusing) return;
    setIsFusing(true);
    setFusionError(null);
    setFusionResult(null);
    setFusionState('dissecting');

    // Transition to 'aligning' after brief UI delay
    await new Promise(r => setTimeout(r, 1500));
    setFusionState('aligning');

    try {
      const lyricsPrompt = `${songTitle} — S2 metamorphic collision. Mutation: ${mutationLevel}%. Disruption: ${disruptionHeuristics}%. Vocal presence: ${vocalState}%.`;
      const result = await generate({
        lyrics: lyricsPrompt,
        genre: GENRE_MAP[coreGenre] || coreGenre,
        mood: 'Late-Night Honesty',
        title: songTitle,
        vulnerability_override: vocalState / 100,
      });
      setFusionResult(result);
      setFusionHypothesis(result?.biometrics?.production_note || `S2 collision: ${coreGenre} primitives fused at ${mutationLevel}% mutation depth.`);
      setFusionState('complete');
    } catch (err: any) {
      setFusionError(err?.response?.data?.detail || err?.message || 'Fusion failed.');
      setFusionState('idle');
    } finally {
      setIsFusing(false);
    }
  };

  return (
    <div className="glass-card p-10 md:p-12 flex flex-col h-full relative overflow-hidden group border-white/10">
      {/* Hardware Accents */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-velvet-purple/50 to-transparent" />
      <div className="absolute top-4 left-4 flex gap-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-white/20" />
        ))}
      </div>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 relative z-10 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-velvet-purple/10 border border-velvet-purple/30 rounded-lg">
              <Wand2 className="w-5 h-5 text-velvet-purple" />
            </div>
            <span className="micro-label !text-velvet-purple/70">Metamorphic Engine</span>
          </div>
          <h2 className="text-5xl font-serif font-bold italic text-white tracking-tighter">
            S2 <span className="premium-gradient-text">Synthesizer</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium max-w-md leading-relaxed">
            Architectural genre-blending engine utilizing latent space resonance to fuse disparate acoustic primitives.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-black/40 border border-white/5 p-2 rounded-2xl backdrop-blur-xl">
          <div className="flex flex-col items-end px-4">
            <span className="micro-label">Engine Load</span>
            <span className="text-xs font-mono text-emerald-500">0.042ms Latency</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <Activity className="w-6 h-6 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12 relative z-10">
        {/* Left: Configuration Rail */}
        <div className="lg:col-span-4 space-y-10">
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="micro-label">Identity Matrix</label>
              <div className="space-y-3">
                <div className="relative group/input">
                  <input 
                    type="text"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-velvet-purple focus:ring-4 focus:ring-velvet-purple/10 outline-none transition-all font-serif italic"
                    placeholder="Project Title"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-600 group-focus-within/input:text-velvet-purple transition-colors">TITL</div>
                </div>
                <div className="relative group/input">
                  <select 
                    value={coreGenre}
                    onChange={(e) => setCoreGenre(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:border-velvet-purple focus:ring-4 focus:ring-velvet-purple/10 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="UK Drill">UK Drill</option>
                    <option value="Corrido Tumbado">Corrido Tumbado</option>
                    <option value="Trap">Trap</option>
                    <option value="Souldies">Souldies</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="micro-label">Vocal Anchor</label>
              <button
                onClick={() => setIsVoiceSelectorOpen(!isVoiceSelectorOpen)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 flex items-center justify-between hover:border-velvet-purple/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentProfile.color} flex items-center justify-center shadow-lg`}>
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">{currentProfile.name}</p>
                    <p className="text-[9px] text-slate-500 font-mono uppercase">{currentProfile.archetype}</p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isVoiceSelectorOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          <div className="space-y-8 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="micro-label">Mutation</label>
                <span className="text-[10px] font-mono text-velvet-purple">{mutationLevel}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={mutationLevel} 
                onChange={(e) => setMutationLevel(parseInt(e.target.value))}
                className="w-full accent-velvet-purple h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="micro-label">Disruption</label>
                <span className="text-[10px] font-mono text-velvet-purple">{disruptionHeuristics}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={disruptionHeuristics} 
                onChange={(e) => setDisruptionHeuristics(parseInt(e.target.value))}
                className="w-full accent-velvet-purple h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="micro-label">Vocal State</label>
                <span className="text-[10px] font-mono text-velvet-purple">{vocalState}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={vocalState} 
                onChange={(e) => setVocalState(parseInt(e.target.value))}
                className="w-full accent-velvet-purple h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Center: Liquid Visualizer Stage */}
        <div className="lg:col-span-8 relative">
          <div className="bg-black/60 border border-white/10 rounded-[3rem] h-[500px] relative overflow-hidden group/viz shadow-2xl">
            {/* Liquid Background */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)] animate-pulse" />
            </div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
              <AnimatePresence mode="wait">
                {fusionState === 'idle' ? (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="flex flex-col items-center text-center space-y-6"
                  >
                    <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center relative">
                      <div className="absolute inset-0 border border-velvet-purple/20 rounded-full animate-ping" />
                      <Sparkles className="w-10 h-10 text-velvet-purple" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-serif italic text-white">Awaiting Collision</h3>
                      <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Select Primitives to Begin</p>
                    </div>
                  </motion.div>
                ) : fusionState === 'complete' ? (
                  <motion.div 
                    key="complete"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center text-center space-y-8 w-full max-w-lg"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                      <div className="relative w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-serif italic text-white">Mutation Successful</h3>
                      {fusionResult?.dna_tag && (
                        <div className="text-xs font-mono text-velvet-purple/80">{fusionResult.dna_tag}</div>
                      )}
                      <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
                        <p className="text-lg text-slate-300 font-serif leading-relaxed italic">
                          "{fusionHypothesis}"
                        </p>
                      </div>
                      {fusionResult?.audio_url && (
                        <audio controls src={fusionResult.audio_url} className="w-full mt-2" />
                      )}
                    </div>
                    <div className="flex gap-4">
                      {fusionResult?.audio_url && (
                        <a href={fusionResult.audio_url} download className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-colors">Download</a>
                      )}
                      <button className="px-6 py-2.5 bg-velvet-purple/20 border border-velvet-purple/30 rounded-full text-[10px] font-bold uppercase tracking-widest text-velvet-purple hover:bg-velvet-purple/30 transition-colors">Mint DNA</button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="active"
                    className="w-full h-full flex flex-col items-center justify-center relative"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            rotate: 360,
                            scale: [1, 1.1, 1],
                            opacity: [0.1, 0.3, 0.1]
                          }}
                          transition={{ 
                            duration: 10 + i * 5, 
                            repeat: Infinity, 
                            ease: "linear" 
                          }}
                          className={`absolute border border-velvet-purple/30 rounded-full`}
                          style={{ width: 200 + i * 100, height: 200 + i * 100 }}
                        />
                      ))}
                    </div>
                    
                    <div className="relative z-10 flex flex-col items-center gap-8">
                      <div className="flex items-center gap-12">
                        <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl"
                        >
                          <Waves className="w-8 h-8 text-blue-400" />
                        </motion.div>
                        <div className="w-12 h-[1px] bg-gradient-to-r from-blue-400 via-velvet-purple to-indigo-400" />
                        <motion.div 
                          animate={{ y: [0, 10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                          className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl"
                        >
                          <Zap className="w-8 h-8 text-indigo-400" />
                        </motion.div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-mono text-velvet-purple uppercase tracking-[0.5em] animate-pulse">
                          {fusionState === 'dissecting' ? 'Dissecting Primitives' : 'Aligning Harmonics'}
                        </span>
                        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-full h-full bg-gradient-to-r from-transparent via-velvet-purple to-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Visualizer Footer */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 px-8 py-3 bg-black/40 border border-white/5 rounded-full backdrop-blur-xl z-30">
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-mono text-slate-600 uppercase">Phase</span>
                <span className="text-[10px] font-mono text-slate-300">0.0°</span>
              </div>
              <div className="w-[1px] h-4 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-mono text-slate-600 uppercase">Resonance</span>
                <span className="text-[10px] font-mono text-slate-300">0.994</span>
              </div>
              <div className="w-[1px] h-4 bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-mono text-slate-600 uppercase">Entropy</span>
                <span className="text-[10px] font-mono text-slate-300">Minimal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto relative z-10">
        {fusionError && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-mono">{fusionError}</div>
        )}
        <button
          onClick={executeFusion}
          disabled={isFusing || fusionState === 'complete'}
          className={`w-full py-6 rounded-2xl text-xs font-bold tracking-[0.4em] uppercase transition-all flex items-center justify-center gap-4 relative overflow-hidden group/btn ${
            fusionState === 'complete'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-velvet-purple hover:bg-velvet-purple/90 text-white shadow-[0_20px_40px_-10px_rgba(124,58,237,0.4)] disabled:opacity-50'
          }`}
        >
          {isFusing ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Colliding Primitives...</>
          ) : fusionState === 'complete' ? (
            <><CheckCircle2 className="w-5 h-5" /> Synthesis Finalized</>
          ) : (
            <><Activity className="w-5 h-5" /> Force Metamorphic Collision</>
          )}
        </button>
      </div>
    </div>
  );
}
