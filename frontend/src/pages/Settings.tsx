import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { WaveformSlider } from '../components/ui/WaveformSlider';
import { Chip } from '../components/ui/Chip';
import {
  Settings2, Cpu, Waves, Palette, Info,
  User, Bell, Zap, Volume2, Monitor, Save
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../components/ui/Button';

const SECTIONS = [
  { id: 'ai', label: 'AI & Engine', icon: Cpu },
  { id: 'audio', label: 'Audio', icon: Volume2 },
  { id: 'display', label: 'Display', icon: Monitor },
  { id: 'account', label: 'Account', icon: User },
  { id: 'about', label: 'About', icon: Info },
];

export function Settings() {
  const [activeSection, setActiveSection] = useState('ai');
  const [saved, setSaved] = useState(false);

  // AI settings
  const [defaultEnergy, setDefaultEnergy] = useState(70);
  const [defaultMood, setDefaultMood] = useState(50);
  const [defaultBounce, setDefaultBounce] = useState(60);
  const [defaultGenre, setDefaultGenre] = useState('Hip-Hop');
  const [defaultCulture, setDefaultCulture] = useState('Chicano');

  // Audio settings
  const [defaultBpm, setDefaultBpm] = useState('128');
  const [defaultKey, setDefaultKey] = useState('C Minor');
  const [sampleRate, setSampleRate] = useState('48000');
  const [bufferSize, setBufferSize] = useState('512');

  // Display settings
  const [glowIntensity, setGlowIntensity] = useState(80);
  const [accentColor, setAccentColor] = useState('cyan');
  const [animationSpeed, setAnimationSpeed] = useState('normal');

  // Notification settings
  const [notifyGeneration, setNotifyGeneration] = useState(true);
  const [notifyExport, setNotifyExport] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-['Sedgwick_Ave_Display'] mb-2 text-zinc-100 flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-zinc-400" /> Settings
          </h1>
          <p className="text-zinc-400 font-medium text-sm">Configure production defaults for Lyrica 3.</p>
        </div>
        <Button
          variant="primary"
          glowColor="cyan"
          className="gap-2"
          onClick={handleSave}
        >
          {saved ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Saved
            </motion.span>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <nav className="md:w-52 shrink-0 flex md:flex-col gap-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all w-full text-left",
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-cyan-400" : "")} strokeWidth={1.5} />
                {s.label}
              </button>
            );
          })}
        </nav>

        {/* Content Panel */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 space-y-6"
        >
          {activeSection === 'ai' && (
            <>
              <Card className="bg-zinc-950 border-zinc-800 space-y-8">
                <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-fuchsia-400" /> Soulfire Default Parameters
                </h3>
                <div className="space-y-6">
                  <WaveformSlider label="Default Energy" value={defaultEnergy} onChange={setDefaultEnergy} color="cyan" />
                  <WaveformSlider label="Default Mood" value={defaultMood} onChange={setDefaultMood} color="magenta" />
                  <WaveformSlider label="Default Cultura Bounce" value={defaultBounce} onChange={setDefaultBounce} color="purple" />
                </div>
              </Card>

              <Card className="bg-zinc-950 border-zinc-800 space-y-6">
                <h3 className="font-medium text-zinc-200">Default Style Matrix</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-zinc-500 mb-2 block uppercase tracking-wider">Default Genre</span>
                    <div className="flex flex-wrap gap-2">
                      {['Hip-Hop', 'R&B', 'Synthwave', 'Cinematic', 'Corridos', 'Lo-Fi'].map(g => (
                        <Chip key={g} active={defaultGenre === g} onClick={() => setDefaultGenre(g)}>{g}</Chip>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 mb-2 block uppercase tracking-wider">Default Culture / Roots</span>
                    <div className="flex flex-wrap gap-2">
                      {['Chicano', 'Neo-Tokyo', 'Cyberpunk', 'Classic LA', 'Minimalist'].map(c => (
                        <Chip key={c} active={defaultCulture === c} onClick={() => setDefaultCulture(c)}>{c}</Chip>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeSection === 'audio' && (
            <>
              <Card className="bg-zinc-950 border-zinc-800 space-y-6">
                <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                  <Waves className="w-4 h-4 text-cyan-400" /> Session Defaults
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Default BPM</label>
                    <input
                      type="number"
                      value={defaultBpm}
                      onChange={e => setDefaultBpm(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Default Key</label>
                    <select
                      value={defaultKey}
                      onChange={e => setDefaultKey(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      {['C Major', 'C Minor', 'G Major', 'A Minor', 'F Major', 'D Minor', 'Bb Major', 'E Minor'].map(k => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="bg-zinc-950 border-zinc-800 space-y-6">
                <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-purple-400" /> Audio Engine
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Sample Rate</label>
                    <select
                      value={sampleRate}
                      onChange={e => setSampleRate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="44100">44,100 Hz (CD Quality)</option>
                      <option value="48000">48,000 Hz (Studio)</option>
                      <option value="96000">96,000 Hz (Hi-Res)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider block mb-2">Buffer Size</label>
                    <select
                      value={bufferSize}
                      onChange={e => setBufferSize(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="128">128 samples (low latency)</option>
                      <option value="256">256 samples</option>
                      <option value="512">512 samples (balanced)</option>
                      <option value="1024">1024 samples (stable)</option>
                    </select>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs text-cyan-300">
                  Current latency estimate: ~{Math.round(parseInt(bufferSize) / parseInt(sampleRate) * 1000 * 2)}ms round-trip at {parseInt(sampleRate).toLocaleString()} Hz
                </div>
              </Card>
            </>
          )}

          {activeSection === 'display' && (
            <>
              <Card className="bg-zinc-950 border-zinc-800 space-y-8">
                <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-fuchsia-400" /> Visual Style
                </h3>
                <WaveformSlider label="Glow Intensity" value={glowIntensity} onChange={setGlowIntensity} color="cyan" />
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-3">Accent Color</span>
                  <div className="flex gap-3">
                    {[
                      { id: 'cyan', color: 'bg-cyan-500', label: 'Electric Cyan', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.6)]' },
                      { id: 'magenta', color: 'bg-fuchsia-500', label: 'Neon Magenta', glow: 'shadow-[0_0_15px_rgba(217,70,239,0.6)]' },
                      { id: 'purple', color: 'bg-purple-500', label: 'Electric Purple', glow: 'shadow-[0_0_15px_rgba(168,85,247,0.6)]' },
                    ].map(a => (
                      <button
                        key={a.id}
                        onClick={() => setAccentColor(a.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all flex-1",
                          accentColor === a.id
                            ? "border-zinc-600 bg-zinc-900"
                            : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
                        )}
                      >
                        <div className={cn("w-8 h-8 rounded-full", a.color, accentColor === a.id && a.glow)} />
                        <span className="text-xs text-zinc-400">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-3">Animation Speed</span>
                  <div className="flex gap-2">
                    {['slow', 'normal', 'fast'].map(speed => (
                      <Chip key={speed} active={animationSpeed === speed} onClick={() => setAnimationSpeed(speed)} className="capitalize flex-1 justify-center">
                        {speed}
                      </Chip>
                    ))}
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeSection === 'account' && (
            <>
              <Card className="bg-zinc-950 border-zinc-800 space-y-6">
                <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" /> Profile
                </h3>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center text-2xl font-['Sedgwick_Ave_Display'] text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]">
                    L
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      defaultValue="Lyrica Artist"
                      placeholder="Display Name"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                    />
                    <input
                      type="email"
                      defaultValue="artist@lyrica3.ai"
                      placeholder="Email"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                    />
                  </div>
                </div>
              </Card>

              <Card className="bg-zinc-950 border-zinc-800 space-y-4">
                <h3 className="font-medium text-zinc-200 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-fuchsia-400" /> Notifications
                </h3>
                {[
                  { label: 'Generation complete', desc: 'Alert when a beat finishes generating', value: notifyGeneration, set: setNotifyGeneration },
                  { label: 'Export ready', desc: 'Alert when your export file is ready', value: notifyExport, set: setNotifyExport },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.set(!item.value)}
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors",
                        item.value ? "bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-zinc-700"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                          item.value && "translate-x-5"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </Card>
            </>
          )}

          {activeSection === 'about' && (
            <Card className="bg-zinc-950 border-zinc-800 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-[0_0_30px_rgba(217,70,239,0.4)]">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-['Sedgwick_Ave_Display'] text-3xl text-white">Lyrica 3</h2>
                  <p className="text-zinc-400 text-sm">Version 3.0.0 — Soulfire Edition</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Engine', value: 'Soulfire v3.2' },
                  { label: 'AI Model', value: 'Emotional-Perf GPT' },
                  { label: 'Build', value: '2026.06.07' },
                  { label: 'License', value: 'Creative Pro' },
                ].map(item => (
                  <div key={item.label} className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider block mb-1">{item.label}</span>
                    <span className="text-sm font-medium text-zinc-200">{item.value}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed">
                Lyrica 3 is powered by the Soulfire Emotional Performance System — an AI music creation engine rooted in Chicano/SGV culture and designed to express the full emotional spectrum of human experience through sound.
              </p>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
