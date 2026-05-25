import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, SlidersHorizontal, Volume2, Activity, Radio, Save, Download, 
  Upload, Trash2, Plus, ChevronDown, ChevronRight, Undo2, Redo2, 
  Maximize2, Minimize2, Mic, Music, Zap, Drum, Settings2, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MixerProps {
  audioBlob?: Blob;
}

interface MixerPreset {
  id: string;
  name: string;
  trackStates: TrackState[];
  masterVolume: number;
  createdAt: string;
}

interface TrackState {
  volume: number;
  pan: number;
  eqLow: number;
  eqLowFreq: number;
  eqLowMid: number;
  eqLowMidFreq: number;
  eqHighMid: number;
  eqHighMidFreq: number;
  eqHigh: number;
  eqHighFreq: number;
  compThresh: number;
  compRatio: number;
  reverb: number;
  mute: boolean;
  solo: boolean;
}

const TRACKS = [
  { id: 'vocal', name: 'Vocal/Lead', color: 'bg-studio-accent', text: 'text-studio-accent', icon: Mic, presets: ['Radio Vocal', 'Vintage Air', 'Crisp Lead'] },
  { id: 'harmony', name: 'Harmony/Pad', color: 'bg-studio-aqua', text: 'text-studio-aqua', icon: Music, presets: ['Warm Pad', 'Ethereal', 'Wide Chorus'] },
  { id: 'rhythm', name: 'Rhythm/Bass', color: 'bg-studio-yellow', text: 'text-studio-yellow', icon: Zap, presets: ['Sub Bass', 'Punchy Kick', 'Solid Low'] },
  { id: 'percussion', name: 'Percussion', color: 'bg-studio-fg', text: 'text-studio-fg', icon: Drum, presets: ['Pop Drums', 'Tight Snare', 'Roomy'] }
];

const PRESET_VALUES: Record<string, Partial<TrackState>> = {
  'Radio Vocal': { eqHigh: 4, eqHighMid: 2, eqLowMid: -2, eqLow: -4, compThresh: -24, compRatio: 4, reverb: 0.15 },
  'Vintage Air': { eqHigh: 6, eqHighMid: -2, eqLowMid: 0, eqLow: -6, compThresh: -20, compRatio: 3, reverb: 0.2 },
  'Crisp Lead': { eqHigh: 3, eqHighMid: 4, eqLowMid: -4, eqLow: -2, compThresh: -18, compRatio: 5, reverb: 0.1 },
  'Warm Pad': { eqHigh: -2, eqHighMid: -2, eqLowMid: 2, eqLow: 2, compThresh: -30, compRatio: 2, reverb: 0.4 },
  'Ethereal': { eqHigh: 4, eqHighMid: 0, eqLowMid: -4, eqLow: -6, compThresh: -35, compRatio: 1.5, reverb: 0.7 },
  'Wide Chorus': { eqHigh: 2, eqHighMid: 2, eqLowMid: 0, eqLow: 0, compThresh: -25, compRatio: 2.5, reverb: 0.3 },
  'Sub Bass': { eqHigh: -12, eqHighMid: -6, eqLowMid: 2, eqLow: 6, compThresh: -18, compRatio: 8, reverb: 0 },
  'Punchy Kick': { eqHigh: 0, eqHighMid: -4, eqLowMid: 2, eqLow: 4, compThresh: -12, compRatio: 6, reverb: 0.05 },
  'Solid Low': { eqHigh: -6, eqHighMid: -2, eqLowMid: 4, eqLow: 2, compThresh: -15, compRatio: 4, reverb: 0 },
  'Pop Drums': { eqHigh: 2, eqHighMid: 0, eqLowMid: -2, eqLow: 4, compThresh: -12, compRatio: 6, reverb: 0.05 },
  'Tight Snare': { eqHigh: 4, eqHighMid: 2, eqLowMid: 2, eqLow: -6, compThresh: -10, compRatio: 5, reverb: 0.1 },
  'Roomy': { eqHigh: 0, eqHighMid: 0, eqLowMid: 0, eqLow: 2, compThresh: -20, compRatio: 4, reverb: 0.4 },
};

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

