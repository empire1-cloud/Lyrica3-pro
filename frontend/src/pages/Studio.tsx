import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Play, Square, Mic, SlidersHorizontal,
  ListMusic, Drum, Piano, Waves, Sparkles, Plus,
  Volume2, Download, Search, Settings2, Share2,
  Music, Heart, Zap, RefreshCw, Layers
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { WaveformSlider } from '../components/ui/WaveformSlider';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../components/ui/Button';
import { ExportModal } from '../components/ui/ExportModal';

export function Studio() {
  const [activeTab, setActiveTab] = useState<'main' | 'drum' | 'melody' | 'vocal' | 'mixer'>('main');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // AI Brain State
  const [energy, setEnergy] = useState(80);
  const [mood, setMood] = useState(50);
  const [bounce, setBounce] = useState(70);

  // Stable mini waveform heights
  const miniWaveHeights = useMemo(
    () => Array.from({ length: 80 }, () => 10 + Math.random() * 90),
    []
  );

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => setElapsedMs(ms => ms + 50), 50);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying]);

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const millis = String(Math.floor((elapsedMs % 1000) / 10)).padStart(2, '0');
  const timeDisplay = `${minutes}:${seconds}:${millis}`;

  const totalBeats = Math.floor(elapsedMs / (60000 / 128));
  const bar = Math.floor(totalBeats / 4) + 1;
  const beat = (totalBeats % 4) + 1;

  // Progress 0–100 for mini waveform playhead
  const progress = Math.min(100, (elapsedMs / 120000) * 100);

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden text-zinc-50 font-sans">

      {/* Top Header */}
      <header className="h-14 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span className="font-['Sedgwick_Ave_Display'] text-lg tracking-wide text-zinc-100">Lyrica 3 Studio</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <div className="flex bg-zinc-900 rounded-lg p-1">
            {[
              { id: 'main', icon: Waves, label: 'Main' },
              { id: 'drum', icon: Drum, label: 'Drums' },
              { id: 'melody', icon: Piano, label: 'Melody' },
              { id: 'vocal', icon: Mic, label: 'Vocals' },
              { id: 'mixer', icon: SlidersHorizontal, label: 'Mixer' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    isActive
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive && "text-cyan-400")} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 gap-2 text-zinc-400">
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button variant="secondary" size="sm" className="h-8 gap-2" onClick={() => setIsExportModalOpen(true)}>
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Sound Browser */}
        <aside className="hidden md:flex w-64 border-r border-zinc-800/50 bg-zinc-950 flex-col shrink-0 z-10">
          <div className="p-4 border-b border-zinc-800/50">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Sample Universe</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search sounds..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
              />
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
              {['Kicks', '808s', 'Vocals', 'Synths'].map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 whitespace-nowrap cursor-pointer hover:bg-zinc-800 hover:text-white transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900/80 group cursor-pointer transition-colors">
                <button className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:text-cyan-400 transition-colors shrink-0">
                  <Play className="w-3.5 h-3.5 ml-0.5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-cyan-400 transition-colors">Neon Hit {i + 1}</p>
                  <p className="text-[10px] text-zinc-500 truncate">Synthwave • 128BPM</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-300 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Active View */}
        <main className="flex-1 bg-zinc-950 relative overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 w-full h-full p-6 overflow-y-auto"
            >
              {activeTab === 'main' && <MainView />}
              {activeTab === 'drum' && <DrumMachine />}
              {activeTab === 'melody' && <MelodyLab />}
              {activeTab === 'vocal' && <VocalBooth />}
              {activeTab === 'mixer' && <MixerView />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Right: AI Brain Panel */}
        <aside className="hidden lg:flex w-72 border-l border-zinc-800/50 bg-zinc-950 flex-col shrink-0 z-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-64 bg-fuchsia-500/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="p-5 border-b border-zinc-800/50 relative z-10">
            <h3 className="text-sm font-medium flex items-center gap-2 text-fuchsia-400 mb-1">
              <Zap className="w-4 h-4" /> Soulfire Core
            </h3>
            <p className="text-xs text-zinc-500">AI Intelligence Layer</p>
          </div>

          <div className="p-5 space-y-8 flex-1 overflow-y-auto relative z-10">
            <div className="space-y-6">
              <WaveformSlider label="Energy Level" value={energy} onChange={setEnergy} color="cyan" />
              <WaveformSlider label="Mood (Dark → Bright)" value={mood} onChange={setMood} color="magenta" />
              <WaveformSlider label="Cultura Bounce" value={bounce} onChange={setBounce} color="purple" />
            </div>

            <div className="h-px w-full bg-zinc-800/50" />

            <div className="space-y-3">
              <h4 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">AI Actions</h4>
              <Button variant="secondary" className="w-full justify-start gap-3 bg-zinc-900/50 hover:bg-zinc-800 border-zinc-800">
                <RefreshCw className="w-4 h-4 text-cyan-400" /> Predict next 4 bars
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-3 bg-zinc-900/50 hover:bg-zinc-800 border-zinc-800">
                <Layers className="w-4 h-4 text-fuchsia-400" /> Add counter-melody
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-3 bg-zinc-900/50 hover:bg-zinc-800 border-zinc-800">
                <Drum className="w-4 h-4 text-purple-400" /> Humanize swing
              </Button>
            </div>

            <Button variant="primary" glowColor="fuchsia" className="w-full gap-2 mt-4">
              <Sparkles className="w-4 h-4" /> Generate Full Beat
            </Button>
          </div>
        </aside>

      </div>

      {/* Bottom: Transport Bar */}
      <footer className="h-20 border-t border-zinc-800/50 bg-zinc-950 flex items-center px-6 gap-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            glowColor="cyan"
            size="icon"
            className="w-12 h-12 rounded-full"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
          </Button>
          <div className="flex flex-col">
            <span className="font-mono text-xl text-cyan-400 tracking-wider">{timeDisplay}</span>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
              Bar {bar} • Beat {beat}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 px-6 py-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">BPM</span>
            <span className="text-sm font-medium text-white">128.0</span>
          </div>
          <div className="w-px h-6 bg-zinc-800" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Key</span>
            <span className="text-sm font-medium text-white">C Minor</span>
          </div>
          <div className="w-px h-6 bg-zinc-800" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Grid</span>
            <span className="text-sm font-medium text-white">1/16</span>
          </div>
        </div>

        {/* Mini waveform global overview */}
        <div className="flex-1 h-10 flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer relative">
          {miniWaveHeights.map((h, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-full",
                i / miniWaveHeights.length * 100 < progress ? "bg-cyan-500" : "bg-zinc-700"
              )}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </footer>

      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
}

