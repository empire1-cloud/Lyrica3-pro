import { motion } from 'framer-motion';
import { BrainCircuit, Mic2, ShieldCheck, Globe2, Scale, Sparkles, Activity, Lock, HeartPulse, Sliders, Wand2, Dna, Shuffle, ChevronRight, Target } from 'lucide-react';

export default function Agents() {
  const agents = [
    {
      id: 'ccna',
      title: 'CCNA',
      subtitle: 'Cultural Contextualizer & Narrative Architect',
      description: 'Transforms generic text generation into profound cultural anthropology. Infuses lyrics with genuine depth, intricate narrative arcs, and ethical sensitivity.',
      icon: Globe2,
      color: 'from-velvet-purple to-indigo-600',
      features: [
        { title: 'CCAKB & FCCAN', desc: 'Dynamic knowledge graph mapping cultural semantics and tropes.' },
        { title: 'Ethical Gradient', desc: 'Assigns scores to lyrics to ensure cultural and ethical alignment.' },
        { title: 'Cultural Muse', desc: 'Proactively suggests narrative archetypes and mythological motifs.' }
      ]
    },
    {
      id: 'epd',
      title: 'EPD',
      subtitle: 'Emotive Performance Director',
      description: 'The virtual vocal coach and conductor. Translates annotated lyrics into human-like, emotionally resonant vocal performances.',
      icon: Mic2,
      color: 'from-indigo-600 to-blue-500',
      features: [
        { title: 'AVEN Engine', desc: 'Deep generative model trained on diverse human performances.' },
        { title: 'Metaphor Mapper', desc: 'Translates abstract intent into micro-level vocal parameters.' },
        { title: 'BECPM Protocol', desc: 'Facilitates real-time human-AI physiological improvisation.' }
      ]
    },
    {
      id: 'vics',
      title: 'VICS',
      subtitle: 'Vocal Identity & Consent Steward',
      description: 'The ethical backbone of the Soulfire update. Manages explicit, cryptographic consent for voice cloning and protects vocal identities.',
      icon: ShieldCheck,
      color: 'from-emerald-600 to-teal-500',
      features: [
        { title: 'Secure Consent', desc: 'Cryptographic management of voice cloning permissions.' },
        { title: 'Identity Shield', desc: 'Protects vocal identities from unauthorized replication.' },
        { title: 'Persona Forge', desc: 'Cultivates unique, synthesized AI vocal personas safely.' }
      ]
    },
    {
      id: 's2',
      title: 'S2',
      subtitle: 'Serendipity Synthesizer Module',
      description: 'Overcomes the innovation gap by proposing novel, unexpected artistic directions using disruption heuristics and primitive dissection.',
      icon: Wand2,
      color: 'from-amber-600 to-orange-500',
      features: [
        { title: 'Dissection Engine', desc: 'Extracts granular primitives from vast musical corpuses.' },
        { title: 'Cross-Pollinator', desc: 'Explores distant regions of the latent space via heuristics.' },
        { title: 'Proposal Gen', desc: 'Outputs conceptual blueprints for radical innovation.' }
      ]
    }
  ];

  return (
    <div className="space-y-24 pb-32">
      {/* Hero Section */}
      <header className="relative">
        <div className="space-y-6 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="h-[1px] w-12 bg-velvet-purple/50" />
            <span className="micro-label !text-velvet-purple">The Soulfire Update</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-serif font-bold italic tracking-tighter text-white leading-[0.9]"
          >
            The <span className="premium-gradient-text">Agentic</span> <br/> 
            <span className="text-slate-400">Quartet</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-2xl leading-relaxed font-serif italic"
          >
            Four interconnected AI agents designed to create human-like, culturally sensitive, and radically innovative music. A true creative partnership.
          </motion.p>
        </div>
      </header>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 gap-12">
        {agents.map((agent, idx) => {
          const Icon = agent.icon;
          return (
            <motion.section 
              key={agent.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              className="glass-card p-12 relative overflow-hidden group border-white/10"
            >
              <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-br ${agent.color} opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none`} />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
                {/* Agent Info */}
                <div className="lg:col-span-5 space-y-8">
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-2xl shadow-black/50 group-hover:scale-110 transition-transform duration-500`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h2 className="text-5xl font-serif font-bold italic text-white tracking-tighter">{agent.title}</h2>
                      <p className="micro-label !text-slate-500 mt-2">{agent.subtitle}</p>
                    </div>
                  </div>
                  
                  <p className="text-lg text-slate-400 leading-relaxed font-serif italic">
                    {agent.description}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-velvet-purple" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Node</span>
                    </div>
                    <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optimized</span>
                    </div>
                  </div>
                </div>

                {/* Agent Features */}
                <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agent.features.map((feature, fIdx) => (
                    <div 
                      key={fIdx}
                      className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.05] hover:border-white/10 transition-all group/feature"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">{feature.title}</h3>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover/feature:text-white transition-colors" />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  ))}
                  <div className="p-6 bg-velvet-purple/5 border border-velvet-purple/10 rounded-3xl flex flex-col justify-center items-center text-center space-y-2 group/cta cursor-pointer">
                    <span className="text-[10px] font-bold text-velvet-purple uppercase tracking-widest">Explore Documentation</span>
                    <p className="text-[9px] text-slate-600 font-mono">v4.2.0-Alpha • API Reference</p>
                  </div>
                </div>
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Specialized Sub-Agents */}
      <section className="space-y-12">
        <div className="flex items-center gap-4">
          <div className="h-[1px] w-12 bg-white/10" />
          <h2 className="micro-label">Specialized Sub-Agents</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'SLA', subtitle: 'Subtextual Layering Agent', desc: 'Analyzes literal draft lyrics and suggests poetic devices to embed deeper meaning.' },
            { title: 'PER', subtitle: 'Physiological Emotive Resonator', desc: 'Models involuntary physiological reactions of emotion for extreme human realness.' },
            { title: 'VPCG', subtitle: 'Vocal Provenance Steward', desc: 'Guarantees ethical scaling of voice cloning via cryptographic watermarking.' }
          ].map((sub, i) => (
            <div key={i} className="p-8 bg-black/40 border border-white/5 rounded-[2.5rem] backdrop-blur-xl hover:border-white/10 transition-all">
              <h3 className="text-xl font-serif font-bold italic text-white mb-1">{sub.title}</h3>
              <p className="text-[10px] font-mono text-velvet-purple uppercase tracking-widest mb-4">{sub.subtitle}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{sub.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
