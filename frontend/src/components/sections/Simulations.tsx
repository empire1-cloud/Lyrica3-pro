import { motion } from 'framer-motion';
import { PlayCircle, Search, Cpu, Layers, Mic2, Activity, ShieldAlert, Wand2, Music, Fingerprint, AlertTriangle, Terminal, Zap, Sparkles } from 'lucide-react';

export default function Simulations() {
  return (
    <div className="space-y-16 pb-20 max-w-6xl mx-auto">
      <header className="space-y-6">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-velvet-purple/10 border border-velvet-purple/20 text-velvet-purple text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Live Simulation Logs</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-serif font-bold italic text-white tracking-tight leading-tight">
          System <span className="premium-gradient-text">Execution</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-3xl leading-relaxed font-serif italic">
          Real-time logs demonstrating the Agentic Quartet processing complex, cross-genre, and ethically sensitive prompts.
        </p>
      </header>

      {/* SIMULATION 1: The Bachata-Corrido & VICS/CCNA Intervention */}
      <section className="bg-obsidian-900/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl group">
        <div className="bg-white/[0.02] border-b border-white/5 p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <h2 className="text-xl font-serif font-bold italic text-white tracking-tight">SIM_01: "Rosas de Plomo"</h2>
          </div>
          <div className="micro-label !text-slate-600">Active Thread: 0x8f9b...2c4a</div>
        </div>
        
        <div className="p-10 space-y-12">
          {/* User Prompt */}
          <div className="relative">
            <div className="micro-label !text-slate-500 mb-4 flex items-center gap-2">
              <Terminal className="w-3 h-3" /> USER_INPUT
            </div>
            <div className="bg-black/60 border border-white/5 rounded-3xl p-8 text-slate-200 text-xl font-serif italic leading-relaxed shadow-inner">
              "An oldie lyric type of corrido with a mix of Chalino Sanchez and Aventura."
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* VICS Intervention */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-10 bg-velvet-purple/[0.02] border border-velvet-purple/10 rounded-[2.5rem] space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                <ShieldAlert className="w-16 h-16 text-velvet-purple" />
              </div>
              <div className="flex items-center gap-3 text-velvet-purple relative z-10">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-lg font-serif font-bold italic">VICS: Secure Consent Management</h3>
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex items-start gap-4 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                  <p className="text-sm text-slate-400 leading-relaxed">
                    <strong className="text-amber-500/80">Direct Cloning Blocked:</strong> Explicit cryptographic consent not found for "Chalino Sanchez" (Estate Rights) or "Aventura" (Active Copyright).
                  </p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-velvet-purple/5 border border-velvet-purple/10 rounded-2xl">
                  <Fingerprint className="w-4 h-4 text-velvet-purple shrink-0 mt-1" />
                  <p className="text-sm text-slate-400 leading-relaxed">
                    <strong className="text-velvet-purple/80">Persona Cultivation Initiated:</strong> Generating legally compliant hybrid persona. Enforcing 30% biometric departure from source DNA.
                  </p>
                </div>
                <div className="pt-4 font-mono text-[10px] text-velvet-purple/40 border-t border-white/5">
                  [LOG] Cryptographic ledger updated. Hybrid Persona ID: #H-882A generated.
                </div>
              </div>
            </motion.div>

            {/* CCNA Intervention */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-10 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-[2.5rem] space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                <Layers className="w-16 h-16 text-indigo-500" />
              </div>
              <div className="flex items-center gap-3 text-indigo-400 relative z-10">
                <Layers className="w-5 h-5" />
                <h3 className="text-lg font-serif font-bold italic">CCNA: Ethical Gradient Refinement</h3>
              </div>
              <div className="space-y-6 relative z-10">
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <p className="text-sm text-slate-400 leading-relaxed">
                    <strong className="text-indigo-400/80">Analysis:</strong> Prompt implies Chalino's "veiled violence" mixed with Aventura's "dramatic heartbreak."
                  </p>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-serif italic">
                  Amplifying the <span className="text-indigo-400 font-bold">"bright chords, bruised subtext"</span> principle. The narrative's tragic elements will be subtly hinted at within a seemingly romantic context. No explicit violence; only the *shadow* of it.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Generated Output */}
          <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
            <div className="architectural-grid absolute inset-0 opacity-[0.02] pointer-events-none" />
            <div className="flex items-center gap-4 text-velvet-purple mb-10 relative z-10">
              <div className="p-3 bg-velvet-purple/10 rounded-xl border border-velvet-purple/20">
                <Music className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-serif font-bold italic text-white tracking-tight">Generated Blueprint: "Rosas de Plomo"</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
              <div className="lg:col-span-4 space-y-8">
                <div>
                  <h4 className="micro-label !text-slate-600 mb-4">Instrumentation</h4>
                  <ul className="space-y-4">
                    {[
                      { label: 'Rhythm', desc: 'Bachata bongo/güira syncopation with a late-pocket 6/8 waltz swing.' },
                      { label: 'Bass', desc: 'Traditional Tuba mimicking melodic walking bass.' },
                      { label: 'Leads', desc: 'Dueling raw accordion and chorus-drenched acoustic requinto.' }
                    ].map((item, i) => (
                      <li key={i} className="flex gap-4">
                        <div className="w-1 h-1 rounded-full bg-velvet-purple mt-2 shrink-0" />
                        <p className="text-sm text-slate-400 leading-relaxed"><strong className="text-slate-200">{item.label}:</strong> {item.desc}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-8">
                <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                  <h4 className="micro-label !text-slate-600 mb-6">Lyrical Snippet (CCNA Refined)</h4>
                  <div className="space-y-6">
                    <p className="text-2xl font-serif italic text-white leading-relaxed">
                      "Me trajo flores a la ventana, pero olían a pólvora y despedida..."
                    </p>
                    <p className="text-sm text-slate-500 font-serif italic">
                      (He brought flowers to my window, but they smelled of gunpowder and farewell...)
                    </p>
                    <div className="h-[1px] w-20 bg-white/10" />
                    <p className="text-2xl font-serif italic text-white leading-relaxed">
                      "Un beso suave, un trato hecho, el llanto se ahoga en el pecho..."
                    </p>
                    <p className="text-sm text-slate-500 font-serif italic">
                      (A soft kiss, a deal made, the weeping drowns in the chest...)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIMULATION 2: S2 Novel Fusion */}
      <section className="bg-obsidian-900/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl group">
        <div className="bg-white/[0.02] border-b border-white/5 p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            <h2 className="text-xl font-serif font-bold italic text-white tracking-tight">SIM_02: S2 Serendipity Synthesizer</h2>
          </div>
          <div className="micro-label !text-slate-600">Cross-Pollinator Core: v2.1</div>
        </div>
        
        <div className="p-10 space-y-10">
          <div className="flex items-center gap-4 text-velvet-purple mb-2">
            <div className="p-3 bg-velvet-purple/10 rounded-xl border border-velvet-purple/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-serif font-bold italic text-white">Metamorphic Blending Logic</h3>
          </div>
          <p className="text-slate-400 text-lg leading-relaxed font-serif italic max-w-4xl">
            S2 analyzes the requested primitives (Chalino's stoic narrative/brass + Aventura's melodramatic romance/syncopation) and injects a disparate genre to create a novel blueprint.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Fusion Hypothesis',
                desc: 'The cyclical, metallic trance of Javanese Gamelan fused with the stoic, tragic narrative of a Corrido, delivered via breathy, melodramatic R&B falsettos over massive ambient electronic sub-bass.'
              },
              {
                title: 'Lyrical Directive',
                desc: 'Frame existential tragedy as a cyclical, inescapable fate. Use Chicano Oldies slang but structure the verses like minimalist, repeating mantras. The "bruised subtext" should feel cosmic.'
              },
              {
                title: 'Vocal Performance',
                desc: 'Utilize Aventura\'s high-drama falsetto, but strip away the R&B melisma. Sing with Chalino\'s rigid, unyielding, almost spoken-word pacing. Apply heavy, cavernous ambient reverb.'
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-4 hover:border-velvet-purple/20 transition-all"
              >
                <div className="micro-label !text-velvet-purple">{item.title}</div>
                <p className="text-slate-400 leading-relaxed font-serif italic text-sm">
                  "{item.desc}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULATION 3: The Infinite Palette */}
      <section className="bg-obsidian-900/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl group">
        <div className="bg-white/[0.02] border-b border-white/5 p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-velvet-purple animate-pulse shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            <h2 className="text-xl font-serif font-bold italic text-white tracking-tight">SIM_03: The Infinite Palette</h2>
          </div>
          <div className="micro-label !text-slate-600">Stress Test: Multi-Genre Fusion</div>
        </div>
        
        <div className="p-10">
          <p className="text-slate-400 text-lg leading-relaxed font-serif italic mb-12 max-w-4xl">
            Demonstrating the system's capacity to process and fuse a wide, contradictory variety of requested artists, genres, and regional styles into cohesive outputs.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'The Nu-Metal Diva',
                vocals: 'Mariah Carey (Whistle Reg.)',
                music: 'System of a Down (Alt-Metal)',
                lyrics: '90s Hip Hop Flow',
                desc: 'Frantic, drop-tuned guitar riffs punctuated by flawless, five-octave melismatic rap verses.'
              },
              {
                title: 'The Talkbox Cowboy',
                vocals: 'Keith Sweat (Begging R&B)',
                music: 'Darius Rucker (Rap Country)',
                texture: 'Zapp (Talkbox Funk)',
                desc: 'Acoustic country strumming over an 808 beat, with pleading R&B vocals harmonized through a heavy funk talkbox.'
              },
              {
                title: 'El Monte Sweet Soul',
                vocals: 'Barbara Mason (Spoken Soul)',
                delivery: '2Pac (Aggressive Passion)',
                aesthetic: 'ShadyBoy (Chicano Rap)',
                desc: 'Sweet 70s soul instrumentation interrupted by aggressive, passionate spoken-word interludes dripping with street slang.'
              }
            ].map((blend, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group/card hover:border-velvet-purple/30 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-velvet-purple/[0.03] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                <h3 className="text-xl font-serif font-bold italic text-white mb-8 relative z-10 group-hover/card:text-velvet-purple transition-colors">{blend.title}</h3>
                <div className="space-y-4 relative z-10">
                  {Object.entries(blend).map(([key, value]) => {
                    if (key === 'title' || key === 'desc') return null;
                    return (
                      <div key={key} className="flex items-center justify-between border-b border-white/5 pb-3">
                        <span className="micro-label !text-slate-600 capitalize">{key}</span>
                        <span className="text-xs font-serif italic text-slate-300">{value}</span>
                      </div>
                    );
                  })}
                  <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-sm text-slate-500 font-serif italic leading-relaxed">
                      "{blend.desc}"
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
