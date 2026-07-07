import React, { useState } from 'react';
import { WaveformSlider } from '../components/ui/WaveformSlider';
import { Chip } from '../components/ui/Chip';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Sparkles, RefreshCw, Volume2, Play, Download } from 'lucide-react';
import { motion } from 'motion/react';

const GENRES = ["Hip-Hop", "R&B", "Synthwave", "Cinematic", "Corridos", "Lo-Fi"];
const VIBES = ["Dark", "Ethereal", "Gritty", "Euphoric", "Chill"];
const CULTURE = ["Chicano", "Neo-Tokyo", "Cyberpunk", "Classic LA", "Minimalist"];

export function Engine() {
  const [energy, setEnergy] = useState(75);
  const [mood, setMood] = useState(40);
  const [intensity, setIntensity] = useState(85);

  const [activeGenre, setActiveGenre] = useState("Hip-Hop");
  const [activeVibe, setActiveVibe] = useState("Dark");
  const [activeCulture, setActiveCulture] = useState("Chicano");

  const [isGenerating, setIsGenerating] = useState(false);
  const [hasOutput, setHasOutput] = useState(true); // Default to true for visual purposes

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasOutput(true);
    }, 2000);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      {/* Left Column: Controls */}
      <div className="lg:col-span-7 space-y-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-['Sedgwick_Ave_Display'] mb-2 flex items-center gap-3 text-cyan-400">
            <Sparkles className="w-8 h-8" /> Soulfire Engine
          </h1>
          <p className="text-zinc-400 font-medium">Dial in the emotional parameters and let the engine create.</p>
        </div>

        <Card className="space-y-8">
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Style Matrix</h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs text-zinc-500 mb-2 block">Genre</span>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(g => (
                    <Chip key={g} active={activeGenre === g} onClick={() => setActiveGenre(g)}>{g}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-zinc-500 mb-2 block">Vibe</span>
                <div className="flex flex-wrap gap-2">
                  {VIBES.map(v => (
                    <Chip key={v} active={activeVibe === v} onClick={() => setActiveVibe(v)}>{v}</Chip>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs text-zinc-500 mb-2 block">Culture / Roots</span>
                <div className="flex flex-wrap gap-2">
                  {CULTURE.map(c => (
                    <Chip key={c} active={activeCulture === c} onClick={() => setActiveCulture(c)}>{c}</Chip>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-zinc-800/50" />

          <div className="space-y-6">
            <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Emotion Sliders</h3>
            <WaveformSlider label="Energy" value={energy} onChange={setEnergy} color="cyan" />
            <WaveformSlider label="Mood (Dark -> Light)" value={mood} onChange={setMood} color="magenta" />
            <WaveformSlider label="Intensity" value={intensity} onChange={setIntensity} color="purple" />
          </div>
        </Card>

        <Button 
          variant="primary" 
          glowColor="magenta" 
          className="w-full h-14 text-lg font-bold uppercase tracking-wider"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <RefreshCw className="w-5 h-5" />
            </motion.div>
          ) : (
            <>Generate Track <Sparkles className="w-5 h-5 ml-2" /></>
          )}
        </Button>
      </div>

      {/* Right Column: Visualizer & Output */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <Card className="flex-1 bg-zinc-950 border-zinc-800/50 flex flex-col overflow-hidden relative min-h-[400px]">
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Live Visualizer
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500"></span>
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center p-8">
            {/* Abstract Large Waveform Visualizer */}
            <div className="flex items-center gap-1 w-full h-48">
              {Array.from({ length: 32 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-fuchsia-600 to-cyan-400 rounded-full opacity-80"
                  animate={{
                    height: isGenerating 
                      ? [`20%`, `${40 + Math.random() * 60}%`, `20%`]
                      : hasOutput 
                        ? [`${20 + Math.sin(i) * 10}%`, `${60 + Math.cos(i) * 30}%`, `${20 + Math.sin(i) * 10}%`]
                        : '4px'
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: isGenerating ? 0.5 : 2 + Math.random(),
                    ease: "easeInOut",
                    delay: i * 0.05
                  }}
                />
              ))}
            </div>
          </div>
        </Card>

        {hasOutput && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glowOnHover flex flex-col gap-4 bg-zinc-900/80">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-white">Generation Output #001</h3>
                  <p className="text-sm text-zinc-400">{activeGenre} • {activeVibe} • {activeCulture}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                  <Download className="w-5 h-5" />
                </Button>
              </div>
              <div className="h-16 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center px-4 gap-4">
                <Button variant="primary" glowColor="cyan" size="icon" className="w-10 h-10 rounded-full shrink-0">
                  <Play className="w-4 h-4 ml-1" />
                </Button>
                <div className="flex-1 h-8 flex items-center gap-0.5">
                  {/* Mini static waveform */}
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="flex-1 bg-zinc-700 rounded-full" style={{ height: `${20 + Math.random() * 80}%` }} />
                  ))}
                </div>
                <span className="text-xs font-medium text-zinc-500">2:45</span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="secondary" className="flex-1 text-xs h-9">Save to Library</Button>
                <Button variant="secondary" className="flex-1 text-xs h-9 gap-2">
                  <RefreshCw className="w-3 h-3" /> Variations
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

    </div>
  );
}