function BusMiniStrip({ track, state, active, onClick, meter }: any) {
  const Icon = track.icon;
  return (
    <button
      onClick={onClick}
      className={`relative w-14 flex flex-col items-center py-6 border-r border-white/5 transition-all hover:bg-white/5 ${active ? 'bg-studio-accent/10' : 'bg-black/40'}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${track.color} shadow-[0_0_10px_currentColor] opacity-50`} />
      <div className="flex-1 flex flex-col items-center gap-8">
        <div className={`p-2 rounded-xl ${track.color} bg-opacity-10 border border-white/10 group-hover:border-white/20 transition-colors`}>
          <Icon className={`w-4 h-4 ${track.text}`} />
        </div>
        <div className="h-40 w-2 bg-black/60 rounded-full overflow-hidden flex flex-col-reverse p-[1px] border border-white/5">
          <div 
            className={`w-full rounded-full transition-all duration-75 ${track.color} shadow-[0_0_8px_currentColor]`} 
            style={{ height: `${meter.level * 100}%`, opacity: 0.4 + (meter.level * 0.6) }} 
          />
        </div>
        <div className="writing-mode-vertical text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 rotate-180">
          {track.name}
        </div>
      </div>
      <div className={`absolute bottom-4 w-2.5 h-2.5 rounded-full border border-black/40 ${state.mute ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : state.solo ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' : 'bg-gray-800'}`} />
    </button>
  );
}

