import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SlidersHorizontal, Volume2, Activity, Radio, Save, Download, Upload, Trash2, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MixerProps {
  audioBlob: Blob;
}

interface MixerPreset {
  id: string;
  name: string;
  trackStates: any[];
  masterVolume: number;
  createdAt: string;
}

const TRACKS = [
  { id: 'vocal', name: 'Vocal/Lead', color: 'bg-pink-500', text: 'text-pink-400' },
  { id: 'harmony', name: 'Harmony/Pad', color: 'bg-purple-500', text: 'text-purple-400' },
  { id: 'rhythm', name: 'Rhythm/Bass', color: 'bg-blue-500', text: 'text-blue-400' },
  { id: 'percussion', name: 'Percussion', color: 'bg-emerald-500', text: 'text-emerald-400' }
];

function createReverb(ctx: AudioContext) {
  const length = ctx.sampleRate * 2.0;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);
  for (let i = 0; i < length; i++) {
    const decay = Math.exp(-i / (ctx.sampleRate * 0.3));
    left[i] = (Math.random() * 2 - 1) * decay;
    right[i] = (Math.random() * 2 - 1) * decay;
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}

export default function Mixer({ audioBlob }: MixerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [meters, setMeters] = useState([0, 0, 0, 0, 0]); // 4 tracks + 1 master
  const [presets, setPresets] = useState<MixerPreset[]>([]);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const [trackStates, setTrackStates] = useState(
    TRACKS.map(() => ({
      volume: 0.8,
      pan: 0,
      eqLow: 0,
      eqLowFreq: 250,
      eqLowMid: 0,
      eqLowMidFreq: 800,
      eqHighMid: 0,
      eqHighMidFreq: 2500,
      eqHigh: 0,
      eqHighFreq: 8000,
      compThresh: -24,
      compRatio: 4,
      reverb: 0.1,
      mute: false,
      solo: false
    }))
  );

  const audioNodes = useRef<any>(null);
  const animationRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const applyStatesToNodes = (states: typeof trackStates, audioGraph: any, masterVol: number) => {
    if (!audioGraph) return;
    const { ctx, masterGain, tracks } = audioGraph;
    const anySolo = states.some(t => t.solo);

    masterGain.gain.setTargetAtTime(masterVol, ctx.currentTime, 0.05);

    states.forEach((track, i) => {
      const nodes = tracks[i];
      const time = ctx.currentTime;

      let effectiveVol = track.volume;
      if (track.mute) effectiveVol = 0;
      if (anySolo && !track.solo) effectiveVol = 0;

      nodes.gain.gain.setTargetAtTime(effectiveVol, time, 0.05);
      nodes.pan.pan.setTargetAtTime(track.pan, time, 0.05);
      
      nodes.eqLow.gain.setTargetAtTime(track.eqLow, time, 0.05);
      nodes.eqLow.frequency.setTargetAtTime(track.eqLowFreq, time, 0.05);
      
      nodes.eqLowMid.gain.setTargetAtTime(track.eqLowMid, time, 0.05);
      nodes.eqLowMid.frequency.setTargetAtTime(track.eqLowMidFreq, time, 0.05);
      
      nodes.eqHighMid.gain.setTargetAtTime(track.eqHighMid, time, 0.05);
      nodes.eqHighMid.frequency.setTargetAtTime(track.eqHighMidFreq, time, 0.05);
      
      nodes.eqHigh.gain.setTargetAtTime(track.eqHigh, time, 0.05);
      nodes.eqHigh.frequency.setTargetAtTime(track.eqHighFreq, time, 0.05);

      nodes.comp.threshold.setTargetAtTime(track.compThresh, time, 0.05);
      nodes.comp.ratio.setTargetAtTime(track.compRatio, time, 0.05);
      nodes.reverbSend.gain.setTargetAtTime(track.reverb, time, 0.05);
    });
  };

  useEffect(() => {
    applyStatesToNodes(trackStates, audioNodes.current, masterVolume);
  }, [trackStates, masterVolume]);

  useEffect(() => {
    const saved = localStorage.getItem('mixer_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets from localStorage", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mixer_presets', JSON.stringify(presets));
  }, [presets]);

  const saveCurrentPreset = () => {
    if (!newPresetName.trim()) return;
    const preset: MixerPreset = {
      id: crypto.randomUUID(),
      name: newPresetName.trim(),
      trackStates: JSON.parse(JSON.stringify(trackStates)),
      masterVolume,
      createdAt: new Date().toISOString()
    };
    setPresets(prev => [preset, ...prev]);
    setNewPresetName('');
    setShowPresetMenu(false);
  };

  const loadPreset = (preset: MixerPreset) => {
    setTrackStates(JSON.parse(JSON.stringify(preset.trackStates)));
    setMasterVolume(preset.masterVolume);
    setShowPresetMenu(false);
  };

  const deletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  const exportPresets = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(presets));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "mixer_presets.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importPresets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setPresets(prev => [...imported, ...prev]);
        }
      } catch (err) {
        console.error("Failed to import presets", err);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (!audioBlob) return;
    
    setIsReady(false);
    setIsPlaying(false);
    
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const masterGain = ctx.createGain();
    const masterAnalyzer = ctx.createAnalyser();
    masterGain.connect(masterAnalyzer);
    masterAnalyzer.connect(ctx.destination);

    const reverb = createReverb(ctx);
    reverb.connect(masterGain);

    const tracks = TRACKS.map((_, i) => {
      const eqLow = ctx.createBiquadFilter(); eqLow.type = 'lowshelf';
      const eqLowMid = ctx.createBiquadFilter(); eqLowMid.type = 'peaking'; eqLowMid.Q.value = 1.2;
      const eqHighMid = ctx.createBiquadFilter(); eqHighMid.type = 'peaking'; eqHighMid.Q.value = 1.2;
      const eqHigh = ctx.createBiquadFilter(); eqHigh.type = 'highshelf';

      const comp = ctx.createDynamicsCompressor();
      const pan = ctx.createStereoPanner();
      const gain = ctx.createGain();
      const reverbSend = ctx.createGain();
      const analyzer = ctx.createAnalyser();

      eqLow.connect(eqLowMid);
      eqLowMid.connect(eqHighMid);
      eqHighMid.connect(eqHigh);
      eqHigh.connect(comp);
      comp.connect(pan);
      pan.connect(gain);
      gain.connect(analyzer);
      analyzer.connect(masterGain);

      comp.connect(reverbSend);
      reverbSend.connect(reverb);

      let firstNode: AudioNode = eqLow;
      let splitterHp: BiquadFilterNode | undefined;
      let splitterLp: BiquadFilterNode | undefined;

      if (i === 0) {
        splitterHp = ctx.createBiquadFilter(); splitterHp.type = 'highpass'; splitterHp.frequency.value = 300;
        splitterLp = ctx.createBiquadFilter(); splitterLp.type = 'lowpass'; splitterLp.frequency.value = 3000;
        splitterHp.connect(splitterLp);
        splitterLp.connect(eqLow);
        firstNode = splitterHp;
      } else if (i === 1) {
        splitterHp = ctx.createBiquadFilter(); splitterHp.type = 'highpass'; splitterHp.frequency.value = 500;
        splitterLp = ctx.createBiquadFilter(); splitterLp.type = 'lowpass'; splitterLp.frequency.value = 5000;
        splitterHp.connect(splitterLp);
        splitterLp.connect(eqLow);
        firstNode = splitterHp;
      } else if (i === 2) {
        splitterLp = ctx.createBiquadFilter(); splitterLp.type = 'lowpass'; splitterLp.frequency.value = 300;
        splitterLp.connect(eqLow);
        firstNode = splitterLp;
      } else if (i === 3) {
        splitterHp = ctx.createBiquadFilter(); splitterHp.type = 'highpass'; splitterHp.frequency.value = 3000;
        splitterHp.connect(eqLow);
        firstNode = splitterHp;
      }

      return { eqLow, eqLowMid, eqHighMid, eqHigh, comp, pan, gain, reverbSend, analyzer, firstNode, source: null as AudioBufferSourceNode | null };
    });

    audioNodes.current = { ctx, masterGain, masterAnalyzer, reverb, tracks };
    applyStatesToNodes(trackStates, audioNodes.current, masterVolume);

    audioBlob.arrayBuffer()
      .then(ab => ctx.decodeAudioData(ab))
      .then(buf => {
        setBuffer(buf);
        setIsReady(true);
      })
      .catch(err => console.error("Error decoding audio:", err));

    return () => {
      ctx.close();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioBlob]);

  const updateMeters = () => {
    if (!audioNodes.current || !isPlaying) return;
    const { tracks, masterAnalyzer } = audioNodes.current;
    
    const newMeters = tracks.map((t: any) => {
      const data = new Uint8Array(t.analyzer.frequencyBinCount);
      t.analyzer.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      return avg / 255;
    });

    const masterData = new Uint8Array(masterAnalyzer.frequencyBinCount);
    masterAnalyzer.getByteFrequencyData(masterData);
    const masterAvg = masterData.reduce((a, b) => a + b, 0) / masterData.length;
    newMeters.push(masterAvg / 255);

    setMeters(newMeters);

    // Draw Visualizer
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        
        const barWidth = (width / masterData.length) * 2.5;
        let x = 0;

        for (let i = 0; i < masterData.length; i++) {
          const barHeight = (masterData[i] / 255) * height;
          const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
          grad.addColorStop(0, '#4f46e5'); // indigo-600
          grad.addColorStop(0.5, '#a855f7'); // purple-500
          grad.addColorStop(1, '#ec4899'); // pink-500
          ctx.fillStyle = grad;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      }
    }

    animationRef.current = requestAnimationFrame(updateMeters);
  };

  const togglePlay = async () => {
    if (!audioNodes.current || !buffer) return;
    const { ctx, tracks } = audioNodes.current;

    if (ctx.state === 'suspended') {
      if (!tracks[0].source) {
        tracks.forEach((t: any) => {
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;
          src.connect(t.firstNode);
          src.start();
          t.source = src;
        });
      }
      await ctx.resume();
      setIsPlaying(true);
      updateMeters();
    } else if (ctx.state === 'running') {
      await ctx.suspend();
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setMeters([0,0,0,0,0]);
    }
  };

  const updateTrack = (index: number, key: string, value: any) => {
    setTrackStates(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const RotaryKnob = ({ label, value, min, max, onChange, color = 'indigo' }: any) => {
    const percentage = (value - min) / (max - min);
    const rotation = -135 + (percentage * 270);
    
    const colorMap: any = {
      indigo: 'from-indigo-400 to-indigo-600',
      emerald: 'from-emerald-400 to-emerald-600',
      cyan: 'from-cyan-400 to-cyan-600',
      purple: 'from-purple-400 to-purple-600',
      gray: 'from-gray-300 to-gray-500',
    };

    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative w-10 h-10 rounded-full bg-gradient-to-b from-[#2a2a35] to-[#1a1a24] border border-[#3a3a45] shadow-[0_5px_10px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.1)] flex items-center justify-center cursor-pointer group hover:border-[#4a4a55] transition-colors">
          <input
            type="range" min={min} max={max} step={(max - min) / 100}
            value={value} onChange={e => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3a3a45] to-[#2a2a35] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center justify-center pointer-events-none">
             <div 
              className="w-full h-full rounded-full absolute transition-transform duration-75"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <div className={`w-1 h-3 bg-gradient-to-b ${colorMap[color]} absolute top-1 left-1/2 -translate-x-1/2 rounded-full shadow-[0_0_5px_currentColor]`} />
            </div>
          </div>
        </div>
        <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">{label}</span>
      </div>
    );
  };

  const LEDMeter = ({ level }: { level: number }) => {
    const segments = 16;
    return (
      <div className="w-2.5 h-40 bg-[#0a0a0c] rounded-full overflow-hidden flex flex-col-reverse gap-[1px] p-[2px] border border-white/5 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]">
        {Array.from({ length: segments }).map((_, i) => {
          const threshold = i / segments;
          const isActive = level > threshold;
          let color = 'bg-emerald-500';
          if (i > 10) color = 'bg-yellow-500';
          if (i > 13) color = 'bg-red-500';
          return (
            <div 
              key={i} 
              className={`flex-1 rounded-sm transition-all duration-75 ${isActive ? color + ' shadow-[0_0_8px_currentColor]' : 'bg-gray-800 opacity-20'}`} 
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-2xl border-t border-white/10">
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.1),0_5px_15px_rgba(0,0,0,0.5)]">
            <SlidersHorizontal className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-widest uppercase flex items-center gap-3">
              SSL-V Console <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] border border-indigo-500/30">PRO</span>
            </h2>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest flex items-center gap-2 mt-1">
              <Activity className="w-3 h-3 text-emerald-400" /> 4-Bus Neural Processing Engine
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Presets Menu */}
          <div className="relative">
            <button
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2.5 rounded-lg border border-white/10 transition-all text-[10px] font-bold uppercase tracking-widest"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              Presets <ChevronDown className={`w-3 h-3 transition-transform ${showPresetMenu ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showPresetMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden"
                >
                  <div className="p-4 border-b border-white/5 bg-black/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Save New Preset</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPresetName}
                        onChange={e => setNewPresetName(e.target.value)}
                        placeholder="Preset Name..."
                        className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-colors"
                        onKeyDown={e => e.key === 'Enter' && saveCurrentPreset()}
                      />
                      <button
                        onClick={saveCurrentPreset}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    {presets.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-[10px] uppercase tracking-widest italic">
                        No saved presets
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {presets.map(p => (
                          <div
                            key={p.id}
                            onClick={() => loadPreset(p)}
                            className="flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer group transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-200">{p.name}</span>
                              <span className="text-[8px] text-gray-500 font-mono">{new Date(p.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button
                              onClick={(e) => deletePreset(p.id, e)}
                              className="p-1.5 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
                    <button
                      onClick={exportPresets}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-gray-400 uppercase tracking-widest transition-colors"
                    >
                      <Download className="w-3 h-3" /> Export
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-2 py-2 rounded bg-white/5 hover:bg-white/10 text-[9px] font-bold text-gray-400 uppercase tracking-widest transition-colors cursor-pointer">
                      <Upload className="w-3 h-3" /> Import
                      <input type="file" accept=".json" onChange={importPresets} className="hidden" />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Visualizer */}
          <div className="hidden md:flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 uppercase tracking-widest">
              <Radio className="w-3 h-3 text-indigo-400" /> Master Spectrum
            </div>
            <div className="w-64 h-16 bg-[#0a0a0c] rounded-lg border border-white/5 shadow-inner overflow-hidden relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none" />
              <canvas ref={canvasRef} width={256} height={64} className="w-full h-full opacity-90" />
            </div>
          </div>

          <button
            onClick={togglePlay}
            disabled={!isReady}
            className="flex items-center gap-3 bg-gradient-to-b from-indigo-500 to-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:from-indigo-400 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_20px_rgba(99,102,241,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] border border-indigo-500/50"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            {isReady ? (isPlaying ? 'Pause' : 'Play Mix') : 'Loading Audio...'}
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {TRACKS.map((trackInfo, i) => {
          const state = trackStates[i];
          return (
            <div key={trackInfo.id} className="min-w-[140px] flex-1 bg-gradient-to-b from-[#111116] to-[#0a0a0c] border border-white/5 rounded-xl p-4 flex flex-col gap-6 shadow-inner relative group/track">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 mix-blend-overlay pointer-events-none rounded-xl" />
              {/* Header */}
              <div className="text-center border-b border-white/5 pb-3 relative z-10">
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full ${trackInfo.color} opacity-0 group-hover/track:opacity-100 transition-opacity shadow-[0_0_10px_currentColor]`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${trackInfo.text}`}>{trackInfo.name}</span>
                <div className={`w-full h-0.5 mt-2 rounded-full ${trackInfo.color} opacity-30`} />
              </div>

              {/* EQ & FX Knobs */}
              <div className="flex flex-col gap-4 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <RotaryKnob label="Hi Gain" value={state.eqHigh} min={-12} max={12} onChange={(v: number) => updateTrack(i, 'eqHigh', v)} color="cyan" />
                    <RotaryKnob label="Hi Freq" value={state.eqHighFreq} min={4000} max={16000} onChange={(v: number) => updateTrack(i, 'eqHighFreq', v)} color="gray" />
                  </div>
                  <div className="space-y-4">
                    <RotaryKnob label="H-Mid G" value={state.eqHighMid} min={-12} max={12} onChange={(v: number) => updateTrack(i, 'eqHighMid', v)} color="emerald" />
                    <RotaryKnob label="H-Mid F" value={state.eqHighMidFreq} min={1500} max={6000} onChange={(v: number) => updateTrack(i, 'eqHighMidFreq', v)} color="gray" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <RotaryKnob label="L-Mid G" value={state.eqLowMid} min={-12} max={12} onChange={(v: number) => updateTrack(i, 'eqLowMid', v)} color="purple" />
                    <RotaryKnob label="L-Mid F" value={state.eqLowMidFreq} min={400} max={1500} onChange={(v: number) => updateTrack(i, 'eqLowMidFreq', v)} color="gray" />
                  </div>
                  <div className="space-y-4">
                    <RotaryKnob label="Lo Gain" value={state.eqLow} min={-12} max={12} onChange={(v: number) => updateTrack(i, 'eqLow', v)} color="indigo" />
                    <RotaryKnob label="Lo Freq" value={state.eqLowFreq} min={40} max={400} onChange={(v: number) => updateTrack(i, 'eqLowFreq', v)} color="gray" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                  <RotaryKnob label="Rev" value={state.reverb} min={0} max={1} onChange={(v: number) => updateTrack(i, 'reverb', v)} color="indigo" />
                  <RotaryKnob label="Comp" value={state.compThresh} min={-60} max={0} onChange={(v: number) => updateTrack(i, 'compThresh', v)} color="gray" />
                  <RotaryKnob label="Pan" value={state.pan} min={-1} max={1} onChange={(v: number) => updateTrack(i, 'pan', v)} color="gray" />
                </div>
              </div>

              {/* Mute/Solo */}
              <div className="flex justify-center gap-2 mt-2 relative z-10">
                <button 
                  onClick={() => updateTrack(i, 'mute', !state.mute)}
                  className={`flex-1 h-8 text-[8px] font-bold rounded-md transition-all shadow-inner border flex items-center justify-center gap-1 ${state.mute ? 'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-[#1a1a24] text-gray-500 border-white/5 hover:bg-[#2a2a35] hover:text-gray-300'}`}
                >
                  <Volume2 className={`w-2.5 h-2.5 ${state.mute ? 'text-white' : 'text-gray-600'}`} />
                  MUTE
                </button>
                <button 
                  onClick={() => updateTrack(i, 'solo', !state.solo)}
                  className={`flex-1 h-8 text-[8px] font-bold rounded-md transition-all shadow-inner border flex items-center justify-center gap-1 ${state.solo ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-[#1a1a24] text-gray-500 border-white/5 hover:bg-[#2a2a35] hover:text-gray-300'}`}
                >
                  <Radio className={`w-2.5 h-2.5 ${state.solo ? 'text-black' : 'text-gray-600'}`} />
                  SOLO
                </button>
              </div>

              {/* Fader & Meter */}
              <div className="flex justify-center gap-6 mt-auto pt-6 border-t border-white/5 relative z-10">
                <LEDMeter level={meters[i] || 0} />
                <div className="relative h-40 w-10 flex justify-center group">
                  <div className="absolute top-0 bottom-0 w-1.5 bg-black rounded-full shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] border border-white/5" />
                  <div className="absolute top-0 bottom-0 w-6 flex flex-col justify-between py-2 pointer-events-none opacity-30">
                     {[...Array(9)].map((_, idx) => <div key={idx} className="w-full h-px bg-white" />)}
                  </div>
                  <input 
                    type="range" min="0" max="1.5" step="0.01" 
                    value={state.volume} 
                    onChange={e => updateTrack(i, 'volume', parseFloat(e.target.value))} 
                    className="fader-track absolute w-10 h-40 appearance-none bg-transparent outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-gray-300 [&::-webkit-slider-thumb]:to-gray-500 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:shadow-[0_5px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.3)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-600 cursor-pointer z-10 hover:[&::-webkit-slider-thumb]:from-gray-200 hover:[&::-webkit-slider-thumb]:to-gray-400 transition-all" 
                  />
                </div>
              </div>
              <div className="text-center text-[9px] font-mono text-gray-500 relative z-10">{Math.round(state.volume * 100)}%</div>
            </div>
          );
        })}

        {/* Master Bus */}
        <div className="min-w-[160px] bg-gradient-to-b from-[#1a1a24] to-[#0a0a0c] border border-indigo-500/30 rounded-xl p-4 flex flex-col gap-6 shadow-[0_0_30px_rgba(99,102,241,0.1),inset_0_1px_0_rgba(255,255,255,0.1)] relative ml-4 group/master">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-overlay rounded-xl" />
          <div className="text-center border-b border-indigo-500/20 pb-3 relative z-10">
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-500 opacity-0 group-hover/master:opacity-100 transition-opacity shadow-[0_0_10px_currentColor]`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Master Bus</span>
            <div className="w-full h-0.5 mt-2 rounded-full bg-indigo-500 opacity-50" />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-4 relative z-10">
             <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(99,102,241,0.2)] bg-[#0a0a0c]">
                <span className="text-sm font-mono text-indigo-300 font-bold">{Math.round(masterVolume * 100)}%</span>
             </div>
          </div>

          <div className="flex justify-center gap-8 mt-auto pt-6 border-t border-indigo-500/20 relative z-10">
            <LEDMeter level={meters[4] || 0} />
            <div className="relative h-48 w-12 flex justify-center group">
              <div className="absolute top-0 bottom-0 w-2 bg-black rounded-full shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] border border-white/5" />
              <div className="absolute top-0 bottom-0 w-8 flex flex-col justify-between py-2 pointer-events-none opacity-30">
                 {[...Array(11)].map((_, idx) => <div key={idx} className="w-full h-px bg-indigo-300" />)}
              </div>
              <input 
                type="range" min="0" max="1.5" step="0.01" 
                value={masterVolume} 
                onChange={e => setMasterVolume(parseFloat(e.target.value))} 
                className="fader-track absolute w-12 h-48 appearance-none bg-transparent outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-10 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-gradient-to-b [&::-webkit-slider-thumb]:from-indigo-400 [&::-webkit-slider-thumb]:to-indigo-600 [&::-webkit-slider-thumb]:rounded-sm [&::-webkit-slider-thumb]:shadow-[0_5px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.3)] [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-indigo-700 cursor-pointer z-10" 
              />
            </div>
          </div>
          <div className="text-center text-[10px] font-bold tracking-widest text-indigo-400/50 relative z-10">MASTER</div>
        </div>

      </div>
    </div>
  );
}