function MainView() {
  return (
    <div className="h-full flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
        <div className="w-full max-w-3xl h-64 flex items-center gap-2">
          {Array.from({ length: 48 }).map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-gradient-to-t from-cyan-600 via-fuchsia-500 to-purple-500 rounded-full"
              animate={{
                height: [`${20 + Math.sin(i * 0.3) * 10}%`, `${60 + Math.cos(i * 0.4) * 30}%`, `${20 + Math.sin(i * 0.3) * 10}%`]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5 + (i % 7) * 0.2,
                ease: "easeInOut",
                delay: i * 0.05
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 text-center space-y-4">
        <h2 className="text-5xl font-['Sedgwick_Ave_Display'] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          The Beat Lab
        </h2>
        <p className="text-zinc-400 max-w-md mx-auto">
          Your command center. Drag samples here, adjust the Soulfire core, and let the music evolve.
        </p>
      </div>
    </div>
  );
}

const DRUM_LAYERS = ['Kick', 'Snare', 'Hi-Hat', '808 Bass', 'Perc'];

function buildDefaultPattern(): boolean[][] {
  return DRUM_LAYERS.map((layer) =>
    Array.from({ length: 16 }, (_, j) => {
      if (layer === 'Kick')     return [0, 4, 8, 12].includes(j);
      if (layer === 'Snare')    return [4, 12].includes(j);
      if (layer === 'Hi-Hat')   return j % 2 === 0;
      if (layer === '808 Bass') return [0, 6, 10].includes(j);
      return [3, 7, 11, 15].includes(j);
    })
  );
}

function DrumMachine() {
  const [pattern, setPattern] = useState<boolean[][]>(buildDefaultPattern);

  const toggle = (row: number, step: number) => {
    setPattern(prev =>
      prev.map((r, ri) => ri === row ? r.map((s, si) => si === step ? !s : s) : r)
    );
  };

  const randomize = () => {
    setPattern(DRUM_LAYERS.map(() =>
      Array.from({ length: 16 }, () => Math.random() > 0.7)
    ));
  };

  const clear = () => setPattern(DRUM_LAYERS.map(() => Array(16).fill(false)));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Drum className="w-6 h-6 text-purple-400" /> Neon Step Sequencer
          </h2>
          <p className="text-zinc-400 text-sm">Click pads to toggle. Sci-fi weapon system for your 808s.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-2 bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20" onClick={randomize}>
            <Sparkles className="w-4 h-4" /> AI Fill
          </Button>
          <Button variant="secondary" size="sm" onClick={clear}>
            Clear
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 overflow-x-auto">
        <div className="min-w-[640px] space-y-3">
          {DRUM_LAYERS.map((layer, rowIdx) => (
            <div key={layer} className="flex items-center gap-4">
              <div className="w-24 flex items-center justify-between shrink-0">
                <span className="text-sm font-medium text-zinc-300">{layer}</span>
                <Volume2 className="w-4 h-4 text-zinc-600 cursor-pointer hover:text-white" />
              </div>

              <div className="flex-1 flex gap-1.5">
                {pattern[rowIdx].map((active, stepIdx) => (
                  <button
                    key={stepIdx}
                    onClick={() => toggle(rowIdx, stepIdx)}
                    className={cn(
                      "h-12 rounded transition-all relative overflow-hidden border",
                      "flex-1",
                      stepIdx % 4 === 0 && "ring-1 ring-zinc-700/50",
                      active
                        ? "border-purple-500/60 bg-purple-500/25 shadow-[0_0_12px_rgba(168,85,247,0.35)]"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900/60"
                    )}
                  >
                    {active && (
                      <div className="absolute bottom-0 left-0 right-0 bg-purple-400/80 rounded-b" style={{ height: '55%' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MelodyLab() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Piano className="w-6 h-6 text-cyan-400" /> Holographic Piano Roll
          </h2>
          <p className="text-zinc-400 text-sm">Notes glow by pitch. AI suggests chords.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-2 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20">
            <Sparkles className="w-4 h-4" /> Gen Counter-Melody
          </Button>
          <Button variant="secondary" size="sm">
            Add Cultura Flavor
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl relative overflow-hidden flex">
        {/* Piano Keys */}
        <div className="w-16 bg-zinc-950 border-r border-zinc-800 flex flex-col z-10 relative">
          {Array.from({ length: 24 }).map((_, i) => {
            const isBlack = [1, 3, 6, 8, 10].includes(i % 12);
            return (
              <div
                key={i}
                className={cn(
                  "flex-1 border-b border-zinc-800 flex items-center justify-end pr-1 text-[8px] text-zinc-600",
                  isBlack ? "bg-zinc-900" : "bg-zinc-800/30"
                )}
              >
                {!isBlack && `C${4 - Math.floor(i / 12)}`}
              </div>
            );
          })}
        </div>

        <div className="flex-1 relative bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_20px] bg-zinc-950">
          {[
            { top: 40, left: 40, width: 80 },
            { top: 120, left: 120, width: 40 },
            { top: 80, left: 160, width: 80 },
            { top: 200, left: 240, width: 120 },
          ].map((note, i) => (
            <motion.div
              key={i}
              className="absolute h-[18px] rounded bg-cyan-500/40 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] cursor-pointer"
              style={{ top: note.top + 1, left: note.left, width: note.width }}
              whileHover={{ scaleY: 1.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function VocalBooth() {
  const [vibrato, setVibrato] = useState(40);
  const [grit, setGrit] = useState(20);
  const [emotion, setEmotion] = useState(75);
  const [activeChar, setActiveChar] = useState('Silky R&B');

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Mic className="w-6 h-6 text-fuchsia-400" /> Vocal AI Booth
          </h2>
          <p className="text-zinc-400 text-sm">Futuristic vocal creation chamber.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <Card className="bg-zinc-900/50 border-zinc-800 flex flex-col">
          <h3 className="text-sm font-medium mb-4 text-zinc-300">Lyrics Editor</h3>
          <textarea
            className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-white resize-none focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 font-mono text-sm"
            defaultValue={"[Verse 1]\nCruising down the boulevard, neon lights passing by\nSoulfire burning bright under the midnight sky\n\n[Chorus]\nYeah, we riding the wave, feeling the motion\nDigital dreams mixed with real emotion"}
          />
          <Button variant="primary" glowColor="fuchsia" className="mt-4 w-full gap-2">
            <Sparkles className="w-4 h-4" /> Generate Vocals
          </Button>
        </Card>

        <div className="space-y-6 flex flex-col">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <h3 className="text-sm font-medium mb-4 text-zinc-300">Vocal Character</h3>
            <div className="grid grid-cols-2 gap-3">
              {['Silky R&B', 'Gritty Rap', 'Ethereal Pop', 'Classic Soul'].map((char) => (
                <button
                  key={char}
                  onClick={() => setActiveChar(char)}
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium transition-all text-left",
                    activeChar === char
                      ? "bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-200 shadow-[0_0_15px_rgba(217,70,239,0.2)]"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                  )}
                >
                  {char}
                </button>
              ))}
            </div>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 flex-1 flex flex-col justify-center space-y-6">
            <h3 className="text-sm font-medium text-zinc-300">Performance Controls</h3>
            <WaveformSlider label="Vibrato" value={vibrato} onChange={setVibrato} color="fuchsia" />
            <WaveformSlider label="Grit & Distortion" value={grit} onChange={setGrit} color="fuchsia" />
            <WaveformSlider label="Emotion (Pain → Joy)" value={emotion} onChange={setEmotion} color="fuchsia" />
          </Card>
        </div>
      </div>
    </div>
  );
}

function MixerView() {
  const tracks = ['Vocals', 'Synths', '808', 'Drums', 'FX', 'Master'];
  const [faderPositions, setFaderPositions] = useState<number[]>(() => [70, 65, 80, 75, 50, 85]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <SlidersHorizontal className="w-6 h-6 text-blue-400" /> Hologram Fader Deck
          </h2>
          <p className="text-zinc-400 text-sm">Blade Runner meets Abbey Road.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="gap-2 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20">
            <Sparkles className="w-4 h-4" /> AI Auto-Balance
          </Button>
          <Button variant="secondary" size="sm">
            Mastering Presets
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex gap-4 overflow-x-auto">
        {tracks.map((track, trackIdx) => {
          const isMaster = track === 'Master';
          const level = faderPositions[trackIdx];
          return (
            <div key={track} className={cn("w-24 flex flex-col items-center bg-zinc-950 rounded-lg border border-zinc-800/50 pb-4 pt-2 shrink-0", isMaster && "border-blue-500/30 ml-4")}>
              <span className={cn("text-xs font-medium uppercase tracking-wider mb-4", isMaster ? "text-blue-400" : "text-zinc-400")}>{track}</span>

              <div className="space-y-4 mb-6">
                {[1, 2, 3].map(k => (
                  <div key={k} className="w-8 h-8 rounded-full border-2 border-zinc-800 relative">
                    <div className="absolute top-1/2 left-1/2 w-1 h-3 bg-zinc-500 origin-bottom -translate-x-1/2 -translate-y-full rotate-45" />
                  </div>
                ))}
              </div>

              <div className="flex-1 w-full flex justify-center relative my-4 min-h-[100px]">
                <div className="w-1.5 h-full bg-zinc-900 rounded-full relative shadow-inner">
                  <div
                    className="absolute w-8 h-12 bg-zinc-800 border border-zinc-700 rounded shadow-lg -ml-[13px] z-10 flex flex-col items-center justify-center gap-1 cursor-ns-resize hover:bg-zinc-700 transition-colors"
                    style={{ top: `${100 - level}%`, transform: 'translateY(-50%)' }}
                  >
                    <div className="w-4 h-px bg-white/20" />
                    <div className="w-6 h-0.5 bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.8)]" />
                    <div className="w-4 h-px bg-white/20" />
                  </div>
                  <div className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 rounded-full opacity-60" style={{ height: `${level}%` }} />
                </div>
              </div>

              <div className="flex gap-1 mb-2">
                <button className="w-6 h-6 rounded bg-zinc-900 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">M</button>
                <button className="w-6 h-6 rounded bg-zinc-900 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">S</button>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{level}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
