import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Target, Shield, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

export default function SeedRoundPitch() {
  const slides = [
    {
      id: 1,
      title: "Slide 1: The AI Music Trap",
      icon: AlertTriangle,
      color: "text-red-500",
      accent: "bg-red-500/10",
      border: "border-red-500/20",
      text: "Right now, the AI music market is worth $2.5 Billion, and it is a trap. Companies like Suno and Udio are generating 30-second, emotionless novelty songs where the platform owns 100% of the IP, and the creator earns zero. On the other end, Traditional DAWs cost $3,000 and require years to master. No one is serving the middle. No one is serving the professional creator who wants AI scale but demands ownership and emotion."
    },
    {
      id: 2,
      title: "Slide 2: Welcome to Lane 3 (The $3B Blue Ocean)",
      icon: Target,
      color: "text-blue-500",
      accent: "bg-blue-500/10",
      border: "border-blue-500/20",
      text: "We are not competing with Suno. We are creating Lane 3: The Creator-Owned AI Music Category. Lyrica 3 Pro is built on three pillars that legacy platforms cannot pivot to: Emotional Intelligence, Creator Equity, and Network Gravity. We don't just generate music; we build an economy around it."
    },
    {
      id: 3,
      title: "Slide 3: Competitive Moat 1 – 'Soulfire' Intelligence",
      icon: Zap,
      color: "text-orange-500",
      accent: "bg-orange-500/10",
      border: "border-orange-500/20",
      text: "AI currently sounds robotic because it lacks physiology. Lyrica 3 Pro introduces 'Soulfire.' We engineered the Agentic Quartet. When our AI sings, it calculates the 'Adaptive Inhale' and the 'Vocal Fry' based on the emotional subtext of the lyrics. We play our drums off the grid in a 'Late-Pocket' swing. We aren't generating audio; we are rendering human emotion at 48kHz."
    },
    {
      id: 4,
      title: "Slide 4: Competitive Moat 2 – The Empire 1 Ledger",
      icon: Shield,
      color: "text-emerald-500",
      accent: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "This is how we kill TikTok's audio library. Every track made in Sonance Pro is injected with an immutable DNA Tag. When it goes to our consumer radio app, SL Universal, listeners can click the 'Flip It' button to remix the genre. When they do, our Pulse-Stream Broker fires a Synapse Event, instantly routing a fractional USD micro-royalty back to the original creator's dashboard. A single hit track generated in our studio can yield five figures in passive remix income."
    },
    {
      id: 5,
      title: "Slide 5: The Ask ($2M to Own the Category)",
      icon: Rocket,
      color: "text-fuchsia-500",
      accent: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/20",
      text: "We are raising a $2M Seed round to completely monopolize Lane 3. 40% goes to scaling the Resonance-X audio pipeline and the DNA Ledger; 25% goes to recruiting 50 elite producers to seed the ecosystem. By Month 12, we hit 100,000 Monthly Active Users and $500k ARR. By Month 24, we are at $10M ARR, and Suno is obsolete. Join us in building the New World Empire."
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-sm font-mono mb-4">
          <TrendingUp className="w-4 h-4" />
          <span>PHASE III: THE SEED ROUND</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-600">Lethal</span> Narrative
        </h1>
        <p className="text-xl text-neutral-400 max-w-3xl leading-relaxed">
          This is the script for the $2M Seed Round. No bullet points. Just visionary, high-velocity execution.
        </p>
      </header>

      <div className="space-y-8">
        {slides.map((slide, idx) => {
          const Icon = slide.icon;
          return (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.15 }}
              className={`bg-neutral-900/40 border ${slide.border} rounded-3xl p-8 md:p-12 relative overflow-hidden group hover:bg-neutral-900/60 transition-all duration-500`}
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${slide.color.replace('text-', 'bg-')}`} />
              
              <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                <div className={`p-4 ${slide.accent} rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className={`w-8 h-8 ${slide.color}`} />
                </div>
                
                <div className="space-y-6">
                  <h2 className={`text-2xl font-black tracking-tight ${slide.color} uppercase`}>
                    {slide.title}
                  </h2>
                  <p className="text-xl md:text-2xl text-neutral-200 leading-relaxed font-medium italic">
                    "{slide.text}"
                  </p>
                </div>
              </div>

              {/* Decorative background element */}
              <div className={`absolute -bottom-12 -right-12 w-48 h-48 ${slide.accent} rounded-full blur-[100px] opacity-20 pointer-events-none`} />
            </motion.div>
          );
        })}
      </div>

      <footer className="pt-12 border-t border-neutral-800 text-center">
        <p className="text-neutral-500 font-mono text-xs uppercase tracking-[0.3em]">
          End of Transmission • Empire 1 Protocol Secured
        </p>
      </footer>
    </div>
  );
}