export default function Mixer({ audioBlob }: MixerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [meters, setMeters] = useState<{level: number, gr: number}[]>(
    Array(5).fill({ level: 0, gr: 0 })
  );
  const [presets, setPresets] = useState<MixerPreset[]>([]);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [expandedBus, setExpandedBus] = useState<string | null>(null);
  const [showAllBuses, setShowAllBuses] = useState(false);
  const [showAdvancedMaster, setShowAdvancedMaster] = useState(false);
  
  // Master Macros
  const [masterTone, setMasterTone] = useState(0.5); // 0 = warm, 1 = bright
  const [masterSpace, setMasterSpace] = useState(0.3); // 0 = dry, 1 = wet/wide
  const [masterLoudness, setMasterLoudness] = useState(0.5); // 0 = dynamic, 1 = compressed

  const [trackStates, setTrackStates] = useState<TrackState[]>(
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

  // History for Undo/Redo
  const [history, setHistory] = useState<TrackState[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const audioNodes = useRef<any>(null);
  const animationRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pushToHistory = (states: TrackState[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(states)));
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setTrackStates(JSON.parse(JSON.stringify(prev)));
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setTrackStates(JSON.parse(JSON.stringify(next)));
      setHistoryIndex(historyIndex + 1);
    }
  };

  const applyStatesToNodes = (states: TrackState[], audioGraph: any, masterVol: number) => {
    if (!audioGraph) return;
    const { ctx, masterGain, tracks, masterEq, masterComp, masterReverbSend } = audioGraph;
    const anySolo = states.some(t => t.solo);

    masterGain.gain.setTargetAtTime(masterVol, ctx.currentTime, 0.05);
    
    // Apply Master Macros
    // Tone: Tilt EQ
    masterEq.low.gain.setTargetAtTime((1 - masterTone) * 6 - 3, ctx.currentTime, 0.1);
    masterEq.high.gain.setTargetAtTime(masterTone * 6 - 3, ctx.currentTime, 0.1);
    
    // Space: Global Reverb Send
    masterReverbSend.gain.setTargetAtTime(masterSpace * 0.5, ctx.currentTime, 0.1);
    
    // Loudness: Master Compression
    masterComp.threshold.setTargetAtTime(-20 - (masterLoudness * 20), ctx.currentTime, 0.1);
    masterComp.ratio.setTargetAtTime(2 + (masterLoudness * 10), ctx.currentTime, 0.1);

    states.forEach((track, i) => {
      const nodes = tracks[i];
      const time = ctx.currentTime;

      let effectiveVol = track.volume;
      if (track.mute) effectiveVol = 0;
      if (anySolo && !track.solo) effectiveVol = 0;

      nodes.gain.gain.setTargetAtTime(effectiveVol, time, 0.05);
      nodes.pan.pan.setTargetAtTime(track.pan, time, 0.05);
      
      nodes.eqLow.gain.setTargetAtTime(track.eqLow, time, 0.05);
      nodes.eqLowMid.gain.setTargetAtTime(track.eqLowMid, time, 0.05);
      nodes.eqHighMid.gain.setTargetAtTime(track.eqHighMid, time, 0.05);
      nodes.eqHigh.gain.setTargetAtTime(track.eqHigh, time, 0.05);

      nodes.comp.threshold.setTargetAtTime(track.compThresh, time, 0.05);
      nodes.comp.ratio.setTargetAtTime(track.compRatio, time, 0.05);
      nodes.reverbSend.gain.setTargetAtTime(track.reverb, time, 0.05);
    });
  };

  useEffect(() => {
    applyStatesToNodes(trackStates, audioNodes.current, masterVolume);
  }, [trackStates, masterVolume, masterTone, masterSpace, masterLoudness]);

  useEffect(() => {
    const saved = localStorage.getItem('mixer_presets');
    if (saved) {
      try {
        setPresets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load presets", e);
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
    pushToHistory(preset.trackStates);
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
    
    // Master EQ for Tone macro
    const masterEqLow = ctx.createBiquadFilter(); masterEqLow.type = 'lowshelf'; masterEqLow.frequency.value = 400;
    const masterEqHigh = ctx.createBiquadFilter(); masterEqHigh.type = 'highshelf'; masterEqHigh.frequency.value = 3000;
    
    // Master Compressor for Loudness macro
    const masterComp = ctx.createDynamicsCompressor();
    
    masterGain.connect(masterEqLow);
    masterEqLow.connect(masterEqHigh);
    masterEqHigh.connect(masterComp);
    masterComp.connect(masterAnalyzer);
    masterAnalyzer.connect(ctx.destination);

    const reverb = createReverb(ctx);
    reverb.connect(masterGain);
    
    const masterReverbSend = ctx.createGain();
    masterComp.connect(masterReverbSend);
    masterReverbSend.connect(reverb);

    const tracks = TRACKS.map((_, i) => {
      const eqLow = ctx.createBiquadFilter(); eqLow.type = 'lowshelf'; eqLow.frequency.value = 250;
      const eqLowMid = ctx.createBiquadFilter(); eqLowMid.type = 'peaking'; eqLowMid.Q.value = 1.2; eqLowMid.frequency.value = 800;
      const eqHighMid = ctx.createBiquadFilter(); eqHighMid.type = 'peaking'; eqHighMid.Q.value = 1.2; eqHighMid.frequency.value = 2500;
      const eqHigh = ctx.createBiquadFilter(); eqHigh.type = 'highshelf'; eqHigh.frequency.value = 8000;

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
      if (i === 0) {
        const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 100;
        hp.connect(eqLow); firstNode = hp;
      } else if (i === 2) {
        const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
        lp.connect(eqLow); firstNode = lp;
      }

      return { eqLow, eqLowMid, eqHighMid, eqHigh, comp, pan, gain, reverbSend, analyzer, firstNode, source: null as AudioBufferSourceNode | null };
    });

    audioNodes.current = { 
      ctx, masterGain, masterAnalyzer, reverb, tracks, 
      masterEq: { low: masterEqLow, high: masterEqHigh },
      masterComp, masterReverbSend
    };
    
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
    const { tracks, masterAnalyzer, masterComp } = audioNodes.current;
    
    const newMeters = tracks.map((t: any) => {
      const data = new Uint8Array(t.analyzer.frequencyBinCount);
      t.analyzer.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      const reduction = Math.abs(t.comp.reduction);
      return { level: avg / 255, gr: reduction / 20 };
    });

    const masterData = new Uint8Array(masterAnalyzer.frequencyBinCount);
    masterAnalyzer.getByteFrequencyData(masterData);
    const masterAvg = masterData.reduce((a, b) => a + b, 0) / masterData.length;
    const masterReduction = Math.abs(masterComp.reduction);
    newMeters.push({ level: masterAvg / 255, gr: masterReduction / 20 });

    setMeters(newMeters);

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
          ctx.fillStyle = `rgba(99, 102, 241, ${0.3 + (masterData[i]/255)})`;
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

  const handleTrackChangeEnd = () => {
    pushToHistory(trackStates);
  };

  const applyPresetToTrack = (index: number, presetName: string) => {
    const preset = PRESET_VALUES[presetName];
    if (preset) {
      setTrackStates(prev => {
        const next = [...prev];
        next[index] = { ...next[index], ...preset };
        return next;
      });
      pushToHistory(trackStates);
    }
  };

  // --- Sub-components ---

  const MacroKnob = ({ label, value, min, max, onChange, color = 'studio-accent', tooltip }: any) => {
    const percentage = (value - min) / (max - min);
    const rotation = -135 + (percentage * 270);
    
    return (
      <div className="flex flex-col items-center gap-2 group/knob relative">
        {tooltip && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-[9px] text-white px-3 py-1.5 rounded-lg opacity-0 group-hover/knob:opacity-100 transition-all scale-95 group-hover/knob:scale-100 whitespace-nowrap z-50 pointer-events-none border border-white/10 shadow-2xl">
            {tooltip}
          </div>
        )}
        <div className="relative w-14 h-14 rounded-full bg-[#1a1a24] border-2 border-white/5 shadow-[0_10px_20px_rgba(0,0,0,0.4)] flex items-center justify-center cursor-pointer group-hover/knob:border-white/10 transition-colors">
          <input
            type="range" min={min} max={max} step={(max - min) / 100}
            value={value} onChange={e => onChange(parseFloat(e.target.value))}
            onMouseUp={handleTrackChangeEnd}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-800 to-black shadow-inner flex items-center justify-center pointer-events-none border border-white/5">
             <div 
              className="w-full h-full rounded-full absolute transition-transform duration-75"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <div className={`w-1.5 h-4 bg-${color} absolute top-1 left-1/2 -translate-x-1/2 rounded-full shadow-[0_0_12px_currentColor]`} />
            </div>
          </div>
        </div>
        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest group-hover/knob:text-white transition-colors" title={tooltip || label}>{label}</span>
      </div>
    );
  };

  const ParametricEQ = ({ state, onChange }: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      
      // Vertical lines for frequencies (approximate logarithmic)
      const freqs = [100, 1000, 10000];
      freqs.forEach(f => {
        const x = (Math.log10(f) - 1.3) * (w / 3); // Very rough log scale
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      });

      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Draw Curve
      ctx.beginPath();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      
      const points = [
        { x: 0, y: h/2 - (state.eqLow * (h/30)) },
        { x: w/4, y: h/2 - (state.eqLowMid * (h/30)) },
        { x: w/2, y: h/2 - (state.eqHighMid * (h/30)) },
        { x: w, y: h/2 - (state.eqHigh * (h/30)) }
      ];

      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[i-1].x) / 2;
        const yc = (points[i].y + points[i-1].y) / 2;
        ctx.quadraticCurveTo(points[i-1].x, points[i-1].y, xc, yc);
      }
      ctx.lineTo(points[3].x, points[3].y);
      ctx.stroke();

      // Fill area
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      ctx.fill();

    }, [state]);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[8px] text-gray-500 uppercase font-bold px-1">
          <span>EQ Graph</span>
          <div className="flex gap-2">
            <span>100Hz</span>
            <span>1kHz</span>
            <span>10kHz</span>
          </div>
        </div>
        <div className="w-full h-24 bg-black/40 rounded border border-white/10 overflow-hidden relative group">
          <canvas ref={canvasRef} width={200} height={96} className="w-full h-full" />
          <div className="absolute inset-0 flex items-center justify-around opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
             <div className="flex flex-col gap-1">
               <input type="range" min="-12" max="12" value={state.eqLow} onChange={e => onChange('eqLow', parseFloat(e.target.value))} className="w-12 h-1 accent-indigo-500" />
               <span className="text-[6px] text-center text-white" title="Low Shelf">Low</span>
             </div>
             <div className="flex flex-col gap-1">
               <input type="range" min="-12" max="12" value={state.eqLowMid} onChange={e => onChange('eqLowMid', parseFloat(e.target.value))} className="w-12 h-1 accent-indigo-500" />
               <span className="text-[6px] text-center text-white" title="Low Mid Peaking">L-Mid</span>
             </div>
             <div className="flex flex-col gap-1">
               <input type="range" min="-12" max="12" value={state.eqHighMid} onChange={e => onChange('eqHighMid', parseFloat(e.target.value))} className="w-12 h-1 accent-indigo-500" />
               <span className="text-[6px] text-center text-white" title="High Mid Peaking">H-Mid</span>
             </div>
             <div className="flex flex-col gap-1">
               <input type="range" min="-12" max="12" value={state.eqHigh} onChange={e => onChange('eqHigh', parseFloat(e.target.value))} className="w-12 h-1 accent-indigo-500" />
               <span className="text-[6px] text-center text-white" title="High Shelf">High</span>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const LEDMeter = ({ level, gr = 0, height = 120 }: { level: number, gr?: number, height?: number }) => {
    const segments = 12;
    return (
      <div className="flex gap-1 items-end">
        {/* Main Level Meter */}
        <div className="w-2 bg-black rounded-full overflow-hidden flex flex-col-reverse gap-[1px] p-[1px] border border-white/5" style={{ height }}>
          {Array.from({ length: segments }).map((_, i) => {
            const threshold = i / segments;
            const isActive = level > threshold;
            let color = 'bg-emerald-500';
            if (i > 8) color = 'bg-yellow-500';
            if (i > 10) color = 'bg-red-500';
            return (
              <div 
                key={i} 
                className={`flex-1 rounded-sm transition-all duration-75 ${isActive ? color + ' shadow-[0_0_4px_currentColor]' : 'bg-gray-800 opacity-10'}`} 
              />
            );
          })}
        </div>
        {/* Gain Reduction Meter (Small) */}
        {gr > 0 && (
          <div className="w-1 bg-black rounded-full overflow-hidden flex flex-col gap-[1px] p-[0.5px] border border-white/5" style={{ height: height * 0.6 }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const threshold = i / 8;
              const isActive = gr > threshold;
              return (
                <div 
                  key={i} 
                  className={`flex-1 rounded-sm transition-all duration-75 ${isActive ? 'bg-orange-500 shadow-[0_0_2px_rgba(249,115,22,0.5)]' : 'bg-gray-800 opacity-5'}`} 
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-white/10 bg-[#0d0d12] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-studio-accent to-transparent opacity-50" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 pb-8 border-b border-white/5 gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-studio-accent flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.3)] border border-white/20">
            <SlidersHorizontal className="w-7 h-7 text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
              Sonance <span className="text-studio-accent">Pro Mixer</span>
            </h2>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="text-[10px] font-black text-studio-accent bg-studio-accent/10 px-2 py-0.5 rounded-full border border-studio-accent/20 uppercase tracking-[0.2em]">v2.5 Neural Core</span>
              <div className="flex items-center gap-2">
                <button onClick={undo} disabled={historyIndex <= 0} className="p-1.5 text-gray-500 hover:text-studio-accent disabled:opacity-20 transition-all hover:scale-110"><Undo2 className="w-4 h-4" /></button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-1.5 text-gray-500 hover:text-studio-accent disabled:opacity-20 transition-all hover:scale-110"><Redo2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex items-center gap-3 bg-black/60 p-1.5 rounded-xl border border-white/5 shadow-inner">
            <button 
              onClick={() => setShowAllBuses(!showAllBuses)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${showAllBuses ? 'bg-studio-accent text-black shadow-lg shadow-studio-accent/20' : 'text-gray-500 hover:text-white'}`}
            >
              Show All
            </button>
            <div className="w-px h-5 bg-white/10" />
            <button 
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-studio-accent flex items-center gap-2 transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Snapshots
            </button>
          </div>

          <button
            onClick={togglePlay}
            disabled={!isReady}
            className={`flex items-center gap-4 px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl border-2 ${isPlaying ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20' : 'bg-studio-accent border-white/20 text-black hover:bg-studio-yellow hover:scale-[1.02] active:scale-95'}`}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            {isReady ? (isPlaying ? 'Stop' : 'Play Mix') : 'Loading...'}
          </button>
        </div>
      </div>

      {/* Preset Menu Overlay */}
      <AnimatePresence>
        {showPresetMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPresetMenu(false)}
          >
            <div 
              className="w-full max-w-md bg-[#1a1a24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Mix Snapshots</h3>
                <button onClick={() => setShowPresetMenu(false)} className="text-gray-500 hover:text-white transition-colors"><Minimize2 className="w-4 h-4" /></button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={e => setNewPresetName(e.target.value)}
                    placeholder="New Snapshot Name..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button onClick={saveCurrentPreset} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors"><Plus className="w-4 h-4" /></button>
                </div>

                <div className="max-h-64 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {presets.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-indigo-500/30 transition-all group">
                      <div className="cursor-pointer flex-1" onClick={() => loadPreset(p)}>
                        <p className="text-xs font-bold text-gray-200">{p.name}</p>
                        <p className="text-[8px] text-gray-500 font-mono">{new Date(p.createdAt).toLocaleString()}</p>
                      </div>
                      <button onClick={(e) => deletePreset(p.id, e)} className="p-2 text-gray-600 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  {presets.length === 0 && <p className="text-center py-8 text-[10px] text-gray-600 uppercase tracking-widest italic">No snapshots saved yet</p>}
                </div>
              </div>

              <div className="p-4 bg-black/40 border-t border-white/5 flex gap-3">
                <button onClick={exportPresets} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded text-[9px] font-bold text-gray-400 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"><Download className="w-3.5 h-3.5" /> Export</button>
                <label className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded text-[9px] font-bold text-gray-400 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"><Upload className="w-3.5 h-3.5" /> Import<input type="file" accept=".json" onChange={importPresets} className="hidden" /></label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Mixer Grid */}
      <div className="flex bg-[#0a0a0c] rounded-2xl border border-white/5 overflow-hidden shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] h-[650px]">
        {/* Navigation Rail / Mini Strips */}
        {!showAllBuses && (
          <div className="flex border-r border-white/10 bg-black/60">
            {TRACKS.map((track, i) => (
              <BusMiniStrip 
                key={track.id}
                track={track}
                state={trackStates[i]}
                active={expandedBus === track.id}
                onClick={() => setExpandedBus(track.id)}
                meter={meters[i] || { level: 0, gr: 0 }}
              />
            ))}
            <button
              onClick={() => setExpandedBus('master')}
              className={`relative w-14 flex flex-col items-center py-6 transition-all hover:bg-white/5 ${expandedBus === 'master' ? 'bg-studio-accent/10' : 'bg-black/40'}`}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
              <div className="flex-1 flex flex-col items-center gap-8">
                <div className="p-2 rounded-xl bg-white/10 border border-white/10">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div className="h-40 w-2 bg-black/60 rounded-full overflow-hidden flex flex-col-reverse p-[1px] border border-white/5">
                  <div 
                    className="w-full rounded-full transition-all duration-75 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                    style={{ height: `${(meters[4]?.level || 0) * 100}%`, opacity: 0.4 + ((meters[4]?.level || 0) * 0.6) }} 
                  />
                </div>
                <div className="writing-mode-vertical text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 rotate-180">
                  MASTER
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Console Panel */}
        <div className="flex-1 overflow-x-auto custom-scrollbar bg-gradient-to-b from-[#16161e] to-[#0d0d12]">
          <div className="flex h-full min-w-max">
            {TRACKS.map((track, i) => {
              const isExpanded = expandedBus === track.id || showAllBuses;
              if (!isExpanded) return null;
              const state = trackStates[i];
              const Icon = track.icon;

              return (
                <motion.div 
                  key={track.id}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 340, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="flex flex-col border-r border-white/5 h-full relative group/strip"
                >
                  {/* Bus Header */}
                  <div className={`p-5 flex items-center justify-between ${track.color} bg-opacity-5 border-b border-white/5 relative overflow-hidden`}>
                    <div className={`absolute top-0 left-0 w-full h-0.5 ${track.color} opacity-30`} />
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-2xl ${track.color} bg-opacity-10 border border-white/10 shadow-inner`}>
                        <Icon className={`w-5 h-5 ${track.text}`} />
                      </div>
                      <div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{track.name}</h3>
                        <p className="text-[8px] text-gray-500 font-mono uppercase tracking-tighter">Channel {i + 1}</p>
                      </div>
                    </div>
                    {!showAllBuses && (
                      <button onClick={() => setExpandedBus(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-110">
                        <Minimize2 className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>

                  {/* Bus Content */}
                  <div className="flex-1 flex p-8 gap-10 overflow-y-auto custom-scrollbar bg-black/20">
                    {/* Meter & Fader */}
                    <div className="flex flex-col items-center gap-6">
                      <div className="bg-black/40 p-3 rounded-2xl border border-white/5 shadow-inner">
                        <LEDMeter level={meters[i]?.level || 0} gr={meters[i]?.gr || 0} height={220} />
                      </div>
                      
                      <div className="relative h-48 flex flex-col items-center group/fader">
                        <div className="absolute top-0 bottom-0 w-1.5 bg-black/60 rounded-full border border-white/5 shadow-inner" />
                        <input
                          type="range" min="0" max="1.5" step="0.01"
                          value={state.volume}
                          onChange={e => updateTrack(i, 'volume', parseFloat(e.target.value))}
                          onMouseUp={handleTrackChangeEnd}
                          className="absolute inset-0 w-8 h-full opacity-0 cursor-pointer z-10 writing-mode-vertical"
                          style={{ appearance: 'slider-vertical' }}
                        />
                        <motion.div 
                          className={`absolute w-10 h-14 rounded-lg shadow-2xl border-2 border-white/10 flex flex-col items-center justify-center cursor-pointer transition-colors ${state.volume > 1.0 ? 'bg-red-600' : 'bg-[#2a2a35] group-hover/fader:bg-[#3a3a45]'}`}
                          style={{ bottom: `${(state.volume / 1.5) * 100}%`, transform: 'translateY(50%)' }}
                        >
                          <div className="w-6 h-0.5 bg-white/20 rounded-full mb-1" />
                          <div className="w-8 h-1 bg-studio-accent rounded-full shadow-[0_0_8px_rgba(255,215,0,0.5)]" />
                          <div className="w-6 h-0.5 bg-white/20 rounded-full mt-1" />
                        </motion.div>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">{(state.volume * 100).toFixed(0)}%</span>
                    </div>
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => updateTrack(i, 'mute', !state.mute)}
                          className={`w-12 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${state.mute ? 'bg-red-500 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-black/40 border-white/5 text-gray-500 hover:text-gray-300'}`}
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => updateTrack(i, 'solo', !state.solo)}
                          className={`w-12 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${state.solo ? 'bg-studio-yellow border-studio-yellow/50 text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'bg-black/40 border-white/5 text-gray-500 hover:text-gray-300'}`}
                        >
                          <span className="text-xs font-black">S</span>
                        </button>
                      </div>

                    {/* Controls Column */}
                    <div className="flex-1 flex flex-col gap-8">
                      {/* Presets Chips */}
                      <div className="space-y-3">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Mix Presets</span>
                        <div className="flex flex-wrap gap-2">
                          {track.presets.map(p => (
                            <button
                              key={p}
                              onClick={() => applyPresetToTrack(i, p)}
                              className="px-3 py-1.5 rounded-lg bg-black/40 hover:bg-studio-accent/20 text-[8px] font-black text-gray-400 hover:text-studio-accent border border-white/5 transition-all uppercase tracking-widest"
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* EQ Section */}
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner">
                        <ParametricEQ state={state} onChange={(key: string, val: number) => updateTrack(i, key, val)} />
                      </div>

                      {/* Pan & Space */}
                      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                        <MacroKnob label="Pan" value={state.pan} min={-1} max={1} onChange={(v: number) => updateTrack(i, 'pan', v)} color="studio-fg" tooltip="Left/Right Balance" />
                        <MacroKnob label="Reverb" value={state.reverb} min={0} max={1} onChange={(v: number) => updateTrack(i, 'reverb', v)} color="studio-aqua" tooltip="Space/Depth" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Master Bus Column */}
            {(expandedBus === 'master' || showAllBuses) && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 360, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex flex-col border-r border-white/10 h-full bg-studio-accent/5 relative"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-studio-accent opacity-30" />
                <div className="p-5 flex items-center justify-between bg-black/40 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-2xl bg-studio-accent shadow-[0_0_20px_rgba(255,215,0,0.2)] border border-white/20">
                      <Activity className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Master Bus</h3>
                      <p className="text-[8px] text-studio-accent font-mono uppercase tracking-tighter">Final Output</p>
                    </div>
                  </div>
                  {!showAllBuses && (
                    <button onClick={() => setExpandedBus(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-110">
                      <Minimize2 className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>

                <div className="flex-1 flex p-8 gap-10 overflow-y-auto custom-scrollbar bg-black/40">
                  <div className="flex flex-col items-center gap-6">
                    <div className="bg-black/60 p-3 rounded-2xl border border-white/10 shadow-2xl">
                      <LEDMeter level={meters[4]?.level || 0} gr={meters[4]?.gr || 0} height={220} />
                    </div>
                    
                    <div className="relative h-48 flex flex-col items-center group/fader">
                      <div className="absolute top-0 bottom-0 w-2 bg-black/80 rounded-full border border-white/10 shadow-inner" />
                      <input
                        type="range" min="0" max="1.5" step="0.01"
                        value={masterVolume}
                        onChange={e => setMasterVolume(parseFloat(e.target.value))}
                        className="absolute inset-0 w-10 h-full opacity-0 cursor-pointer z-10 writing-mode-vertical"
                        style={{ appearance: 'slider-vertical' }}
                      />
                      <motion.div 
                        className={`absolute w-12 h-16 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] border-2 border-white/20 flex flex-col items-center justify-center cursor-pointer transition-colors ${masterVolume > 1.0 ? 'bg-red-600' : 'bg-studio-accent group-hover/fader:bg-studio-yellow'}`}
                        style={{ bottom: `${(masterVolume / 1.5) * 100}%`, transform: 'translateY(50%)' }}
                      >
                        <div className="w-8 h-0.5 bg-black/20 rounded-full mb-1" />
                        <div className="w-10 h-1.5 bg-black/40 rounded-full shadow-inner" />
                        <div className="w-8 h-0.5 bg-black/20 rounded-full mt-1" />
                      </motion.div>
                    </div>
                    <div className="w-12 h-10 rounded-xl bg-studio-accent/10 border-2 border-studio-accent/30 flex items-center justify-center text-studio-accent shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                      <Radio className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-10">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Master Macros</span>
                        <button 
                          onClick={() => setShowAdvancedMaster(!showAdvancedMaster)}
                          className="text-[9px] font-black text-studio-accent hover:text-studio-yellow uppercase tracking-widest transition-colors"
                        >
                          {showAdvancedMaster ? 'Basic' : 'Advanced'}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8">
                        <MacroKnob label="Tone" value={masterTone} min={0} max={1} onChange={setMasterTone} color="studio-yellow" tooltip="Warm to Bright" />
                        <MacroKnob label="Space" value={masterSpace} min={0} max={1} onChange={setMasterSpace} color="studio-aqua" tooltip="Global Reverb" />
                        <MacroKnob label="Loudness" value={masterLoudness} min={0} max={1} onChange={setMasterLoudness} color="red-500" tooltip="Master Compression" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Output Visualizer</span>
                      <div className="w-full h-32 bg-black/80 rounded-2xl border border-white/10 overflow-hidden shadow-inner relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-studio-accent/5 to-transparent pointer-events-none" />
                        <canvas ref={canvasRef} width={300} height={128} className="w-full h-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      {/* Global CSS for Vertical Faders */}
      <style>{`
        .fader-vertical {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          width: 192px !important; /* Match height of container */
          height: 40px !important;
          transform: rotate(-90deg) translate(-76px, 0px); /* Center in container */
          margin: 0;
        }
        .fader-vertical::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          background: transparent;
        }
        .fader-vertical::-webkit-slider-thumb {
          height: 32px;
          width: 20px;
          border-radius: 4px;
          background: #27272a;
          cursor: pointer;
          -webkit-appearance: none;
          margin-top: -14px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
          border: 1px solid #09090b;
          background-image: linear-gradient(to right, transparent 45%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.1) 55%, transparent 55%);
        }
        .fader-vertical:hover::-webkit-slider-thumb {
          background: #3f3f46;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .writing-mode-vertical {
          writing-mode: vertical-rl;
        }
      `}</style>
    </div>
  );
}
