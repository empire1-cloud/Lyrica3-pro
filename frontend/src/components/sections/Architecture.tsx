import { motion } from 'framer-motion';
import { Network, Server, Cpu, Layers, Code2, Workflow, Zap, ArrowRight, Box, Hexagon, Database, Globe } from 'lucide-react';

export default function Architecture() {
  return (
    <div className="space-y-16 pb-20 max-w-6xl mx-auto">
      <header className="space-y-6">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-velvet-purple/10 border border-velvet-purple/20 text-velvet-purple text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
          <Network className="w-3.5 h-3.5" />
          <span>Phase V: Architectural Blueprint</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-serif font-bold italic text-white tracking-tight leading-tight">
          System <span className="premium-gradient-text">Interdependencies</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-3xl leading-relaxed font-serif italic">
          Conceptual API structures and AI model interdependencies that power the Soulfire ecosystem.
        </p>
      </header>

      {/* Surpassing the Baseline Section */}
      <section className="bg-obsidian-900/40 border border-white/5 rounded-[3rem] p-10 md:p-16 relative overflow-hidden group backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-velvet-purple/5 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-velvet-purple/10 transition-colors duration-1000" />
        <div className="architectural-grid absolute inset-0 opacity-[0.03] pointer-events-none" />
        
        <div className="flex items-center gap-6 mb-12 relative z-10">
          <div className="p-4 bg-velvet-purple/10 rounded-2xl border border-velvet-purple/20 shadow-2xl shadow-velvet-purple/10">
            <Zap className="w-8 h-8 text-velvet-purple" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold italic text-white tracking-tight">Surpassing the Baseline</h2>
            <p className="micro-label !text-slate-500 mt-1">Evolutionary Leap in Generative Audio</p>
          </div>
        </div>
        
        <p className="text-xl text-slate-400 mb-16 max-w-4xl relative z-10 leading-relaxed font-serif italic border-l-2 border-velvet-purple/30 pl-8">
          How the Lyrica 3 Pro architecture completely eclipses standard open-source and commercial stacks by moving from static generation to dynamic, emotionally-aware synthesis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {[
            {
              old: 'HeartMuLa-7B',
              new: 'Aura-Core 12B',
              title: 'The Empathic Brain',
              desc: 'Standard models only understand music theory and lyrics. Aura-Core 12B understands somatic emotional grammar. It comprehends "bruised subtext" and the irony of sad lyrics over bright progressions.',
              icon: Hexagon
            },
            {
              old: 'Ace Step 1.5',
              new: 'EMSS Weaver',
              title: 'Decoupled Styling',
              desc: 'Instead of static genre fine-tunes, the EMSS Weaver treats rhythm, melody, and emotion as separate layers. It procedurally applies "Late-Pocket Drums" and "Warm Analog Textures" across any genre.',
              icon: Box
            },
            {
              old: 'HeartCodec',
              new: 'Resonance-X',
              title: 'Multi-Stem & Biometric Math',
              desc: 'Beyond basic 48kHz stereo, Resonance-X natively generates separated stems while embedding DNA watermarks, biometric artifacts, and dynamic spatial proximity.',
              icon: Database
            },
            {
              old: 'HeartMuLa Studio',
              new: 'Sonance Pro',
              title: 'The Two-Sided Ecosystem',
              desc: 'Replaces a basic "Suno clone" UI with a dual-threat platform: granular biometric control for professionals (Sonance Pro) and a frictionless, viral "Vibe Bar" for consumers.',
              icon: Globe
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -5 }}
              className="bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-[2rem] p-10 flex flex-col hover:border-velvet-purple/30 transition-all group/card relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover/card:opacity-[0.08] transition-opacity">
                <item.icon className="w-24 h-24 text-velvet-purple" />
              </div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="text-[10px] font-mono text-slate-600 line-through decoration-red-500/50 uppercase tracking-[0.2em]">{item.old}</div>
                <div className="flex items-center gap-3">
                  <div className="h-[1px] w-12 bg-velvet-purple/30" />
                  <ArrowRight className="w-4 h-4 text-velvet-purple" />
                </div>
                <div className="text-[10px] font-mono text-velvet-purple font-bold uppercase tracking-[0.2em]">{item.new}</div>
              </div>
              <h3 className="text-2xl font-serif font-bold italic text-white mb-4 tracking-tight group-hover/card:text-velvet-purple transition-colors">{item.title}</h3>
              <p className="text-slate-400 leading-relaxed font-serif italic text-lg">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Model Interdependencies */}
      <section className="glass-card p-10 md:p-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-velvet-purple/50 to-transparent" />
        
        <div className="flex items-center gap-6 mb-16">
          <div className="p-4 bg-velvet-purple/10 rounded-2xl border border-velvet-purple/20">
            <Workflow className="w-8 h-8 text-velvet-purple" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold italic text-white tracking-tight">AI Model Pipeline</h2>
            <p className="micro-label !text-slate-500 mt-1">Sequential Synthesis Logic</p>
          </div>
        </div>
        
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute left-10 top-16 bottom-16 w-[1px] bg-gradient-to-b from-velvet-purple/50 via-fuchsia-500/50 to-velvet-purple/50 hidden md:block" />

          <div className="space-y-16">
            {[
              {
                step: '01',
                icon: Cpu,
                title: 'NLP Intent Parsing (Vibe Bar)',
                desc: 'Translates natural language into structured JSON payloads for the EMSS Composer.',
                code: `{
  "intent": "late_night_drive",
  "emotion": "mutual_breakup_acceptance",
  "style_reference": "90s_rnb_duo"
}`
              },
              {
                step: '02',
                icon: Layers,
                title: 'EMSS Composer (Creative Director)',
                desc: 'Hybrid Neural-Symbolic Affective Engine maps qualitative intent to quantitative musical parameters.',
                features: [
                  { label: 'Lyrical Ghostwriter', desc: 'Applies "Cracks Rule" & Vocab Filter for maximum emotional resonance.' },
                  { label: 'Arrangement Engine', desc: 'Juxtaposition Logic (Sad lyrics + Bright chords) for complex moods.' }
                ]
              },
              {
                step: '03',
                icon: Server,
                title: 'Rendering & Biometric Artifacts',
                desc: 'Duo-Soul Engine generates vocals. Biometric Artifact Engine applies human-centric flaws.',
                tags: ['Adaptive Inhale', 'Vocal Fry', '48kHz/24-bit Output']
              }
            ].map((item, i) => (
              <div key={i} className="relative flex flex-col md:flex-row gap-10 items-start group">
                <div className="hidden md:flex w-20 h-20 shrink-0 rounded-3xl bg-obsidian-950 border border-white/10 items-center justify-center z-10 relative group-hover:border-velvet-purple/50 transition-colors shadow-2xl">
                  <item.icon className="w-8 h-8 text-slate-500 group-hover:text-velvet-purple transition-colors" />
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-velvet-purple rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-velvet-purple/20">
                    {item.step}
                  </div>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-md border border-white/5 p-10 rounded-[2.5rem] flex-1 w-full hover:border-velvet-purple/20 transition-all group-hover:bg-white/[0.04]">
                  <h3 className="text-2xl font-serif font-bold italic text-white mb-4 tracking-tight">{item.title}</h3>
                  <p className="text-slate-400 mb-8 leading-relaxed font-serif italic text-lg">{item.desc}</p>
                  
                  {item.code && (
                    <div className="bg-black/60 p-8 rounded-3xl font-mono text-[11px] text-velvet-purple/60 overflow-x-auto border border-white/5 shadow-inner relative group/code">
                      <div className="absolute top-4 right-4 micro-label !text-slate-700">JSON Payload</div>
                      <pre>{item.code}</pre>
                    </div>
                  )}

                  {item.features && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {item.features.map((f, fi) => (
                        <div key={fi} className="bg-black/40 p-6 rounded-2xl border border-white/5 group/item hover:border-velvet-purple/20 transition-all">
                          <div className="micro-label !text-velvet-purple mb-3">{f.label}</div>
                          <div className="text-sm text-slate-500 leading-relaxed font-serif italic">{f.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.tags && (
                    <div className="flex flex-wrap gap-3">
                      {item.tags.map((tag, ti) => (
                        <span key={ti} className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${tag.includes('Output') ? 'bg-velvet-purple/10 border border-velvet-purple/20 text-velvet-purple shadow-lg shadow-velvet-purple/10' : 'bg-white/5 border border-white/10 text-slate-500'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conceptual APIs */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[
          {
            title: 'Sonance Pro API',
            icon: Code2,
            color: 'velvet-purple',
            endpoints: [
              { method: 'POST', path: '/v1/studio/generate', desc: 'Payload requires explicit parameter mapping for EMSS, Biometrics, and Duo-Soul scripting.' },
              { method: 'PATCH', path: '/v1/studio/biometrics', desc: 'Real-time adjustment of breath_intensity, vocal_fry_saturation, emotional_break_freq.' }
            ]
          },
          {
            title: 'SL Universal API',
            icon: Code2,
            color: 'indigo-500',
            endpoints: [
              { method: 'POST', path: '/v1/universal/vibe', desc: 'Accepts natural language string. Returns streaming audio URL and dynamic mood board metadata.' },
              { method: 'POST', path: '/v1/universal/flip', desc: 'Accepts source asset_id and mutation instructions. Triggers Lane 01 billing event.' }
            ]
          }
        ].map((api, i) => (
          <div key={i} className="glass-card p-10 md:p-12 group/api relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full bg-${api.color}`} />
            <div className="flex items-center gap-6 mb-10">
              <div className={`p-4 bg-${api.color}/10 rounded-2xl border border-${api.color}/20 group-hover/api:border-${api.color}/40 transition-colors`}>
                <api.icon className={`w-8 h-8 text-${api.color}`} />
              </div>
              <h3 className="text-2xl font-serif font-bold italic text-white tracking-tight">{api.title}</h3>
            </div>
            <div className="space-y-6 font-mono text-sm">
              {api.endpoints.map((ep, ei) => (
                <div key={ei} className="bg-black/50 p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group/ep">
                  <div className={`text-${api.color} mb-3 font-bold flex items-center gap-3`}>
                    <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px]">{ep.method}</span>
                    <span className="text-xs">{ep.path}</span>
                  </div>
                  <div className="text-slate-500 text-xs leading-relaxed font-serif italic">
                    {ep.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
