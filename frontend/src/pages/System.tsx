import React from 'react';
import { Card } from '../components/ui/Card';
import { Database, Zap, Sparkles, Server, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function System() {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-['Sedgwick_Ave_Display'] mb-2 text-fuchsia-400">
          System Architecture
        </h1>
        <p className="text-zinc-400 font-medium text-sm">Soulfire Engine architecture and data pipelines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Architecture Diagram */}
        <Card className="col-span-1 lg:col-span-2 bg-zinc-950 border-zinc-800 space-y-6">
          <h3 className="font-medium flex items-center gap-2 text-zinc-300">
            <Server className="w-5 h-5 text-cyan-400" /> Soulfire Engine Pipeline
          </h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-8 bg-zinc-900/50 rounded-xl border border-zinc-800/50 relative overflow-hidden">
            
            {/* Animated background particles */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-cyan-500 rounded-full"
                  animate={{
                    x: [Math.random() * 800, Math.random() * 800],
                    y: [Math.random() * 200, Math.random() * 200],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              ))}
            </div>

            <div className="w-full md:w-48 text-center p-4 rounded-xl bg-zinc-950 border border-zinc-800 shadow-[0_0_15px_rgba(6,182,212,0.1)] z-10">
              <Database className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <div className="text-sm font-bold">Preset Library</div>
              <div className="text-xs text-zinc-500 mt-1">Tags & Metadata</div>
            </div>
            
            <motion.div animate={{ x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="hidden md:block z-10">
              <ArrowRight className="w-6 h-6 text-zinc-600" />
            </motion.div>

            <div className="w-full md:w-64 text-center p-6 rounded-xl bg-gradient-to-br from-fuchsia-900/20 to-cyan-900/20 border border-fuchsia-500/30 shadow-[0_0_30px_rgba(217,70,239,0.2)] z-10">
              <Sparkles className="w-10 h-10 text-fuchsia-400 mx-auto mb-3" />
              <div className="text-base font-bold text-fuchsia-100">Soulfire Core</div>
              <div className="text-xs text-fuchsia-300 mt-2">Emotional Performance Model</div>
            </div>

            <motion.div animate={{ x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="hidden md:block z-10">
              <ArrowRight className="w-6 h-6 text-zinc-600" />
            </motion.div>

            <div className="w-full md:w-48 text-center p-4 rounded-xl bg-zinc-950 border border-zinc-800 shadow-[0_0_15px_rgba(168,85,247,0.1)] z-10">
              <Zap className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-sm font-bold">Session Timeline</div>
              <div className="text-xs text-zinc-500 mt-1">Multi-track Rendering</div>
            </div>
          </div>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <h3 className="font-medium flex items-center gap-2 text-zinc-300 mb-6">
            <Database className="w-5 h-5 text-purple-400" /> Session Data Flow
          </h3>
          <ul className="space-y-4">
            {[
              { step: "1", title: "Parameter Ingestion", desc: "Energy, Mood, and Intensity matrices are processed." },
              { step: "2", title: "Style Resolution", desc: "Genre, Vibe, and Culture tags map to stem structures." },
              { step: "3", title: "Generative Pass", desc: "AI synthesizes multi-track waveforms." },
              { step: "4", title: "Timeline Assembly", desc: "Stems are synced to the master BPM and aligned." },
            ].map((item) => (
              <li key={item.step} className="flex gap-4 p-3 rounded-lg hover:bg-zinc-900/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {item.step}
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-200">{item.title}</div>
                  <div className="text-xs text-zinc-500 mt-1">{item.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <h3 className="font-medium flex items-center gap-2 text-zinc-300 mb-6">
            <Sparkles className="w-5 h-5 text-fuchsia-400" /> Preset Tagging Logic
          </h3>
          <div className="flex flex-wrap gap-2">
            {["Genre:Synthwave", "Genre:Corridos", "Vibe:Dark", "Vibe:Euphoric", "Culture:Chicano", "Emotion:Aggressive", "Tempo:120BPM", "Scale:Minor"].map((tag, i) => (
              <div key={i} className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors cursor-default">
                {tag}
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-zinc-900/30 border border-zinc-800/50 text-xs text-zinc-400">
            Presets combine exact multi-dimensional tagging. When loaded, they immediately re-initialize the Soulfire Engine with their mapped values.
          </div>
        </Card>
      </div>
    </div>
  );
}
