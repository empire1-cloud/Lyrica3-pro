import { motion } from 'framer-motion';
import { Sparkles, HeartCrack, Clock, Waves, Mic, Smile, Shield, Zap, Target, ArrowDownRight, Fingerprint, Eye, Globe } from 'lucide-react';

export default function Vision() {
  const principles = [
    {
      icon: HeartCrack,
      title: "Bright Chords, Bruised Subtext",
      description: "Musical irony where the music feels like a hug, but the lyrics feel like a bruise."
    },
    {
      icon: Clock,
      title: "Late-Pocket Drums",
      description: "A 'lazy' swing, dragging elements slightly behind the beat for a distinct, organic feel."
    },
    {
      icon: Waves,
      title: "Warm Analog Textures",
      description: "Prioritizing rich, saturated sounds over clean digital tones."
    },
    {
      icon: Mic,
      title: "Internalized Vocal Delivery",
      description: "Creating an intimate, internal sound, as if the singer is performing for themselves."
    },
    {
      icon: Smile,
      title: "Playful Masking of Sadness",
      description: "Subtextual emotional delivery over literal expression, utilizing an 'audibly cracking smile.'"
    },
    {
      icon: Target,
      title: "Surgical Fusion",
      description: "Treating rhythm, melody, and tone as separate, combinable layers of emotional DNA."
    }
  ];

  return (
    <div className="space-y-32 pb-32 max-w-6xl mx-auto">
      {/* Hero Section */}
      <header className="relative pt-20">
        <div className="architectural-grid absolute inset-0 opacity-[0.03] pointer-events-none" />
        
        <div className="space-y-10 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="h-[1px] w-16 bg-velvet-purple/50" />
            <span className="micro-label !text-velvet-purple tracking-[0.3em]">Phase I: Core Vision</span>
          </motion.div>
          
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-7xl md:text-9xl font-serif font-bold italic tracking-tighter text-white leading-[0.85]"
            >
              The <span className="premium-gradient-text">Soulfire</span> <br/> 
              <span className="text-slate-400">Ecosystem</span>
            </motion.h1>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-12 items-start"
          >
            <p className="text-2xl text-slate-500 max-w-2xl leading-relaxed font-serif italic">
              Transcending generic AI generation. Soulfire represents an emotional dialect, not a genre stereotype. We map the geometry of heartbreak onto the architecture of modern rhythm.
            </p>
            <div className="hidden md:block h-32 w-[1px] bg-white/10" />
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-velvet-purple">
                <Target className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Objective</span>
              </div>
              <p className="text-sm text-slate-600 font-serif italic max-w-[200px]">
                Establishing the definitive standard for emotionally-aware sonic synthesis.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Decorative Element */}
        <div className="absolute top-0 right-0 w-1/2 aspect-square bg-velvet-purple/5 blur-[160px] rounded-full -z-10 animate-pulse" />
      </header>

      {/* Characteristics Grid */}
      <section className="space-y-16">
        <div className="flex items-end justify-between border-b border-white/5 pb-8">
          <div className="space-y-2">
            <h2 className="micro-label !text-slate-600">Defining Characteristics</h2>
            <p className="text-2xl font-serif font-bold italic text-white">The Six Pillars of Soulfire</p>
          </div>
          <div className="flex gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-velvet-purple/30" />
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {principles.map((principle, idx) => {
            const Icon = principle.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -10 }}
                className="bg-obsidian-900/40 border border-white/5 p-12 rounded-[2.5rem] group hover:border-velvet-purple/30 transition-all duration-500 backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                  <Icon className="w-24 h-24 text-velvet-purple" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-velvet-purple/10 transition-all border border-white/5 group-hover:border-velvet-purple/20 relative z-10">
                  <Icon className="w-6 h-6 text-slate-400 group-hover:text-velvet-purple transition-colors" />
                </div>
                <h3 className="text-xl font-serif font-bold italic text-white mb-4 tracking-tight group-hover:text-velvet-purple transition-colors relative z-10">{principle.title}</h3>
                <p className="text-slate-500 leading-relaxed font-serif italic group-hover:text-slate-400 transition-colors relative z-10">{principle.description}</p>
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-velvet-purple/60">Core Principle</span>
                  <ArrowDownRight className="w-4 h-4 text-velvet-purple" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Constraints & Identity */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-obsidian-900/40 border border-white/5 p-16 rounded-[3.5rem] backdrop-blur-2xl relative overflow-hidden group"
        >
          <div className="architectural-grid absolute inset-0 opacity-[0.02] pointer-events-none" />
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-velvet-purple/10 rounded-xl border border-velvet-purple/20">
                <Globe className="w-5 h-5 text-velvet-purple" />
              </div>
              <h2 className="text-3xl font-serif font-bold italic text-white leading-tight">Genre Agnostic, <br/><span className="premium-gradient-text">Emotionally Rooted</span></h2>
            </div>
            <p className="text-xl text-slate-500 leading-relaxed font-serif italic">
              The system supports a wide variety of genres and their fusion, including but not limited to: 
              <span className="text-slate-300"> R&B, Souldies, Rock, Hip Hop, Pop, Funk, Corridos, and Chicano Soul</span>. 
              It maintains a Chicano-rooted identity, following emotional grammar, not stereotypes.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <div className="px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-all">
                <Shield className="w-4 h-4 text-velvet-purple" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">VICS Verified</span>
              </div>
              <div className="px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-all">
                <Zap className="w-4 h-4 text-indigo-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">S2 Engine</span>
              </div>
              <div className="px-5 py-2.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-all">
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DNA Secured</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-16 bg-black/40 rounded-[3.5rem] border border-white/5 backdrop-blur-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Eye className="w-40 h-40 text-velvet-purple" />
          </div>
          
          <div className="space-y-12 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-2.5 h-2.5 rounded-full bg-velvet-purple shadow-[0_0_15px_rgba(124,58,237,0.6)] animate-pulse" />
              <span className="micro-label tracking-[0.3em]">Critical Constraints</span>
            </div>
            
            <ul className="space-y-8">
              {[
                "DO NOT drift into country or Americana cadence.",
                "DO NOT use choir terminology or classical crooner references.",
                "AVOID neutral, sanitized, or white-coded emotional tone.",
                "PRESERVE slang, subtext, and emotional cracks."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-6 group/item">
                  <div className={`mt-2 w-1.5 h-1.5 rounded-full transition-all duration-500 ${i === 3 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500/30 group-hover/item:bg-red-500/60'}`} />
                  <span className="text-lg text-slate-400 font-serif italic group-hover/item:text-slate-200 transition-colors">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
