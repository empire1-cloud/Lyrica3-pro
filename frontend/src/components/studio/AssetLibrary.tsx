import { motion } from 'framer-motion';
import { Cpu, Waves, Layers, Sparkles, Database, Zap } from 'lucide-react';

const CATEGORIES = {
  AI_STYLE_MODEL: 'AI Style Model',
  PROCEDURAL_FX: 'Procedural FX Engine',
  AI_UTILITY: 'AI Utility Engine',
  VOCAL_ENGINE: 'Vocal-Lyrical Engine',
};

const assetProductionList = {
  aiNativeModels: [
    {
      id: 'ai-gen-ethereal-engine',
      category: CATEGORIES.AI_STYLE_MODEL,
      name: 'The Ethereal Engine',
      description: 'Generates non-repeating, evolving ambient soundscapes guided by emotional keywords.',
      icon: Waves,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      id: 'ai-gen-rhythm-chimera',
      category: CATEGORIES.AI_STYLE_MODEL,
      name: 'Rhythm Chimera',
      description: 'Fuses multiple rhythmic styles into novel hybrid beats based on user-defined percentages.',
      icon: Zap,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20'
    },
    {
      id: 'ai-gen-chord-canvas',
      category: CATEGORIES.AI_STYLE_MODEL,
      name: 'Chord-Canvas',
      description: 'Generates complex, musically-correct chord progressions and voicings from a simple melody.',
      icon: Layers,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20'
    },
    {
      id: 'ai-sig-g-funk-architect',
      category: CATEGORIES.AI_STYLE_MODEL,
      name: 'The G-Funk Architect',
      description: 'AI signature model trained to generate synth leads and basslines in the style of Dr. Dre.',
      icon: Cpu,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'ai-sig-timbaland-complexity',
      category: CATEGORIES.AI_STYLE_MODEL,
      name: 'The Timbaland Complexity Engine',
      description: 'AI signature model for complex, syncopated, and unconventional beat patterns.',
      icon: Cpu,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20'
    },
  ],
  proceduralEngines: [
    {
      id: 'pfx-ambiance-modeler',
      category: CATEGORIES.PROCEDURAL_FX,
      name: 'Universal Ambiance Modeler',
      description: 'Real-time procedural generation of vinyl, tape, and radio noise with degradation controls.',
      icon: Sparkles,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20'
    },
    {
      id: 'pfx-sfx-generator',
      category: CATEGORIES.PROCEDURAL_FX,
      name: 'Physics-Based SFX Generator',
      description: 'Generates sound effects by defining physical properties (material, action, environment).',
      icon: Database,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20'
    },
  ],
  aiUtilities: [
    {
      id: 'util-universal-separator',
      category: CATEGORIES.AI_UTILITY,
      name: 'Universal Source Separation',
      description: 'Next-gen AI model for separating audio into individual instrument stems (piano, guitar, etc.).',
      icon: Layers,
      color: 'text-fuchsia-400',
      bg: 'bg-fuchsia-500/10 border-fuchsia-500/20'
    },
    {
      id: 'util-timbral-transfer',
      category: CATEGORIES.AI_UTILITY,
      name: 'Timbral Transfer AI',
      description: 'Allows for "sound reskinning," applying the timbral characteristics of one sound to another.',
      icon: Waves,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20'
    }
  ],
  vocalLayeringPresets: [
    {
      id: 'vocal-preset-gospel',
      category: CATEGORIES.VOCAL_ENGINE,
      name: 'Gospel Choir',
      description: 'Massive, wide-panned 12-part harmony with heavy room reverb and slight pitch drift.',
      icon: Waves,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 'vocal-preset-barbershop',
      category: CATEGORIES.VOCAL_ENGINE,
      name: 'Barbershop Quartet',
      description: 'Tight, dry 4-part close harmony with locked timing and perfect intonation.',
      icon: Layers,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20'
    },
    {
      id: 'vocal-preset-pop-backing',
      category: CATEGORIES.VOCAL_ENGINE,
      name: 'Pop Backing Vocals',
      description: 'Silky, double-tracked unison layers with subtle chorus and high-end sheen.',
      icon: Sparkles,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20'
    }
  ]
};

export default function AssetLibrary() {
  return (
    <div className="space-y-12 mb-12">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white">AI-Native Producer Kits</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assetProductionList.aiNativeModels.map((asset) => (
            <motion.div 
              key={asset.id}
              whileHover={{ y: -2 }}
              className={`p-5 rounded-2xl border bg-black/40 hover:bg-black/60 transition-colors ${asset.bg}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-neutral-900 border border-neutral-800 ${asset.color}`}>
                  <asset.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{asset.name}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{asset.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Procedural & Physics FX</h3>
          </div>
          <div className="space-y-4">
            {assetProductionList.proceduralEngines.map((asset) => (
              <motion.div 
                key={asset.id}
                whileHover={{ x: 4 }}
                className={`p-5 rounded-2xl border bg-black/40 hover:bg-black/60 transition-all ${asset.bg}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-neutral-900 border border-neutral-800 ${asset.color}`}>
                    <asset.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{asset.name}</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">{asset.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-fuchsia-500/20 rounded-lg border border-fuchsia-500/30">
              <Layers className="w-5 h-5 text-fuchsia-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Next-Gen AI Stems</h3>
          </div>
          <div className="space-y-4">
            {assetProductionList.aiUtilities.map((asset) => (
              <motion.div 
                key={asset.id}
                whileHover={{ x: 4 }}
                className={`p-5 rounded-2xl border bg-black/40 hover:bg-black/60 transition-all ${asset.bg}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-neutral-900 border border-neutral-800 ${asset.color}`}>
                    <asset.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{asset.name}</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">{asset.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
              <Waves className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Vocal Layering Presets</h3>
          </div>
          <div className="space-y-4">
            {assetProductionList.vocalLayeringPresets.map((asset) => (
              <motion.div 
                key={asset.id}
                whileHover={{ x: 4 }}
                className={`p-5 rounded-2xl border bg-black/40 hover:bg-black/60 transition-all ${asset.bg}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-neutral-900 border border-neutral-800 ${asset.color}`}>
                    <asset.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{asset.name}</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">{asset.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
