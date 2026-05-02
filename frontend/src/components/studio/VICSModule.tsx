import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Fingerprint, Link as LinkIcon, Coins, Sliders, Sparkles, AlertCircle, CheckCircle2, Terminal, Download, Zap, Shield, Lock, Activity } from 'lucide-react';

interface ArtistConsent {
  id: string;
  name: string;
  type: 'Estate' | 'Direct';
  status: 'Pending' | 'Verified' | 'Denied';
  smartContract: string | null;
  ledgerHash: string | null;
  royaltySplit: number;
}

const INITIAL_CONSENTS: ArtistConsent[] = [
  {
    id: 'chalino',
    name: 'Chalino Sanchez',
    type: 'Estate',
    status: 'Verified',
    smartContract: '0x8f9b...2c4a',
    ledgerHash: 'e1_hash_9a8b7c6d5',
    royaltySplit: 50,
  },
  {
    id: 'ramon',
    name: 'Ramon Ayala',
    type: 'Direct',
    status: 'Verified',
    smartContract: '0x3d2e...f1a9',
    ledgerHash: 'e1_hash_1b2c3d4e5',
    royaltySplit: 50,
  }
];

export default function VICSModule() {
  const [consents, setConsents] = useState<ArtistConsent[]>(INITIAL_CONSENTS);
  const [dnaGrit, setDnaGrit] = useState(85);
  const [dnaMelodic, setDnaMelodic] = useState(70);
  const [dnaVulnerability, setDnaVulnerability] = useState(88);
  const [isRefining, setIsRefining] = useState(false);
  const [isGeneratingStems, setIsGeneratingStems] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString([], { hour12: false })}] ${msg}`]);
  };

  const handleRefineLyrics = () => {
    setIsRefining(true);
    addLog("CCNA Directive: Engaging Ethical Gradient Facilitator...");
    setTimeout(() => {
      addLog("↳ Analyzing subtext: 'stoic_acceptance_of_fate'");
      addLog("↳ Applying 'Bright Chords, Bruised Subtext' principle...");
      addLog("↳ Status: Lyrical subtext refined. Veiled violence levels: OPTIMIZED.");
      setIsRefining(false);
    }, 1500);
  };

  const handleTriggerMSGO = () => {
    setIsGeneratingStems(true);
    setLog([]);
    addLog("VICS Protocol: Initiating MSGO Full Track Render...");
    setTimeout(() => addLog("↳ Verifying VICS Consent Ledgers... [OK]"), 500);
    setTimeout(() => addLog("↳ Initializing Psychoacoustic Texture Modeler..."), 1000);
    setTimeout(() => addLog("↳ Applying Micro-Rhythmic Groove Sculptor (6/8 Waltz)..."), 1500);
    setTimeout(() => addLog("↳ Compiling Stems: Tuba, Accordion, Bajo Sexto, Vocals..."), 2000);
    setTimeout(() => {
      addLog("↳ SUCCESS: 48kHz/24-bit Stems Generated.");
      addLog("↳ SynthID Minted: trk_omega_9a8b7c6d5");
      setIsGeneratingStems(false);
    }, 3000);
  };

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Header Rail */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-obsidian-900/40 border border-white/5 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-velvet-purple/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-velvet-purple/10 border border-velvet-purple/20 flex items-center justify-center shadow-2xl shadow-velvet-purple/10 group-hover:scale-110 transition-transform duration-500">
            <ShieldCheck className="w-8 h-8 text-velvet-purple" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold italic text-white tracking-tight">VICS Command Center</h2>
            <p className="micro-label !text-slate-500 mt-1">Vocal Identity & Consent Steward • v4.2.0-Alpha</p>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Protocol Active</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Latent Sync: 99.8%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Secure Consent Management */}
        <div className="lg:col-span-8 space-y-8">
          <section className="glass-card p-10 space-y-8 border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-velvet-purple" />
                <h3 className="text-xl font-serif font-bold italic text-white">Secure Consent Management</h3>
              </div>
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-white/10" />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {consents.map((artist) => (
                <motion.div 
                  key={artist.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.05] hover:border-velvet-purple/20 transition-all group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-velvet-purple to-indigo-900 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <span className="text-xl font-serif font-bold italic text-white">{artist.name[0]}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-serif font-bold italic text-white group-hover:text-velvet-purple transition-colors">{artist.name}</h4>
                        <p className="micro-label !text-slate-500 mt-1">{artist.type} Consent Required</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      artist.status === 'Verified' ? 'bg-emerald-500/5 text-emerald-500 border border-emerald-500/10' : 'bg-amber-500/5 text-amber-500 border border-amber-500/10'
                    }`}>
                      {artist.status === 'Verified' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {artist.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                    <div className="space-y-2">
                      <p className="micro-label !text-slate-600 flex items-center gap-2">
                        <LinkIcon className="w-3 h-3" /> Smart Contract
                      </p>
                      <p className="text-[10px] font-mono text-indigo-400/80 truncate">{artist.smartContract || 'Pending...'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="micro-label !text-slate-600 flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> Ledger Hash
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">{artist.ledgerHash || 'Pending...'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="micro-label !text-slate-600 flex items-center gap-2">
                        <Coins className="w-3 h-3" /> Royalty Split
                      </p>
                      <p className="text-[10px] font-mono text-emerald-500/80">{artist.royaltySplit}% Micro-Royalty</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <button className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-velvet-purple hover:border-velvet-purple/30 transition-all flex items-center justify-center gap-3 group">
              <Zap className="w-4 h-4 group-hover:animate-pulse" />
              Initiate New Cryptographic Outreach
            </button>
          </section>

          {/* CCNA Facilitator Section */}
          <section className="p-10 bg-gradient-to-br from-velvet-purple/[0.03] to-transparent border border-white/5 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
              <Sparkles className="w-32 h-32 text-velvet-purple" />
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-velvet-purple/10 rounded-xl border border-velvet-purple/20">
                  <Sparkles className="w-5 h-5 text-velvet-purple" />
                </div>
                <h3 className="text-xl font-serif font-bold italic text-white">Ethical Gradient Facilitator</h3>
              </div>
              <button 
                onClick={handleRefineLyrics}
                disabled={isRefining}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-500 ${isRefining ? 'bg-white/5 text-slate-600' : 'bg-velvet-purple text-white shadow-lg shadow-velvet-purple/20 hover:shadow-velvet-purple/40'}`}
              >
                {isRefining ? 'Refining...' : 'Refine Lyrical Subtext'}
              </button>
            </div>

            <div className="bg-black/40 rounded-3xl p-8 border border-white/5 font-serif italic text-lg leading-relaxed relative z-10">
              <p className="text-slate-400">"Focus on amplifying the <span className="text-velvet-purple">'bright chords, bruised subtext'</span> principle by ensuring the narrative's tragic elements are subtly hinted at through stoic acceptance..."</p>
              <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="micro-label !text-slate-600 mb-1">Target</p>
                  <p className="text-xs text-slate-400 font-bold">Chalino x Ramon</p>
                </div>
                <div>
                  <p className="micro-label !text-slate-600 mb-1">Directive</p>
                  <p className="text-xs text-slate-400 font-bold">Stoic Acceptance</p>
                </div>
                <div>
                  <p className="micro-label !text-slate-600 mb-1">Status</p>
                  <p className={`text-xs font-bold ${isRefining ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
                    {isRefining ? 'Processing...' : 'Ready for Synthesis'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Persona Cultivation & MSGO */}
        <div className="lg:col-span-4 space-y-8">
          <section className="glass-card p-10 space-y-10 border-white/10 flex flex-col h-full">
            <div className="flex items-center gap-3">
              <Sliders className="w-5 h-5 text-velvet-purple" />
              <h3 className="text-xl font-serif font-bold italic text-white">Persona Cultivation</h3>
            </div>

            <div className="space-y-10 flex-1">
              {[
                { label: 'Chalino Grit', value: dnaGrit, setter: setDnaGrit },
                { label: 'Ramon Phrasing', value: dnaMelodic, setter: setDnaMelodic },
                { label: 'Vulnerability', value: dnaVulnerability, setter: setDnaVulnerability }
              ].map((slider, i) => (
                <div key={i} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="micro-label !text-slate-500">{slider.label}</label>
                    <span className="text-[10px] font-mono text-velvet-purple font-bold">{slider.value}%</span>
                  </div>
                  <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-velvet-purple to-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${slider.value}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    <input 
                      type="range" 
                      min="0" max="100" 
                      value={slider.value} 
                      onChange={(e) => slider.setter(parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>
                </div>
              ))}

              <div className="pt-8 border-t border-white/5 space-y-6">
                <h4 className="micro-label !text-slate-600">Biometric Artifacts</h4>
                <div className="flex flex-wrap gap-2">
                  {['<raw_vocal_break>', '<heavy_inhale>', '<glottal_stop>', '<stoic_exhale>'].map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-mono text-slate-400 hover:text-velvet-purple hover:border-velvet-purple/30 transition-colors cursor-default">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 space-y-4">
              <button 
                onClick={handleTriggerMSGO}
                disabled={isGeneratingStems}
                className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] transition-all duration-500 flex items-center justify-center gap-3 ${isGeneratingStems ? 'bg-white/5 text-slate-600' : 'bg-gradient-to-r from-velvet-purple to-indigo-600 text-white shadow-2xl shadow-velvet-purple/20 hover:shadow-velvet-purple/40'}`}
              >
                {isGeneratingStems ? (
                  <>
                    <Terminal className="w-4 h-4 animate-pulse" />
                    Compiling Stems...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Trigger MSGO Render
                  </>
                )}
              </button>

              <AnimatePresence>
                {log.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-black/60 rounded-2xl border border-white/5 p-6 font-mono text-[9px] overflow-hidden"
                  >
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {log.map((line, i) => (
                        <div key={i} className={line.includes('SUCCESS') ? 'text-emerald-400' : 'text-slate-600'}>
                          {line}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!isGeneratingStems && log.some(l => l.includes('SUCCESS')) && (
                <button className="w-full py-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-emerald-500 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-3">
                  <Download className="w-4 h-4" /> Download Stems
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
