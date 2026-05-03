import { motion } from 'motion/react';
import { Flame, HeartCrack, Clock, Waves, Mic, Smile } from 'lucide-react';

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
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-mono mb-4">
          <Flame className="w-4 h-4" />
          <span>PHASE I: CORE VISION</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Soulfire</span> Ecosystem
        </h1>
        <p className="text-xl text-neutral-400 max-w-3xl leading-relaxed">
          Transcending generic AI generation. Soulfire represents an emotional dialect, not a genre stereotype. It treats rhythm, melody, instrumentation, and emotional tone as separate, combinable layers.
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-8 text-neutral-200 border-b border-neutral-800 pb-4">Defining Characteristics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {principles.map((principle, idx) => {
            const Icon = principle.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl hover:bg-neutral-900 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-200 mb-3">{principle.title}</h3>
                <p className="text-neutral-400 leading-relaxed text-sm">{principle.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-2xl font-semibold mb-6 text-white">Genre Agnostic, Emotionally Rooted</h2>
          <p className="text-neutral-400 leading-relaxed mb-8">
            The system supports a wide variety of genres and their fusion, including but not limited to: 
            <span className="text-orange-300 font-medium"> R&B, Souldies, Rock, Hip Hop, Pop, Funk, Corridos, and Chicano Soul</span>. 
            It maintains a Chicano-rooted identity, following emotional grammar, not stereotypes.
          </p>
          
          <div className="p-6 bg-black/40 rounded-2xl border border-neutral-800/50 font-mono text-sm text-neutral-300">
            <div className="flex items-center gap-2 text-orange-400 mb-4">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              CRITICAL CONSTRAINTS
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-0.5">✗</span>
                <span>DO NOT drift into: country or Americana cadence, folk-ballad storytelling, twang or country vowel shaping.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-0.5">✗</span>
                <span>DO NOT use choir terminology (soprano, alto, tenor) or classical/crooner references (Bach, Beethoven, Sinatra).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-0.5">✗</span>
                <span>AVOID neutral, sanitized, or white-coded emotional tone.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-0.5">✓</span>
                <span>PRESERVE slang, subtext, and emotional cracks.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
