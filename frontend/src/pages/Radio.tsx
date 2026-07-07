import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Flame,
  Music2,
  Share2,
  Layers,
  Mic2,
  Heart,
  CloudRain,
  Moon,
  Sun,
  Activity,
  Sliders,
  Download,
  Settings,
  Cpu,
  Waves,
  Zap,
  Wind,
  Send,
  Users,
  MessageSquare,
  TrendingUp,
  Undo2,
  Redo2,
  ChevronDown,
  Headphones,
  Shield,
  History,
  X,
  Sparkles,
  Radio,
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { VibeParams } from '../radio/lib/gemini';
import { LiveSession } from '../radio/components/LiveSession';
import { RadioDirectoryPage } from '../features/radio/pages/RadioDirectoryPage';
import { LivePartyDJRoom } from '../features/radio/pages/LivePartyDJRoom';
import { getPresets, getUserStations, type StationPreset, type UserStation } from '../features/radio/config/externalStations';
import { generateTrack } from '../features/radio/api/radioApi';
import api from '../lib/api';

const STEM_NAMES = ['vocals', 'bass', 'drums', 'melody'] as const;
type StemName = typeof STEM_NAMES[number];
type StemNumberState = Record<StemName, number>;
type StemBooleanState = Record<StemName, boolean>;

const DEFAULT_STEM_VOLUMES: StemNumberState = {
  vocals: 100,
  bass: 100,
  drums: 100,
  melody: 100,
};

const DEFAULT_STEM_FLAGS: StemBooleanState = {
  vocals: false,
  bass: false,
  drums: false,
  melody: false,
};

const ARCHETYPE_PRESETS = {
  Genre: ['Corrido', 'Rio Drift Phonk', 'Ambient', 'Chicano Soul', '90s R&B', 'Cyberpunk', 'Trap Soul'],
  Mood: ['Sad Country Loss', 'Late-Night Honesty', 'Backyard Joy', 'Melancholy Oldies', 'Vulcanized Energy', 'Nostalgic Pain'],
  Era: ['60s Art Laboe', '70s Funk', '90s R&B', '2000s Heartbreak', 'Modern Tumbado', 'Future Noir'],
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}

function crc32(bytes: Uint8Array) {
  let crc = -1;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ -1) >>> 0;
}

function createZipBlob(files: Array<{ name: string; text: string }>) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  const u16 = (value: number) => [value & 255, (value >>> 8) & 255];
  const u32 = (value: number) => [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];

  files.forEach(file => {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.text);
    const checksum = crc32(data);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(checksum), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0),
      ...name, ...data,
    ]);
    chunks.push(local);
    central.push(new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(checksum), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...name,
    ]));
    offset += local.length;
  });

  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length),
    ...u32(centralSize), ...u32(offset), ...u16(0),
  ]);

  return new Blob([...chunks, ...central, end], { type: 'application/zip' });
}

// --- Types ---
interface Track {
  id: string;
  title: string;
  artist: string;
  vibe: string;
  params: VibeParams;
  audioUrl?: string;
  lyrics?: string;
  isRemix?: boolean;
  originalCreatorName?: string;
  parentTrackTitle?: string;
  // Soulfire specific metadata
  trackMetadata?: any;
  ghostwriterDirective?: any;
  vocalBlueprint?: any;
  acousticPrimitives?: any;
  lyricsPayload?: any[];
  vocalPipelines?: { name: string; description: string; active: boolean; intensity?: number }[];
  // Ground truth for what actually generated this track — must be checked
  // before displaying any engine name; never assume "primary" by default.
  fulfillment?: "primary" | "secondary" | "fallback";
  voiceFulfillment?: "primary" | "secondary" | "none_by_design" | "none_failed";
}

/** Renders nothing for a genuine primary-engine track; a visible badge otherwise. */
const FulfillmentBadge = ({ fulfillment }: { fulfillment?: Track["fulfillment"] }) => {
  if (!fulfillment || fulfillment === "primary") return null;
  const label = fulfillment === "secondary" ? "Studio Backup Engine" : "Fallback Mix — Not AI-Generated";
  const color = fulfillment === "secondary" ? "text-amber-400 border-amber-400/40" : "text-red-400 border-red-400/40";
  return (
    <span className={`ml-2 inline-block text-[10px] uppercase tracking-wide border rounded px-1.5 py-0.5 ${color}`}>
      {label}
    </span>
  );
};

// --- Components ---

const VibeBar = ({ onGenerate, initialVibe = '' }: { onGenerate: (vibe: string) => void; initialVibe?: string }) => {
  const [vibe, setVibe] = useState(initialVibe);
  const [mode, setMode] = useState<'quick' | 'sculptor'>('quick');
  const [presetCategory, setPresetCategory] = useState<keyof typeof ARCHETYPE_PRESETS>('Genre');
  const [sculpt, setSculpt] = useState({
    genre: 'Chicano Soul',
    mood: 'melancholy',
    scenario: 'cruising down neon SGV streets at 2am',
    influence: 'Sade, Johnny Cash, Tupac',
  });

  useEffect(() => {
    setVibe(initialVibe);
  }, [initialVibe]);

  const buildSculptPrompt = () => {
    return `${sculpt.mood} ${sculpt.genre} song for ${sculpt.scenario}. Artist references: ${sculpt.influence}.`;
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto group space-y-4">
      <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-6 py-4 shadow-2xl">
        <Search className="w-5 h-5 text-white/40 mr-4" />
        <input
          type="text"
          value={mode === 'quick' ? vibe : buildSculptPrompt()}
          onChange={(e) => setVibe(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onGenerate(mode === 'quick' ? vibe : buildSculptPrompt())}
          placeholder="I need a song for a late-night drive in the rain..."
          className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/20 text-lg font-light"
          readOnly={mode === 'sculptor'}
        />
        <button
          onClick={() => onGenerate(mode === 'quick' ? vibe : buildSculptPrompt())}
          className="ml-4 p-2 bg-white text-black rounded-full hover:scale-110 transition-transform active:scale-95"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>
      </div>
      <div className="relative rounded-2xl border border-white/10 bg-black/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-xl bg-white/5 p-1">
            {(['quick', 'sculptor'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className={cn(
                  "px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all",
                  mode === tab ? "bg-fuchsia-500 text-black" : "text-white/45 hover:text-white"
                )}
              >
                {tab === 'quick' ? 'Quick Prompt' : 'Vibe Sculptor'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-mono uppercase tracking-widest text-white/30">Pro Archetype Presets</span>
            <select
              value={presetCategory}
              onChange={(e) => setPresetCategory(e.target.value as keyof typeof ARCHETYPE_PRESETS)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-white outline-none"
            >
              {Object.keys(ARCHETYPE_PRESETS).map(category => (
                <option key={category} value={category} className="bg-black">{category}</option>
              ))}
            </select>
          </div>
        </div>
        {mode === 'sculptor' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {[
              ['genre', 'Core Genre / Archetype'],
              ['mood', 'Aesthetic Mood'],
              ['scenario', 'Scenario Landscape'],
              ['influence', 'Artist Influence'],
            ].map(([key, label]) => (
              <label key={key} className="space-y-1">
                <span className="text-[8px] font-mono uppercase tracking-widest text-white/35">{label}</span>
                <input
                  value={(sculpt as any)[key]}
                  onChange={(e) => setSculpt(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-fuchsia-500/50"
                />
              </label>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {ARCHETYPE_PRESETS[presetCategory].map(preset => (
            <button
              key={preset}
              onClick={() => {
                if (presetCategory === 'Genre') setSculpt(prev => ({ ...prev, genre: preset }));
                if (presetCategory === 'Mood') setSculpt(prev => ({ ...prev, mood: preset }));
                if (presetCategory === 'Era') setSculpt(prev => ({ ...prev, scenario: `${prev.scenario}, ${preset} texture` }));
                setVibe(preset);
              }}
              className="px-3 py-2 rounded-full border border-white/10 bg-white/5 text-[9px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AuraVisualizer = ({ active }: { active: boolean }) => {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br from-[#0a0502] via-[#1a0a05] to-[#0a0502] transition-opacity duration-1000",
        active ? "opacity-100" : "opacity-0"
      )} />
      <motion.div
        animate={{
          scale: active ? [1, 1.2, 1] : 1,
          opacity: active ? [0.3, 0.5, 0.3] : 0,
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          scale: active ? [1, 1.3, 1] : 1,
          opacity: active ? [0.2, 0.4, 0.2] : 0,
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[100px]"
      />
    </div>
  );
};

export function RadioPage() {
  const [initialVibe] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('vibe') || window.localStorage.getItem('lyrica:lastVibePrompt') || '';
  });
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [auraStreamActive, setAuraStreamActive] = useState(false);
  const [listenerContext, setListenerContext] = useState({
    timeOfDay: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    weather: 'Requesting location...',
    heartRate: undefined as number | undefined,
  });
  const [showLyrics, setShowLyrics] = useState(false);
  const [auraMode, setAuraMode] = useState(false);
  const [proMode, setProMode] = useState(false);
  const [emotionalMode, setEmotionalMode] = useState<'Pain' | 'Playful' | 'Mirror'>('Mirror');
  const [biometricSync, setBiometricSync] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [sampleRate, setSampleRate] = useState<'44.1kHz' | '48kHz' | '96kHz'>('48kHz');
  const [bitDepth, setBitDepth] = useState<'16-bit' | '24-bit' | '32-bit float'>('24-bit');

  const [showLiveBanner, setShowLiveBanner] = useState(false);
  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Station Directory mode
  const [mode, setMode] = useState<"sonance" | "directory" | "party_dj">("sonance");
  const [externalStationPlaying, setExternalStationPlaying] = useState<StationPreset | UserStation | null>(null);
  const externalAudioRef = useRef<HTMLAudioElement | null>(null);

  // Handle external station playback
  const handlePlayStation = (station: StationPreset | UserStation) => {
    if (externalAudioRef.current) {
      externalAudioRef.current.pause();
      externalAudioRef.current = null;
    }
    if (station.streamUrl) {
      const audio = new Audio(station.streamUrl);
      audio.play().catch(e => console.error("Station playback failed", e));
      externalAudioRef.current = audio;
      setExternalStationPlaying(station);
    }
  };

  const handleStopStation = () => {
    if (externalAudioRef.current) {
      externalAudioRef.current.pause();
      externalAudioRef.current = null;
    }
    setExternalStationPlaying(null);
  };

  // Cleanup external audio on unmount
  useEffect(() => {
    return () => {
      if (externalAudioRef.current) {
        externalAudioRef.current.pause();
        externalAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (showLyrics && currentTrack?.lyricsPayload) {
      const lineDuration = duration / currentTrack.lyricsPayload.length;
      const activeIdx = Math.floor(currentTime / lineDuration);
      if (lyricRefs.current[activeIdx]) {
        lyricRefs.current[activeIdx]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentTime, duration, showLyrics, currentTrack?.lyricsPayload]);

  useEffect(() => {
    const timer = setTimeout(() => setShowLiveBanner(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const tick = () => {
      setListenerContext(prev => ({
        ...prev,
        timeOfDay: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      }));
    };
    tick();
    const timer = window.setInterval(tick, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setListenerContext(prev => ({ ...prev, weather: 'Location unavailable' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code,wind_speed_10m`
          );
          const weather = await response.json();
          const current = weather.current;
          const summary = current
            ? `${Math.round(current.temperature_2m)}°F, code ${current.weather_code}, wind ${Math.round(current.wind_speed_10m)}`
            : 'Weather unavailable';
          setListenerContext(prev => ({ ...prev, weather: summary }));
        } catch {
          setListenerContext(prev => ({ ...prev, weather: 'Weather unavailable' }));
        }
      },
      () => setListenerContext(prev => ({ ...prev, weather: 'Location blocked' })),
      { maximumAge: 10 * 60 * 1000, timeout: 6000 }
    );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedMix = params.get('mix');
    if (!encodedMix) return;

    try {
      const mix = JSON.parse(atob(encodedMix));
      setStemVolumes({ ...DEFAULT_STEM_VOLUMES, ...mix.volumes });
      setStemMute({ ...DEFAULT_STEM_FLAGS, ...mix.mute });
      setStemSolo({ ...DEFAULT_STEM_FLAGS, ...mix.solo });
    } catch {
      setError('That mixer link could not be loaded.');
    }
  }, []);

  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showFlipModal, setShowFlipModal] = useState(false);
  const [flipInput, setFlipInput] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [librarySort, setLibrarySort] = useState<'date' | 'alpha' | 'vibe'>('date');
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([]);
  const [trackNotes, setTrackNotes] = useState<Array<{ id: string; trackId: string; time: number; text: string }>>([]);
  const [noteInput, setNoteInput] = useState('');
  const [reactionCounts, setReactionCounts] = useState<Record<string, Record<string, number>>>({});
  const [draggedPipelineId, setDraggedPipelineId] = useState<string | null>(null);
  const [freezeElements, setFreezeElements] = useState({
    vocals: false,
    beat: false,
    lyrics: false,
  });
  const [flipTempo, setFlipTempo] = useState<'same' | 'slower' | 'faster'>('same');

  const [history, setHistory] = useState<Track[]>([]);

  const loadTrackFromHistory = (track: Track) => {
    setCurrentTrack(track);
    setParamsHistory([track.params]);
    setParamsHistoryIndex(0);
    setIsPlaying(true);
    setShowHistoryDropdown(false);
  };

  const filteredHistory = history
    .filter(track => {
      const query = librarySearch.trim().toLowerCase();
      if (!query) return true;
      return track.title.toLowerCase().includes(query) || track.artist.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (librarySort === 'alpha') return a.title.localeCompare(b.title);
      if (librarySort === 'vibe') return (a.params.style || a.vibe).localeCompare(b.params.style || b.vibe);
      return history.indexOf(a) - history.indexOf(b);
    });

  const downloadLibraryMetadata = (tracks = history, format: 'json' | 'csv' = 'json') => {
    if (format === 'csv') {
      const rows = [
        ['id', 'title', 'artist', 'vibe', 'style', 'mood', 'tempo', 'key'],
        ...tracks.map(track => [
          track.id,
          track.title,
          track.artist,
          track.vibe,
          track.params.style,
          track.params.mood,
          track.params.tempo,
          track.params.key,
        ]),
      ];
      const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      downloadBlob(new Blob([csv], { type: 'text/csv' }), 'lyrica-library.csv');
      return;
    }

    downloadBlob(
      new Blob([JSON.stringify(tracks, null, 2)], { type: 'application/json' }),
      'lyrica-library.json'
    );
  };

  const downloadSelectedMetadataZip = () => {
    const selected = history.filter(track => selectedTrackIds.includes(track.id));
    if (selected.length === 0) return;
    const payload = selected.map(track => ({
      name: `${track.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || track.id}.json`,
      text: JSON.stringify(track, null, 2),
    }));
    downloadBlob(createZipBlob(payload), 'lyrica-selected-tracks.zip');
  };

  const downloadTrackSummaryPdf = async (track: Track) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(track.title, 18, 24);
    doc.setFontSize(11);
    doc.text(`Sonance Ledger ID: ${track.id}`, 18, 38);
    doc.text(`Creator: ${track.artist}`, 18, 48);
    doc.text(`Vibe: ${track.vibe}`, 18, 58, { maxWidth: 170 });
    doc.text(`Style: ${track.params.style || 'Unspecified'}`, 18, 78);
    doc.text(`Mood: ${track.params.mood || 'Unspecified'}`, 18, 88);
    doc.text(`Tempo: ${track.params.tempo || 'Auto'} BPM`, 18, 98);
    doc.text(`Key: ${track.params.key || 'Auto'}`, 18, 108);
    doc.save(`${track.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-summary.pdf`);
  };

  const handleExportStems = () => {
    setIsExporting(true);
    setExportProgress(0);

    console.log(`Exporting in ${exportFormat} format...`);
    console.log(`Sample Rate: ${sampleRate}, Bit Depth: ${bitDepth}`);
    console.log(`AI Watermarking (SynthID): ${aiWatermarking ? 'ENABLED' : 'DISABLED'}`);

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsExporting(false), 1000);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const [paramsHistory, setParamsHistory] = useState<VibeParams[]>([]);
  const [paramsHistoryIndex, setParamsHistoryIndex] = useState(-1);
  const [exportFormat, setExportFormat] = useState<'WAV' | 'MP3' | 'Stems' | 'MIDI' | 'Dolby Atmos'>('WAV');
  const [showExportOptions, setShowExportOptions] = useState(false);

  const [isMastering, setIsMastering] = useState(false);
  const [masteringProgress, setMasteringProgress] = useState(0);
  const [isMastered, setIsMastered] = useState(false);
  const [masteringStage, setMasteringStage] = useState("");

  const [masteringParams, setMasteringParams] = useState({
    eqLow: 0.5,
    eqMid: 0.5,
    eqHigh: 0.5,
    compression: 0.4,
    limiting: 0.3
  });

  const [melodyStyle, setMelodyStyle] = useState<'Soaring' | 'Rhythmic' | 'Subtle'>('Soaring');
  const [voicePersona, setVoicePersona] = useState<'Singer' | 'Podcast Host' | 'Narrator'>('Singer');
  const [isGeneratingMelody, setIsGeneratingMelody] = useState(false);
  const [hasMelodyLayer, setHasMelodyLayer] = useState(false);

  const [edgeProcessing, setEdgeProcessing] = useState(false);
  const [spatialAudio, setSpatialAudio] = useState(false);
  const [aiWatermarking, setAiWatermarking] = useState(true);

  // Soulfire Sonance Sentinel (SSS) State
  const [cfmEnabled, setCfmEnabled] = useState(true);
  const [pnisEnabled, setPnisEnabled] = useState(true);
  const [showSri, setShowSri] = useState(false);

  const [stemVolumes, setStemVolumes] = useState<StemNumberState>(DEFAULT_STEM_VOLUMES);
  const [stemMute, setStemMute] = useState<StemBooleanState>(DEFAULT_STEM_FLAGS);
  const [stemSolo, setStemSolo] = useState<StemBooleanState>(DEFAULT_STEM_FLAGS);
  const [mixCopied, setMixCopied] = useState(false);

  const [activeVocalPipelines, setActiveVocalPipelines] = useState([
    { id: 'sade', name: "Sade / Teena Marie", description: "Velvety proximity & plate reverb", active: true, intensity: 85 },
    { id: 'cardi', name: "Cardi B / Snow", description: "Staccato triplet flows", active: false, intensity: 70 },
    { id: 'keith', name: "Keith Sweat", description: "90s begging cadence", active: false, intensity: 60 },
    { id: 'ana', name: "Ana Gabriel", description: "Raw Ranchera chest-belt", active: false, intensity: 50 },
    { id: 'shady', name: "Shady Boy (Anchor)", description: "Authentic Chicano grit", active: true, intensity: 100 }
  ]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.warn("Autoplay blocked or failed:", err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack?.audioUrl]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMasterTrack = async () => {
    setIsMastering(true);
    setMasteringProgress(0);
    setIsMastered(false);

    const stages = ["Analyzing Track...", "Applying EQ...", "Compressing...", "Limiting..."];

    for (let i = 0; i < stages.length; i++) {
      setMasteringStage(stages[i]);
      for (let p = 0; p <= 25; p += 5) {
        setMasteringProgress((i * 25) + p);
        await new Promise(r => setTimeout(r, 100));
      }
    }

    setMasteringStage("Mastered");
    setIsMastering(false);
    setIsMastered(true);
  };

  const handleGenerateMelody = async () => {
    setIsGeneratingMelody(true);
    await new Promise(r => setTimeout(r, 2000));
    setHasMelodyLayer(true);
    setIsGeneratingMelody(false);
  };

  const handleMidiImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      console.log("Imported MIDI:", e.target.files[0].name);
      // In a real app, this would parse the MIDI and update params
    }
  };

  const handleParamChange = (paramName: keyof VibeParams, value: number) => {
    if (currentTrack) {
      const newParams = {
        ...currentTrack.params,
        [paramName]: value
      };
      setCurrentTrack({
        ...currentTrack,
        params: newParams
      });

      const newHistory = paramsHistory.slice(0, paramsHistoryIndex + 1);
      newHistory.push(newParams);
      setParamsHistory(newHistory);
      setParamsHistoryIndex(newHistory.length - 1);
    }
  };

  const handleUndo = () => {
    if (paramsHistoryIndex > 0 && currentTrack) {
      const newIndex = paramsHistoryIndex - 1;
      setParamsHistoryIndex(newIndex);
      setCurrentTrack({
        ...currentTrack,
        params: paramsHistory[newIndex]
      });
    }
  };

  const handleRedo = () => {
    if (paramsHistoryIndex < paramsHistory.length - 1 && currentTrack) {
      const newIndex = paramsHistoryIndex + 1;
      setParamsHistoryIndex(newIndex);
      setCurrentTrack({
        ...currentTrack,
        params: paramsHistory[newIndex]
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '');
      if (!isTyping && e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setProMode(prev => !prev);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowHistoryDropdown(prev => !prev);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paramsHistory, paramsHistoryIndex, currentTrack, isPlaying]);

  const buildContextPrompt = () => {
    const heartRateText = biometricSync && listenerContext.heartRate
      ? `${listenerContext.heartRate} BPM heart rate`
      : 'no live heart-rate signal';
    return `Aura Streams real-time context: time ${listenerContext.timeOfDay}; weather ${listenerContext.weather}; ${heartRateText}.`;
  };

  const handleGenerate = async (vibe: string, remixSource?: Track) => {
    if (!vibe) return;
    setIsGenerating(true);
    setAuraMode(true);
    setError(null);

    try {
      const context = {
        weather: listenerContext.weather,
        time: listenerContext.timeOfDay,
        heartRate: biometricSync ? listenerContext.heartRate : undefined,
      };

      const prompt = remixSource
        ? `Flip It remix of "${remixSource.title}" by ${remixSource.artist}. Keep original attribution. User directive: ${vibe}. ${buildContextPrompt()}`
        : `${vibe}. ${buildContextPrompt()}`;

      const data = await generateTrack(prompt, context, emotionalMode);

      const params: VibeParams = data.params || {};
      params.emotionalMode = emotionalMode;

      const newTrack: Track = {
        id: data.track_id || Date.now().toString(),
        title: data.title || (vibe.length > 20 ? vibe.substring(0, 20) + "..." : vibe),
        artist: data.artist || "Lyria-3-Pro Engine",
        vibe: data.vibe || vibe,
        params,
        audioUrl: data.audioUrl || data.fallbackAudioUrl,
        lyrics: data.lyrics || params.lyrics,
        isRemix: Boolean(remixSource),
        originalCreatorName: remixSource?.artist,
        parentTrackTitle: remixSource?.title,
        fulfillment: data.fulfillment,
        voiceFulfillment: data.voiceFulfillment,
      };

      if (data.cognitivePipeline) {
        newTrack.trackMetadata = data.cognitivePipeline.result?.soulfire_blueprint?.track_metadata;
        newTrack.vocalPipelines = [
          { name: "Sade / Teena Marie", description: "Velvety proximity & plate reverb", active: true, intensity: 85 },
          { name: "Shady Boy (Anchor)", description: "Authentic Chicano grit", active: true, intensity: 100 },
        ];
      }

      setCurrentTrack(newTrack);
      setHistory(prev => [newTrack, ...prev]);
      setParamsHistory([params]);
      setParamsHistoryIndex(0);
      setIsPlaying(true);
    } catch (err: any) {
      console.error("Generation failed", err);
      setError(err.message || "Failed to generate track. Please ensure the API server is running.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartAuraStream = () => {
    setAuraStreamActive(true);
    handleGenerate(`Create an endless Aura Streams segment that evolves with my current context. Shape mood, tempo, key, vocal tone, and arrangement around ${buildContextPrompt()}`);
  };

  const handlePairHeartRate = async () => {
    const bluetooth = (navigator as any).bluetooth;
    if (!bluetooth) {
      setError('Heart-rate pairing needs a browser with Web Bluetooth support.');
      return;
    }

    try {
      const device = await bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] });
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('heart_rate');
      const characteristic = await service?.getCharacteristic('heart_rate_measurement');
      await characteristic?.startNotifications();
      characteristic?.addEventListener('characteristicvaluechanged', (event: any) => {
        const value = event.target.value as DataView;
        const flags = value.getUint8(0);
        const heartRate = flags & 0x01 ? value.getUint16(1, true) : value.getUint8(1);
        setListenerContext(prev => ({ ...prev, heartRate }));
      });
    } catch (err: any) {
      setError(err?.message || 'Heart-rate device pairing was cancelled.');
    }
  };

  useEffect(() => {
    if (!auraStreamActive) return;
    const timer = window.setInterval(() => {
      handleGenerate(`Continue Aura Streams with a fresh evolution. Adjust tempo, key, groove, and vocal color to ${buildContextPrompt()}`);
    }, 90000);
    return () => window.clearInterval(timer);
  }, [auraStreamActive, listenerContext, emotionalMode, biometricSync]);

  const updateStemVolume = (stem: StemName, volume: number) => {
    setStemVolumes(prev => ({ ...prev, [stem]: volume }));
  };

  const stemHasSolo = Object.values(stemSolo).some(Boolean);

  const getStemAudibleLevel = (stem: StemName) => {
    if (stemMute[stem]) return 0;
    if (stemHasSolo && !stemSolo[stem]) return 0;
    return stemVolumes[stem] / 100;
  };

  const handleCopyMixerSettings = async () => {
    const mix = btoa(JSON.stringify({
      volumes: stemVolumes,
      mute: stemMute,
      solo: stemSolo,
    }));
    const url = new URL(window.location.href);
    url.searchParams.set('mix', mix);

    await navigator.clipboard.writeText(url.toString());
    setMixCopied(true);
    window.setTimeout(() => setMixCopied(false), 1800);
  };

  const handleReaction = async (emoji: string) => {
    if (!currentTrack) return;
    setReactionCounts(prev => ({
      ...prev,
      [currentTrack.id]: {
        ...(prev[currentTrack.id] || {}),
        [emoji]: ((prev[currentTrack.id] || {})[emoji] || 0) + 1,
      },
    }));
    try {
      await api.post('/tracks/reactions', {
        track_id: currentTrack.id,
        reaction: emoji,
        at_seconds: Math.round(currentTime),
      });
    } catch (err) {
      console.warn('Reaction logging failed', err);
    }
  };

  const handleAddTimelineNote = async () => {
    if (!currentTrack || !noteInput.trim()) return;
    const note = {
      id: `note_${Date.now()}`,
      trackId: currentTrack.id,
      time: Math.round(currentTime),
      text: noteInput.trim(),
    };
    setTrackNotes(prev => [note, ...prev]);
    setNoteInput('');
    try {
      await api.post('/tracks/notes', {
        track_id: note.trackId,
        at_seconds: note.time,
        text: note.text,
      });
    } catch (err) {
      console.warn('Timeline note logging failed', err);
    }
  };

  const handlePipelineDrop = (targetId: string) => {
    if (!draggedPipelineId || draggedPipelineId === targetId) return;
    setActiveVocalPipelines(prev => {
      const next = [...prev];
      const from = next.findIndex(p => p.id === draggedPipelineId);
      const to = next.findIndex(p => p.id === targetId);
      if (from < 0 || to < 0) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDraggedPipelineId(null);
  };

  const shareRemix = (platform: 'TikTok' | 'Instagram' | 'Twitter') => {
    if (!currentTrack) return;
    const attribution = currentTrack.isRemix
      ? `Original creator: ${currentTrack.originalCreatorName || 'Lyrica creator'}`
      : `Creator: ${currentTrack.artist}`;
    const text = `I flipped "${currentTrack.title}" on SL Universal. ${attribution}. ${window.location.href}`;
    if (platform === 'Twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      return;
    }
    navigator.clipboard.writeText(`${platform} share caption:\n${text}`);
    setError(`${platform} caption copied with creator attribution.`);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-fuchsia-500/30">
      <AuraVisualizer active={auraMode} />

      {/* Header */}
      <header className="p-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase">Sonance Pro</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          {/* Mode Toggle */}
          <div className="flex items-center bg-white/5 rounded-xl p-0.5 border border-white/10">
            <button
              onClick={() => setMode("sonance")}
              title="Generate AI music from text prompts"
              className={cn(
                "px-4 py-2 rounded-[10px] text-[10px] font-bold tracking-widest uppercase transition-all",
                mode === "sonance"
                  ? "bg-gradient-to-r from-fuchsia-500 to-pink-600 text-black shadow-lg"
                  : "text-white/40 hover:text-white"
              )}
            >
              Lyrica
            </button>
            <button
              onClick={() => setMode("directory")}
              title="Browse and play external radio stations"
              className={cn(
                "px-4 py-2 rounded-[10px] text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-1.5",
                mode === "directory"
                  ? "bg-gradient-to-r from-fuchsia-500 to-pink-600 text-black shadow-lg"
                  : "text-white/40 hover:text-white"
              )}
            >
              <Radio className="w-3 h-3" />
              Stations
            </button>
            <button
              onClick={() => setMode("party_dj")}
              title="AI DJ party room with listener interactivity"
              className={cn(
                "px-4 py-2 rounded-[10px] text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-1.5",
                mode === "party_dj"
                  ? "bg-gradient-to-r from-fuchsia-500 to-pink-600 text-black shadow-lg"
                  : "text-white/40 hover:text-white"
              )}
            >
              <Mic2 className="w-3 h-3" />
              Party DJ
            </button>
          </div>

          <button
            onClick={() => setProMode(!proMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-all border text-[10px] font-bold tracking-widest uppercase",
              proMode ? "bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-500" : "hover:text-white border-white/10 text-white/60"
            )}
          >
            <Cpu className="w-4 h-4" />
            {proMode ? "Sonance Pro" : "Go Pro"}
          </button>
          <button
            onClick={() => setIsLiveSessionOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 text-white/60 hover:text-white transition-colors text-[10px] font-bold tracking-widest uppercase"
          >
            <Users className="w-3 h-3" />
            Live
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 pt-12 pb-32 relative z-10">
        {mode === "party_dj" ? (
          /* ── Party DJ Mode ── */
          <LivePartyDJRoom />
        ) : mode === "directory" ? (
          /* ── Station Directory ── */
          <RadioDirectoryPage
            onPlayStation={handlePlayStation}
            onStopStation={handleStopStation}
            currentPlayingId={externalStationPlaying ? (externalStationPlaying as any).id || externalStationPlaying.name : undefined}
          />
        ) : (
          /* ── Lyrica Sonance Mode ── */
          <div className="contents">
        <AnimatePresence>
          {showLiveBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-gradient-to-r to-pink-600 to-fuchsia-600 p-[1px] rounded-2xl">
                <div className="bg-black/90 backdrop-blur-xl p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-red-500">Live Studio Session</span>
                    <span className="text-sm font-medium">A live session is starting now!</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-white/40">2.4M LISTENING</span>
                    <button
                      onClick={() => setIsLiveSessionOpen(true)}
                      className="px-4 py-2 bg-red-600 text-white text-[10px] font-bold tracking-widest uppercase rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Join Session
                    </button>
                    <button
                      onClick={() => setShowLiveBanner(false)}
                      className="text-white/40 hover:text-white transition-colors"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!currentTrack && !isGenerating ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-24"
            >
              <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-none">
                FEEL <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-pink-600">SOMETHING.</span>
              </h1>
              <p className="text-white/40 text-xl max-w-xl mx-auto mb-12 font-light">
                The world's first frictionless, viral, and infinitely personalized AI music platform.
              </p>

              {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm max-w-2xl mx-auto">
                  {error}
                </div>
              )}

              <VibeBar onGenerate={handleGenerate} initialVibe={initialVibe} />

              <div className="mt-6 max-w-2xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/50">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
                    <Moon className="w-3 h-3 text-fuchsia-400" />
                    {listenerContext.timeOfDay}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
                    <CloudRain className="w-3 h-3 text-blue-400" />
                    {listenerContext.weather}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5">
                    <Heart className="w-3 h-3 text-pink-400" />
                    {listenerContext.heartRate ? `${listenerContext.heartRate} BPM` : 'No HR'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={auraStreamActive ? () => setAuraStreamActive(false) : handleStartAuraStream}
                    className={cn(
                      "py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all",
                      auraStreamActive ? "bg-fuchsia-500 text-black" : "bg-white/10 text-white hover:bg-white/15"
                    )}
                  >
                    <Waves className="w-4 h-4" />
                    {auraStreamActive ? 'Aura Live' : 'Aura Streams'}
                  </button>
                  <button
                    onClick={handlePairHeartRate}
                    className="py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
                  >
                    <Activity className="w-4 h-4" />
                    Pair HR
                  </button>
                  <button
                    onClick={() => handleGenerate('Generate a studio-quality song from my current prompt history and live context.')}
                    className="py-3 rounded-xl border border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-500/10 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Song
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                {['Late night drive', '90s R&B hurt', 'Chicano Soul', 'Modern Trap Soul', 'Acoustic Healing', 'Rio Drift Phonk', 'Cyberpunk Jazz', 'Ethereal Folk'].map((vibe) => (
                  <button
                    key={vibe}
                    onClick={() => handleGenerate(vibe)}
                    className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  >
                    {vibe}
                  </button>
                ))}
              </div>

              {/* Emotional OS Selector */}
              <div className="mt-12 space-y-6">
                <div className="flex items-center justify-center gap-4">
                  {[
                    { id: 'Pain', label: 'Pain Mode', color: 'text-red-500', bg: 'bg-red-500/10', desc: 'High vulnerability, minor keys, emotional breaks' },
                    { id: 'Playful', label: 'Playful Mode', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', desc: 'Major 7ths, groove-heavy, juxtaposition logic' },
                    { id: 'Mirror', label: 'Mirror Mode', color: 'text-blue-500', bg: 'bg-blue-500/10', desc: 'Duo/Ensemble engine, conversational interplay' },
                  ].map((mode) => (
                    <div key={mode.id} className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => setEmotionalMode(mode.id as any)}
                        className={cn(
                          "px-6 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase border transition-all",
                          emotionalMode === mode.id
                            ? `${mode.bg} ${mode.id === 'Pain' ? 'border-red-500/50' : mode.id === 'Playful' ? 'border-fuchsia-500/50' : 'border-blue-500/50'} ${mode.color}`
                            : "border-white/10 text-white/40 hover:text-white"
                        )}
                      >
                        {mode.label}
                      </button>
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={emotionalMode}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-center text-[10px] font-mono tracking-widest uppercase text-white/40"
                  >
                    Direction: {
                      emotionalMode === 'Pain' ? 'High vulnerability, minor keys, emotional breaks' :
                      emotionalMode === 'Playful' ? 'Major 7ths, groove-heavy, juxtaposition logic' :
                      'Duo/Ensemble engine, conversational interplay'
                    }
                  </motion.p>
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center pt-12"
            >
              {/* Left: Artwork / Visualizer */}
              <div className="relative aspect-square group">
                <div className="absolute -inset-4 bg-gradient-to-br from-fuchsia-500/20 to-pink-600/20 rounded-3xl blur-2xl group-hover:opacity-100 opacity-50 transition-opacity" />
                <div className={cn(
                  "relative w-full h-full border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center transition-colors duration-1000",
                  emotionalMode === 'Pain' ? "bg-gradient-to-br from-red-950/40 via-black to-fuchsia-950/20" :
                  emotionalMode === 'Playful' ? "bg-gradient-to-br from-fuchsia-950/40 via-black to-pink-950/30" :
                  "bg-gradient-to-br from-blue-950/30 via-black to-fuchsia-950/20"
                )}>
                  {isGenerating ? (
                    <div className="flex flex-col items-center gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-fuchsia-500/20 border-t-fuchsia-500 rounded-full"
                      />
                      <p className="text-fuchsia-500 font-mono text-xs tracking-widest uppercase animate-pulse">Synthesizing Audio...</p>
                    </div>
                  ) : (
                    <div className="w-full h-full p-12 flex flex-col justify-between relative">
                      {proMode && isPlaying && (
                        <div className="absolute inset-0 flex items-end justify-center gap-1 px-8 pb-32 opacity-30">
                          {[...Array(24)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [20, Math.random() * 100 + 20, 20] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                              className="w-1/24 bg-fuchsia-500 rounded-t-sm"
                            />
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between items-start relative z-10">
                        <div className="p-3 bg-white/5 rounded-xl">
                          <Music2 className="w-6 h-6 text-fuchsia-500" />
                        </div>
                        <div className="flex gap-2">
                          <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">
                            {currentTrack?.params.key}
                          </div>
                          <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold tracking-widest uppercase border border-white/10">
                            {currentTrack?.params.tempo} BPM
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-5xl font-black tracking-tighter leading-none">{currentTrack?.title}</h2>
                        <p className="text-white/40 text-lg font-light italic">{currentTrack?.vibe}</p>

                        {/* Multi-Genre Layers or Soulfire Metadata */}
                        {currentTrack?.trackMetadata ? (
                          <div className="flex flex-col gap-2 pt-2">
                            <div className="flex flex-wrap gap-2">
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/20">
                                <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[8px] font-mono uppercase tracking-widest text-red-400">{currentTrack.trackMetadata.s2_mutation}</span>
                              </div>
                            </div>
                            {currentTrack.ghostwriterDirective && (
                              <div className="text-xs text-white/60 font-mono mt-2">
                                <span className="text-white/40 uppercase tracking-widest text-[8px] block mb-1">Ghostwriter Directive:</span>
                                {currentTrack.ghostwriterDirective.corpus} • <span className="italic text-fuchsia-400">{currentTrack.ghostwriterDirective.subtext}</span>
                              </div>
                            )}
                            {currentTrack.vocalBlueprint && (
                              <div className="text-xs text-white/60 font-mono mt-1">
                                <span className="text-white/40 uppercase tracking-widest text-[8px] block mb-1">Vocal Blueprint:</span>
                                Phonation: {currentTrack.vocalBlueprint.phonation} (Vuln: {currentTrack.vocalBlueprint.vulnerability_level})
                              </div>
                            )}
                            {currentTrack.acousticPrimitives && (
                              <div className="text-xs text-white/60 font-mono mt-1">
                                <span className="text-white/40 uppercase tracking-widest text-[8px] block mb-1">Acoustic Primitives:</span>
                                Groove: {currentTrack.acousticPrimitives.groove}
                              </div>
                            )}
                            {currentTrack.vocalPipelines && (
                              <div className="mt-4 space-y-2">
                                <span className="text-white/40 uppercase tracking-widest text-[8px] block mb-2">Active Vocal Pipelines (VICS Protocol):</span>
                                <div className="grid grid-cols-1 gap-2">
                                  {currentTrack.vocalPipelines.map((pipeline, i) => (
                                    <div key={i} className="p-2 bg-white/5 border border-white/10 rounded-lg flex flex-col gap-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider">{pipeline.name}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                      </div>
                                      <span className="text-[9px] text-white/40 font-mono italic">{pipeline.description}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {currentTrack?.params.genreBlend?.map((genre, i) => (
                              <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10">
                                <div className="w-1 h-1 rounded-full bg-fuchsia-500 animate-pulse" />
                                <span className="text-[8px] font-mono uppercase tracking-widest text-white/40">{genre}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => setShowLyrics(!showLyrics)}
                          className={cn(
                            "flex-1 py-4 rounded-xl border transition-all font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2",
                            showLyrics ? "bg-white text-black border-white" : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          <Mic2 className="w-4 h-4" />
                          {showLyrics ? "Close" : "Lyrics"}
                        </button>
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => {
                                setFlipInput(currentTrack?.vibe || '');
                                setShowFlipModal(true);
                              }}
                              className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl transition-all font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2"
                            >
                              <Layers className="w-4 h-4" />
                              Flip It
                            </button>
                            <button
                              onClick={() => {
                                if (currentTrack) {
                                  handleGenerate(`Deepen the vibe of this track: ${currentTrack.vibe}. Make it more atmospheric, complex, and immersive.`);
                                }
                              }}
                              className="w-full py-4 bg-purple-600 hover:bg-purple-500 rounded-xl transition-all font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2"
                            >
                              <TrendingUp className="w-4 h-4" />
                              Deepen
                            </button>
                          </div>
                          <div className="mt-2 p-3 bg-black/40 rounded-xl border border-white/5">
                            <div className="text-[8px] font-bold tracking-widest uppercase text-white/40 mb-3 flex items-center justify-between gap-3">
                              <span>MSGO Stem Mixer</span>
                              <div className="flex items-center gap-2">
                                <span className="text-fuchsia-500">48kHz/24-bit</span>
                                <button
                                  onClick={handleCopyMixerSettings}
                                  className="rounded-md border border-white/10 px-2 py-1 text-[8px] text-white/60 hover:border-fuchsia-500/40 hover:text-white transition-all"
                                >
                                  {mixCopied ? 'Copied' : 'Copy Mix'}
                                </button>
                              </div>
                            </div>
                            <div className="space-y-3">
                              {STEM_NAMES.map((stem) => {
                                const vol = stemVolumes[stem];
                                const audibleLevel = getStemAudibleLevel(stem);
                                return (
                                <div key={stem} className="grid grid-cols-[48px_1fr_56px] items-center gap-2">
                                  <span className="text-[9px] font-mono uppercase text-white/60">{stem}</span>
                                  <div className="space-y-2">
                                    <div className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-1.5 flex items-center gap-0.5 overflow-hidden">
                                      {Array.from({ length: 18 }).map((_, i) => {
                                        const phase = Math.sin((i + 1) * (stem === 'bass' ? 0.82 : stem === 'drums' ? 1.7 : 1.18));
                                        const height = Math.max(10, Math.round((phase * 0.5 + 0.5) * audibleLevel * 28));
                                        return (
                                          <motion.span
                                            key={i}
                                            animate={{
                                              height: isPlaying && audibleLevel > 0 ? [height, Math.max(8, height * 0.45), height] : height,
                                              opacity: audibleLevel > 0 ? 0.35 + audibleLevel * 0.65 : 0.12,
                                            }}
                                            transition={{ duration: 0.42 + i * 0.015, repeat: Infinity, ease: "easeInOut" }}
                                            className="w-1 rounded-full bg-gradient-to-t from-fuchsia-500 to-pink-300"
                                          />
                                        );
                                      })}
                                    </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={vol}
                                    onChange={(e) => updateStemVolume(stem, parseInt(e.target.value))}
                                    className="flex-1 h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                                  />
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <span className="text-[9px] font-mono text-white/40">{vol}%</span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => setStemMute(prev => ({ ...prev, [stem]: !prev[stem] }))}
                                        className={cn(
                                          "px-1.5 py-1 rounded text-[7px] font-bold uppercase tracking-widest border transition-all",
                                          stemMute[stem] ? "bg-red-500/20 border-red-500/40 text-red-300" : "border-white/10 text-white/35 hover:text-white"
                                        )}
                                      >
                                        M
                                      </button>
                                      <button
                                        onClick={() => setStemSolo(prev => ({ ...prev, [stem]: !prev[stem] }))}
                                        className={cn(
                                          "px-1.5 py-1 rounded text-[7px] font-bold uppercase tracking-widest border transition-all",
                                          stemSolo[stem] ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200" : "border-white/10 text-white/35 hover:text-white"
                                        )}
                                      >
                                        S
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Context & Controls */}
              <div className="space-y-12">
                {proMode ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-8 bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl"
                  >
                    {/* Pro Mode Header & Waveform */}
                    <div className="pb-6 border-b border-white/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-2xl font-bold tracking-tight">{currentTrack?.title}</h2>
                          <p className="text-white/40 text-sm">
                            {currentTrack?.artist || "Lyria-3-Pro Engine"}
                            <FulfillmentBadge fulfillment={currentTrack?.fulfillment} />
                          </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-mono text-white/60 flex items-center gap-2" title="Vertex AI Model Garden">
                          <Cpu className="w-3 h-3 text-fuchsia-500" />
                          <span>lyria-3-pro-preview</span>
                        </div>
                      </div>

                      {/* Dynamic Waveform Visualizer */}
                      <div className="flex items-center gap-1 h-12 mt-6 overflow-hidden">
                        {[...Array(60)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={isPlaying ? {
                              height: [
                                `${Math.max(10, Math.random() * (currentTrack?.params.tempo ? (currentTrack.params.tempo / 1.5) : 100))}%`,
                                `${Math.max(15, Math.random() * (currentTrack?.params.tempo ? (currentTrack.params.tempo / 1.2) : 100))}%`,
                                `${Math.max(10, Math.random() * (currentTrack?.params.tempo ? (currentTrack.params.tempo / 1.5) : 100))}%`
                              ],
                              opacity: [0.5, 1, 0.5],
                              scaleY: [1, 1.15, 1]
                            } : {
                              height: "10%",
                              opacity: 0.3,
                              scaleY: 1
                            }}
                            transition={{
                              duration: currentTrack?.params.tempo ? (60 / currentTrack.params.tempo) : 0.4,
                              repeat: Infinity,
                              repeatType: "mirror",
                              ease: "easeInOut",
                              delay: i * 0.01
                            }}
                            className={cn(
                              "flex-1 rounded-full transition-colors duration-300",
                              hasMelodyLayer && i % 3 === 0 ? "bg-purple-500/80" : "bg-fuchsia-500/80"
                            )}
                            style={{ height: "10%" }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Sliders className="w-5 h-5 text-fuchsia-500" />
                        <h3 className="text-lg font-bold tracking-tight uppercase">Vocal Designer</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleUndo}
                            disabled={paramsHistoryIndex <= 0}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md disabled:opacity-30 transition-all"
                            title="Undo (Ctrl+Z)"
                          >
                            <Undo2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleRedo}
                            disabled={paramsHistoryIndex >= paramsHistory.length - 1}
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-md disabled:opacity-30 transition-all"
                            title="Redo (Ctrl+Y)"
                          >
                            <Redo2 className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => setEdgeProcessing(!edgeProcessing)}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded text-[10px] font-mono transition-all",
                            edgeProcessing ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/40 hover:bg-white/10"
                          )}
                          title="Hardware Optimization / Edge Processing"
                        >
                          <Cpu className="w-3 h-3" />
                          <span>EDGE PROCESSING</span>
                        </button>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                          <Activity className="w-3 h-3" />
                          <span>REAL-TIME MODELING</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {[
                        { key: "vocalFry", label: "Vocal Fry", icon: Waves, value: currentTrack?.params.vocalFry || 0.4, min: 0, max: 1, step: 0.01 },
                        { key: "inhaleIntensity", label: "Inhale Intensity", icon: Wind, value: currentTrack?.params.inhaleIntensity || 0.6, min: 0, max: 1, step: 0.01 },
                        { key: "emotionalBreak", label: "Emotional Break", icon: Heart, value: currentTrack?.params.emotionalBreak || 0.3, min: 0, max: 1, step: 0.01 },
                        { key: "roomSize", label: "Room Size", icon: Layers, value: currentTrack?.params.roomSize || 0.5, min: 0, max: 1, step: 0.01 },
                      ].map((param, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase text-white/40">
                            <div className="flex items-center gap-2">
                              <param.icon className="w-3 h-3" />
                              <span>{param.label}</span>
                            </div>
                            <span>{(param.value * 100).toFixed(0)}%</span>
                          </div>
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={param.value}
                            onChange={(e) => handleParamChange(param.key as keyof VibeParams, parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-red-500" />
                          <h3 className="text-lg font-bold tracking-tight uppercase">Vocal Pipeline Matrix</h3>
                        </div>
                        <span className="text-[9px] font-bold tracking-widest uppercase text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                          VICS Protocol Active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {activeVocalPipelines.map((pipeline) => (
                          <div
                            key={pipeline.id}
                            draggable
                            onDragStart={() => setDraggedPipelineId(pipeline.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handlePipelineDrop(pipeline.id)}
                            className={cn(
                            "p-4 rounded-2xl border transition-all space-y-3",
                            pipeline.active ? "bg-white/5 border-white/20" : "bg-white/[0.02] border-white/5 opacity-50",
                            draggedPipelineId === pipeline.id && "ring-2 ring-fuchsia-500/40"
                          )}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  pipeline.active ? "bg-red-500 animate-pulse" : "bg-white/20"
                                )} />
                                <div>
                                  <div className="text-xs font-bold uppercase tracking-wider text-white">{pipeline.name}</div>
                                  <div className="text-[10px] text-white/40">{pipeline.description}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setActiveVocalPipelines(prev => prev.map(p =>
                                    p.id === pipeline.id ? { ...p, active: !p.active } : p
                                  ));
                                }}
                                className={cn(
                                  "w-10 h-5 rounded-full transition-colors relative",
                                  pipeline.active ? "bg-red-500" : "bg-white/20"
                                )}
                              >
                                <motion.div
                                  animate={{ x: pipeline.active ? 20 : 2 }}
                                  className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                                />
                              </button>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-white/5">
                              <div className="flex justify-between text-[9px] font-bold tracking-widest uppercase text-white/40">
                                <span>Pipeline Intensity</span>
                                <span className={cn(pipeline.active ? "text-red-500" : "text-white/20")}>{pipeline.intensity}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={pipeline.intensity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setActiveVocalPipelines(prev => prev.map(p =>
                                    p.id === pipeline.id ? { ...p, intensity: val } : p
                                  ));
                                  if (currentTrack && currentTrack.vocalPipelines) {
                                    setCurrentTrack({
                                      ...currentTrack,
                                      vocalPipelines: currentTrack.vocalPipelines.map(p =>
                                        p.name === pipeline.name ? { ...p, intensity: val } : p
                                      )
                                    });
                                  }
                                }}
                                className={cn(
                                  "w-full h-1 rounded-lg appearance-none cursor-pointer transition-all",
                                  pipeline.active ? "bg-white/10 accent-red-500" : "bg-white/5 accent-white/20"
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Settings className="w-5 h-5 text-blue-500" />
                          <h3 className="text-lg font-bold tracking-tight uppercase">Advanced Effects</h3>
                        </div>
                      </div>
                      {[
                        { key: "delayTime", label: "Delay Time", icon: Activity, value: currentTrack?.params.delayTime || 250, min: 0, max: 1000, step: 1, displayValue: `${currentTrack?.params.delayTime || 250}ms` },
                        { key: "delayFeedback", label: "Delay Feedback", icon: Activity, value: currentTrack?.params.delayFeedback || 0.3, min: 0, max: 1, step: 0.01, displayValue: `${((currentTrack?.params.delayFeedback || 0.3) * 100).toFixed(0)}%` },
                        { key: "chorusDepth", label: "Chorus Depth", icon: Waves, value: currentTrack?.params.chorusDepth || 0.2, min: 0, max: 1, step: 0.01, displayValue: `${((currentTrack?.params.chorusDepth || 0.2) * 100).toFixed(0)}%` },
                        { key: "phaserRate", label: "Phaser Rate", icon: Activity, value: currentTrack?.params.phaserRate || 0.5, min: 0, max: 5, step: 0.1, displayValue: `${(currentTrack?.params.phaserRate || 0.5).toFixed(1)}Hz` },
                      ].map((param, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase text-white/40">
                            <div className="flex items-center gap-2">
                              <param.icon className="w-3 h-3" />
                              <span>{param.label}</span>
                            </div>
                            <span>{param.displayValue}</span>
                          </div>
                          <input
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={param.value}
                            onChange={(e) => handleParamChange(param.key as keyof VibeParams, parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                        </div>
                      ))}

                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 mt-4">
                        <div className="flex items-center gap-3">
                          <Headphones className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-white">Spatial Audio</div>
                            <div className="text-[10px] text-white/40">3D Soundstage & Dolby Atmos Prep</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSpatialAudio(!spatialAudio)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            spatialAudio ? "bg-blue-500" : "bg-white/20"
                          )}
                        >
                          <motion.div
                            animate={{ x: spatialAudio ? 20 : 2 }}
                            className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                          />
                        </button>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Mic2 className="w-5 h-5 text-purple-500" />
                          <h3 className="text-lg font-bold tracking-tight uppercase">Chirp 3 Vocal Synthesis</h3>
                        </div>
                        <button className="text-[9px] font-bold tracking-widest uppercase text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 hover:bg-purple-500/20 transition-colors" title="Create voices from 10 seconds of audio">
                          + Instant Custom Voice
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {['Singer', 'Podcast Host', 'Narrator', 'Street Poet', 'Soul Diva', 'Trap Ghost'].map(persona => (
                          <button
                            key={persona}
                            onClick={() => setVoicePersona(persona as any)}
                            className={cn(
                              "flex-1 min-w-[80px] py-1.5 rounded-md text-[9px] font-bold tracking-widest uppercase border transition-all",
                              voicePersona === persona ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                            )}
                          >
                            {persona}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['Soaring', 'Rhythmic', 'Subtle', 'Aggressive', 'Melancholic', 'Ethereal'].map(style => (
                          <button
                            key={style}
                            onClick={() => setMelodyStyle(style as any)}
                            className={cn(
                              "flex-1 min-w-[80px] py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase border transition-all",
                              melodyStyle === style ? "bg-purple-500/20 border-purple-500 text-purple-400" : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                            )}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleGenerateMelody}
                        disabled={isGeneratingMelody || hasMelodyLayer}
                        className={cn(
                          "w-full py-3 border rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2",
                          hasMelodyLayer
                            ? "bg-purple-500/20 border-purple-500 text-purple-400"
                            : "bg-purple-600/20 hover:bg-purple-600/40 border-purple-500/50"
                        )}
                      >
                        {isGeneratingMelody ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
                        ) : (
                          <Layers className={cn("w-4 h-4", hasMelodyLayer ? "text-purple-400" : "text-purple-500")} />
                        )}
                        {hasMelodyLayer ? "Melody Layer Added" : isGeneratingMelody ? "Generating Layer..." : "Generate Melody Layer"}
                      </button>
                    </div>

                    <div className="pt-6 border-t border-white/10 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Cpu className="w-5 h-5 text-green-500" />
                          <h3 className="text-lg font-bold tracking-tight uppercase">AI Mastering Suite</h3>
                        </div>
                        {isMastered && (
                          <span className="text-[9px] font-bold tracking-widest uppercase text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                            Optimized for Playback
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <button
                          onClick={handleMasterTrack}
                          disabled={isMastering || isMastered}
                          className={cn(
                            "w-full py-3 border rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 relative overflow-hidden",
                            isMastered
                              ? "bg-green-500/20 border-green-500 text-green-400"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          )}
                        >
                          {isMastering && (
                            <motion.div initial={{ width: 0 }} animate={{ width: `${masteringProgress}%` }} className="absolute inset-0 bg-green-500/20" />
                          )}
                          <Cpu className={cn("w-4 h-4", isMastered ? "text-green-400" : "")} />
                          <span className="relative z-10">
                            {isMastered ? "Track Mastered" : isMastering ? masteringStage : "Analyze & Master Track"}
                          </span>
                        </button>

                        {isMastered && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-2xl"
                          >
                            {[
                              { key: 'eqLow', label: 'Low End Depth', icon: Activity },
                              { key: 'eqMid', label: 'Mid Range Clarity', icon: Activity },
                              { key: 'eqHigh', label: 'High End Sparkle', icon: Activity },
                              { key: 'compression', label: 'Dynamic Range Comp', icon: Layers },
                              { key: 'limiting', label: 'Ceiling / Limiter', icon: Shield },
                            ].map((param) => (
                              <div key={param.key} className="space-y-2">
                                <div className="flex justify-between text-[9px] font-bold tracking-widest uppercase text-white/40">
                                  <div className="flex items-center gap-2">
                                    <param.icon className="w-3 h-3" />
                                    <span>{param.label}</span>
                                  </div>
                                  <span>{(masteringParams[param.key as keyof typeof masteringParams] * 100).toFixed(0)}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.01"
                                  value={masteringParams[param.key as keyof typeof masteringParams]}
                                  onChange={(e) => setMasteringParams({...masteringParams, [param.key]: parseFloat(e.target.value)})}
                                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                                />
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </div>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <Music2 className="w-4 h-4" />
                        Import MIDI Blueprint
                      </button>
                      <input type="file" accept=".mid,.midi" className="hidden" ref={fileInputRef} onChange={handleMidiImport} />
                    </div>

                    {/* Soulfire Sonance Sentinel (SSS) Section */}
                    <div className="pt-6 border-t border-white/10 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-red-500" />
                          <h3 className="text-lg font-bold tracking-tight uppercase">Soulfire Sentinel</h3>
                        </div>
                        <span className="text-[9px] font-bold tracking-widest uppercase text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                          Cultural AI Active
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center gap-3">
                            <Layers className="w-4 h-4 text-red-400" />
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wider text-white">Cultural Flux Model (CFM)</div>
                              <div className="text-[10px] text-white/40">Dynamic aesthetic envelope & anti-homogenization</div>
                            </div>
                          </div>
                          <button
                            onClick={() => setCfmEnabled(!cfmEnabled)}
                            className={cn(
                              "w-10 h-5 rounded-full transition-colors relative",
                              cfmEnabled ? "bg-red-500" : "bg-white/20"
                            )}
                          >
                            <motion.div
                              animate={{ x: cfmEnabled ? 20 : 2 }}
                              className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex items-center gap-3">
                            <Shield className="w-4 h-4 text-blue-400" />
                            <div>
                              <div className="text-xs font-bold uppercase tracking-wider text-white">Predictive Neural IP Sentinel</div>
                              <div className="text-[10px] text-white/40">Proactive originality guardrails (PNIS)</div>
                            </div>
                          </div>
                          <button
                            onClick={() => setPnisEnabled(!pnisEnabled)}
                            className={cn(
                              "w-10 h-5 rounded-full transition-colors relative",
                              pnisEnabled ? "bg-blue-500" : "bg-white/20"
                            )}
                          >
                            <motion.div
                              animate={{ x: pnisEnabled ? 20 : 2 }}
                              className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                            />
                          </button>
                        </div>

                        <button
                          onClick={() => setShowSri(!showSri)}
                          className={cn(
                            "w-full py-3 border rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2",
                            showSri ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                          )}
                        >
                          <Settings className="w-4 h-4" />
                          Soulfire Rationale Interface (SRI)
                        </button>

                        <AnimatePresence>
                          {showSri && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 bg-black/40 border border-white/10 rounded-xl mt-2 space-y-3 text-xs text-white/70 font-mono">
                                <p className="text-red-400 font-bold uppercase tracking-widest text-[10px] mb-2">Mastering Rationale:</p>
                                <p>• <span className="text-white">Emotional Gradient Mapping (EGM):</span> Applied fast-acting upward expansion on chord attacks for brightness, and slower-acting multi-band compression in low-mids to enhance 'bruised subtext'.</p>
                                <p>• <span className="text-white">Vocal Integrity:</span> Preserved vocal fry and emotional breaks via precise transient detection. Applied transparent optical compression and short, intimate reverbs for 'internalized vocal delivery'.</p>
                                <p>• <span className="text-white">Groove Enhancement:</span> Dynamic transient sculpting applied to drum bus for 'Late-Pocket' Chicano rhythmic aesthetics.</p>
                                <p>• <span className="text-white">Cultural Flux:</span> Generic 'white-coded' aesthetics gently deprioritized via GAIE reward functions.</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 mb-4">
                        <div className="flex items-center gap-3">
                          <Shield className="w-4 h-4 text-green-400" />
                          <div>
                            <div className="text-xs font-bold uppercase tracking-wider text-white">SynthID Watermark</div>
                            <div className="text-[10px] text-white/40">Google DeepMind Steganography</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setAiWatermarking(!aiWatermarking)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            aiWatermarking ? "bg-green-500" : "bg-white/20"
                          )}
                        >
                          <motion.div
                            animate={{ x: aiWatermarking ? 20 : 2 }}
                            className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                          />
                        </button>
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <button
                            onClick={() => setShowExportOptions(!showExportOptions)}
                            disabled={isExporting}
                            className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                          >
                            {isExporting && (
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${exportProgress}%` }}
                                className="absolute inset-0 bg-fuchsia-500/20"
                              />
                            )}
                            <Download className="w-4 h-4" />
                            {isExporting ? `Exporting ${exportProgress}%` : `Export ${exportFormat}`}
                            <ChevronDown className="w-3 h-3 ml-1" />
                          </button>

                          <AnimatePresence>
                            {showExportOptions && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full left-0 w-full mb-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden z-20 p-4 space-y-4"
                              >
                                <div className="space-y-2">
                                  <p className="text-[8px] font-bold tracking-widest uppercase text-white/40">Format</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {['WAV', 'MP3', 'Stems', 'MIDI', 'Dolby Atmos'].map(format => (
                                      <button
                                        key={format}
                                        onClick={() => setExportFormat(format as any)}
                                        className={cn(
                                          "py-2 px-3 text-left text-[9px] font-bold tracking-widest uppercase rounded-lg transition-all",
                                          exportFormat === format ? "bg-fuchsia-500 text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                                        )}
                                      >
                                        {format}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {(exportFormat === 'WAV' || exportFormat === 'Stems') && (
                                  <>
                                    <div className="space-y-2">
                                      <p className="text-[8px] font-bold tracking-widest uppercase text-white/40">Sample Rate</p>
                                      <div className="grid grid-cols-3 gap-2">
                                        {['44.1kHz', '48kHz', '96kHz'].map(rate => (
                                          <button
                                            key={rate}
                                            onClick={() => setSampleRate(rate as any)}
                                            className={cn(
                                              "py-2 px-2 text-center text-[8px] font-bold tracking-widest uppercase rounded-lg transition-all",
                                              sampleRate === rate ? "bg-fuchsia-500/20 text-fuchsia-500 border border-fuchsia-500/30" : "bg-white/5 text-white/60 hover:bg-white/10"
                                            )}
                                          >
                                            {rate}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <p className="text-[8px] font-bold tracking-widest uppercase text-white/40">Bit Depth</p>
                                      <div className="grid grid-cols-3 gap-2">
                                        {['16-bit', '24-bit', '32-bit float'].map(depth => (
                                          <button
                                            key={depth}
                                            onClick={() => setBitDepth(depth as any)}
                                            className={cn(
                                              "py-2 px-1 text-center text-[7px] font-bold tracking-widest uppercase rounded-lg transition-all",
                                              bitDepth === depth ? "bg-fuchsia-500/20 text-fuchsia-500 border border-fuchsia-500/30" : "bg-white/5 text-white/60 hover:bg-white/10"
                                            )}
                                          >
                                            {depth}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-3 h-3 text-fuchsia-500" />
                                    <span className="text-[8px] font-bold tracking-widest uppercase text-white/60">AI Watermarking</span>
                                  </div>
                                  <button
                                    onClick={() => setAiWatermarking(!aiWatermarking)}
                                    className={cn(
                                      "w-8 h-4 rounded-full transition-colors relative",
                                      aiWatermarking ? "bg-fuchsia-500" : "bg-white/20"
                                    )}
                                  >
                                    <motion.div
                                      animate={{ x: aiWatermarking ? 16 : 2 }}
                                      className="w-3 h-3 bg-white rounded-full absolute top-0.5"
                                    />
                                  </button>
                                </div>

                                <button
                                  onClick={() => {
                                    setShowExportOptions(false);
                                    handleExportStems();
                                  }}
                                  className="w-full py-3 bg-fuchsia-500 text-black rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-fuchsia-400 transition-all"
                                >
                                  Confirm & Export
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <button className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                          <Settings className="w-4 h-4" />
                          AMP Config
                        </button>
                      </div>

                      {/* Developer API Integration Section */}
                      <div className="pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Cpu className="w-5 h-5 text-green-500" />
                            <h3 className="text-lg font-bold tracking-tight uppercase">Developer API</h3>
                          </div>
                          <span className="text-[9px] font-bold tracking-widest uppercase text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                            v1.0 Active
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] text-white/60 flex flex-col gap-2">
	                            <div className="flex justify-between items-center">
	                              <span className="text-green-400">POST /api/generate</span>
	                              <button onClick={() => navigator.clipboard.writeText('/api/generate')} className="hover:text-white transition-colors" title="Copy Endpoint">Copy</button>
	                            </div>
                            <div className="text-white/30">Integrate with Unity, Unreal, Premiere, or DAWs.</div>
                          </div>
                          <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] text-white/60 flex flex-col gap-2">
	                            <div className="flex justify-between items-center">
	                              <span className="text-blue-400">GET /api/music/:trackId/audio</span>
	                              <button onClick={() => navigator.clipboard.writeText('/api/music/{trackId}/audio')} className="hover:text-white transition-colors" title="Copy Endpoint">Copy</button>
                            </div>
                            <div className="text-white/30">Poll for generation status and retrieve Dolby Atmos stems.</div>
                          </div>
                        </div>
                      </div>

                      {/* Vertex AI Orchestrator Section */}
                      <div className="pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-purple-500" />
                            <h3 className="text-lg font-bold tracking-tight uppercase">Vertex AI Orchestrator</h3>
                          </div>
                          <span className="text-[9px] font-bold tracking-widest uppercase text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                            Generative Audio Suite
                          </span>
                        </div>
                        <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-4">
                          <p className="text-[10px] text-white/60 leading-relaxed">
                            Synthesize three distinct categories of studio-ready audio assets in one execution cycle. Generates a ZIP file containing Declarative Music Composition, Precision Foley, and Continuous Ambient Soundscapes.
                          </p>
	                          <button
	                            onClick={() => handleGenerate('Create a Vertex-style audio suite: one full song, precision foley cues, and a continuous ambient Aura Stream bed for this listener context.')}
	                            className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
	                          >
	                            <Download className="w-4 h-4" />
	                            Synthesize Suite
	                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-12">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 text-white/40 text-sm font-medium tracking-widest uppercase">
                        <Activity className="w-4 h-4 text-fuchsia-500" />
                        <span>Aura Context</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { icon: CloudRain, label: "Rainy", active: true },
                          { icon: Moon, label: "Late Night", active: true },
                          { icon: Activity, label: biometricSync ? "72 BPM Heart" : "Heart Sync Off", active: biometricSync, onClick: () => setBiometricSync(!biometricSync), pulse: biometricSync },
                          { icon: Sun, label: "Sunrise", active: false },
                        ].map((item, i) => (
                          <button
                            key={i}
                            onClick={item.onClick}
                            className={cn(
                              "p-4 rounded-2xl border flex items-center gap-4 transition-all text-left relative overflow-hidden",
                              item.active ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/5 text-white/20"
                            )}
                          >
                            <item.icon className={cn("w-5 h-5", item.pulse && "animate-pulse text-red-500")} />
                            <span className="text-xs font-bold tracking-widest uppercase">{item.label}</span>
                            {item.pulse && (
                              <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0, 0.1] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="absolute inset-0 bg-red-500/20 rounded-full"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-8">
                      {showLyrics ? (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="h-64 overflow-y-auto pr-4 custom-scrollbar"
                        >
                          {currentTrack?.lyricsPayload || currentTrack?.lyrics ? (
                            <div className="space-y-6">
                              {(currentTrack.lyricsPayload || String(currentTrack.lyrics || '').split('\n').filter(Boolean).map(line => ({ line }))).map((lyric: any, idx: number, lines: any[]) => {
                                const lineDuration = duration && lines.length ? duration / lines.length : 4;
                                const isActive = currentTime >= idx * lineDuration && currentTime < (idx + 1) * lineDuration;
                                return (
                                  <div
                                    key={idx}
                                    ref={el => { lyricRefs.current[idx] = el; }}
                                    className={cn(
                                      "flex flex-col gap-2 transition-all duration-500",
                                      isActive ? "opacity-100 scale-105" : "opacity-30 scale-100"
                                    )}
                                  >
                                    <p className={cn(
                                      "text-2xl font-serif italic leading-relaxed",
                                      isActive ? "text-fuchsia-500" : "text-white/90"
                                    )}>
                                      {lyric.line}
                                    </p>
                                    {lyric.artifact_trigger && (
                                      <span className={cn(
                                        "text-[10px] font-mono px-2 py-0.5 rounded w-fit border transition-colors",
                                        isActive ? "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20" : "text-white/20 bg-white/5 border-white/10"
                                      )}>
                                        Trigger: {lyric.artifact_trigger}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-3xl font-serif italic text-white/80 leading-relaxed whitespace-pre-wrap">
                              {currentTrack?.lyrics || "Lyrics synthesizing..."}
                            </p>
                          )}
                        </motion.div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">
                                {proMode
                                  ? (currentTrack?.fulfillment && currentTrack.fulfillment !== "primary"
                                      ? "ENGINE: STUDIO FALLBACK"
                                      : "ENGINE: SONANCE PRO v4.2")
                                  : "Now Playing"}
                              </p>
                              <h3 className="text-2xl font-bold tracking-tight">
                                {currentTrack?.artist}
                                <FulfillmentBadge fulfillment={currentTrack?.fulfillment} />
                              </h3>
                              <div className="flex gap-3 mt-2">
                                <button
                                  onClick={() => handleGenerate(`Continue the vibe of ${currentTrack?.vibe} but go deeper and more atmospheric`)}
                                  className="text-[10px] font-bold tracking-widest uppercase text-fuchsia-500 hover:text-white transition-colors flex items-center gap-1"
                                >
                                  <TrendingUp className="w-3 h-3" />
                                  Go Deeper
                                </button>
                                {proMode && (
                                  <>
                                    <div className="flex items-center gap-1 text-[10px] text-fuchsia-500/60 font-mono">
                                      <Zap className="w-3 h-3" />
                                      <span>LATENCY: 12ms</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-fuchsia-500/60 font-mono">
                                      <Activity className="w-3 h-3" />
                                      <span>FIDELITY: 32-BIT</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-2 py-1">
                              {['🔥', '😭', '💃', '🫶'].map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(emoji)}
                                  className="px-2 py-1 rounded-full text-sm hover:bg-white/10 transition-colors"
                                  title={`Vibe Check ${emoji}`}
                                >
                                  {emoji}
                                  <span className="ml-1 text-[9px] text-white/35">{currentTrack ? reactionCounts[currentTrack.id]?.[emoji] || 0 : 0}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden relative">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: isPlaying ? "100%" : "0%" }}
                              transition={{ duration: 30, ease: "linear" }}
                              className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-600 relative z-10"
                            />
                            <div className="absolute inset-0 bg-fuchsia-500/10 blur-sm" />
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
                            <div className="flex gap-2">
                              <input
                                value={noteInput}
                                onChange={(e) => setNoteInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTimelineNote()}
                                placeholder={`Add note at ${Math.round(currentTime)}s...`}
                                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-fuchsia-500/40"
                              />
                              <button
                                onClick={handleAddTimelineNote}
                                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-[9px] font-bold uppercase tracking-widest"
                              >
                                Add Note
                              </button>
                            </div>
                            {currentTrack && trackNotes.filter(note => note.trackId === currentTrack.id).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {trackNotes.filter(note => note.trackId === currentTrack.id).slice(0, 5).map(note => (
                                  <button
                                    key={note.id}
                                    onClick={() => {
                                      if (audioRef.current) audioRef.current.currentTime = note.time;
                                      setCurrentTime(note.time);
                                    }}
                                    className="px-2 py-1 rounded-lg border border-white/10 text-[9px] text-white/50 hover:text-white"
                                  >
                                    {note.time}s · {note.text}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <button
                              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                              className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                              title="Track History"
                            >
                              <History className="w-5 h-5" />
                            </button>

                            <AnimatePresence>
                              {showHistoryDropdown && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 10 }}
                                  className="absolute bottom-full left-0 mb-4 w-64 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
                                >
                                  <div className="p-2 border-b border-white/5 mb-2 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold tracking-widest uppercase text-white/40">Studio Archive</span>
                                      <button
                                        onClick={downloadSelectedMetadataZip}
                                        disabled={selectedTrackIds.length === 0}
                                        className="text-[8px] font-bold uppercase tracking-widest text-fuchsia-300 disabled:text-white/20"
                                      >
                                        ZIP {selectedTrackIds.length || ''}
                                      </button>
                                    </div>
                                    <input
                                      value={librarySearch}
                                      onChange={(e) => setLibrarySearch(e.target.value)}
                                      placeholder="Search title or artist"
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-[10px] outline-none focus:border-fuchsia-500/40"
                                    />
                                    <div className="grid grid-cols-3 gap-1">
                                      <select
                                        value={librarySort}
                                        onChange={(e) => setLibrarySort(e.target.value as any)}
                                        className="col-span-1 bg-white/5 border border-white/10 rounded-lg px-1 py-1 text-[8px] uppercase text-white outline-none"
                                      >
                                        <option value="date" className="bg-black">Date Added</option>
                                        <option value="alpha" className="bg-black">Alphabetical</option>
                                        <option value="vibe" className="bg-black">Vibe</option>
                                      </select>
                                      <button onClick={() => downloadLibraryMetadata(history, 'json')} className="bg-white/5 border border-white/10 rounded-lg text-[8px] uppercase tracking-widest text-white/50">JSON</button>
                                      <button onClick={() => downloadLibraryMetadata(history, 'csv')} className="bg-white/5 border border-white/10 rounded-lg text-[8px] uppercase tracking-widest text-white/50">CSV</button>
                                    </div>
                                  </div>
                                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {filteredHistory.length === 0 ? (
                                      <div className="p-4 text-center text-[10px] text-white/20 uppercase tracking-widest">
                                        No history yet
                                      </div>
                                    ) : (
                                      filteredHistory.map((track) => (
                                        <div
                                          key={track.id}
                                          className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors group flex items-center gap-3"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={selectedTrackIds.includes(track.id)}
                                            onChange={(e) => {
                                              setSelectedTrackIds(prev => e.target.checked ? [...prev, track.id] : prev.filter(id => id !== track.id));
                                            }}
                                            className="accent-fuchsia-500"
                                          />
                                          <button onClick={() => loadTrackFromHistory(track)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-fuchsia-500/20 transition-colors">
                                            <Music2 className="w-4 h-4 text-white/40 group-hover:text-fuchsia-500" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{track.title}</p>
                                            <p className="text-[9px] text-white/40 truncate italic">{track.vibe}</p>
                                          </div>
                                          </button>
                                          <button onClick={() => downloadTrackSummaryPdf(track)} className="text-[8px] uppercase tracking-widest text-white/30 hover:text-white">PDF</button>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <button className="text-white/40 hover:text-white transition-colors"><Shuffle className="w-5 h-5" /></button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setFlipInput(currentTrack?.vibe || '');
                                setShowFlipModal(true);
                              }}
                              className="px-4 py-2 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-500 text-[10px] font-bold tracking-widest uppercase rounded-lg hover:bg-fuchsia-500/20 transition-all flex items-center gap-2"
                            >
                              <Zap className="w-3 h-3" />
                              Flip It
                            </button>
                            <button
                              onClick={() => {
                                if (currentTrack) {
                                  handleGenerate(`Deepen the vibe of this track: ${currentTrack.vibe}. Make it more atmospheric, complex, and immersive.`);
                                }
                              }}
                              className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[10px] font-bold tracking-widest uppercase rounded-lg hover:bg-purple-500/20 transition-all flex items-center gap-2"
                            >
                              <TrendingUp className="w-3 h-3" />
                              Deepen Vibe
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <button className="text-white/60 hover:text-white transition-colors"><SkipBack className="w-8 h-8" /></button>
                          <button
                            onClick={togglePlay}
                            className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
                          >
                            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                          </button>
                          <button className="text-white/60 hover:text-white transition-colors"><SkipForward className="w-8 h-8" /></button>
                        </div>
                        <button className="text-white/40 hover:text-white transition-colors"><Repeat className="w-5 h-5" /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {history.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-32 space-y-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-widest uppercase">Aura Collection</h3>
              <span className="text-white/40 text-xs font-mono">{history.length} TRACKS SYNTHESIZED</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
	              {history.map((track) => (
	                <div
	                  key={track.id}
	                  onClick={() => {
	                    setCurrentTrack(track);
	                    setIsPlaying(true);
	                  }}
                  className="group text-left space-y-4"
                >
                  <div className="aspect-square bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 fill-white" />
                    </div>
                  </div>
	                  <div>
	                    <h4 className="font-bold tracking-tight truncate">{track.title}</h4>
	                    <p className="text-white/40 text-xs font-light italic">{track.params.style}</p>
	                    <button
	                      onClick={(e) => {
	                        e.stopPropagation();
	                        setAuraStreamActive(true);
	                        handleGenerate(`Seed Aura Streams from saved track "${track.title}" by ${track.artist}. Continue its DNA: ${track.vibe}`);
	                      }}
	                      className="mt-2 text-[9px] font-bold uppercase tracking-widest text-fuchsia-400 hover:text-white"
	                    >
	                      Seed Aura
	                    </button>
	                  </div>
	                </div>
	              ))}
            </div>
          </motion.section>
        )}
          </div>
        )}
      </main>

      {/* Live Session Overlay */}
      <AnimatePresence>
        {showFlipModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-fuchsia-500/20 rounded-xl flex items-center justify-center">
                      <Layers className="w-5 h-5 text-fuchsia-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight">Flip This Track</h3>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-white/40">AI Vibe Reconstruction</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFlipModal(false)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-white/40" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-white/40">New Vibe Directive</label>
                    <textarea
                      value={flipInput}
                      onChange={(e) => setFlipInput(e.target.value)}
                      placeholder="e.g. Make it a Rio Drift Phonk with heavy sub bass..."
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {['Rio Drift Phonk', '90s Chicano Soul', 'Dark Ethereal Trap', 'Late Night Jazz'].map(suggestion => (
                      <button
                        key={suggestion}
                        onClick={() => setFlipInput(suggestion)}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-bold tracking-widest uppercase text-white/40 hover:text-white hover:bg-white/10 transition-all text-left"
                      >
                        + {suggestion}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-white/35">Freeze Elements</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['vocals', 'Vocals'],
                        ['beat', 'Beat'],
                        ['lyrics', 'Lyrics'],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setFreezeElements(prev => ({ ...prev, [key]: !(prev as any)[key] }))}
                          className={cn(
                            "py-2 rounded-xl border text-[8px] font-bold uppercase tracking-widest transition-all",
                            (freezeElements as any)[key] ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-100" : "border-white/10 text-white/40 hover:text-white"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <select
                      value={flipTempo}
                      onChange={(e) => setFlipTempo(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white outline-none"
                    >
                      <option value="same" className="bg-black">Keep Tempo</option>
                      <option value="slower" className="bg-black">Slower / Chopped & Screwed</option>
                      <option value="faster" className="bg-black">Faster / Double-Time</option>
                    </select>
                  </div>
                  {currentTrack?.isRemix && (
                    <div className="grid grid-cols-3 gap-2">
                      {(['TikTok', 'Instagram', 'Twitter'] as const).map(platform => (
                        <button
                          key={platform}
                          onClick={() => shareRemix(platform)}
                          className="py-2 rounded-xl border border-white/10 text-[8px] font-bold uppercase tracking-widest text-white/45 hover:text-white hover:bg-white/10"
                        >
                          {platform}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (flipInput.trim()) {
                      handleGenerate(
                        `${flipInput}. Freeze settings: vocals=${freezeElements.vocals}, beat=${freezeElements.beat}, lyrics=${freezeElements.lyrics}. Tempo reconstruction: ${flipTempo}.`,
                        currentTrack || undefined
                      );
                      setShowFlipModal(false);
                    }
                  }}
                  className="w-full py-4 bg-fuchsia-500 hover:bg-fuchsia-400 text-black rounded-2xl font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-fuchsia-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Flip
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLiveSessionOpen && (
          <LiveSession onClose={() => setIsLiveSessionOpen(false)} />
        )}
      </AnimatePresence>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl || undefined}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

      {/* Footer Navigation (Mobile Style) */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-8 py-4 flex items-center gap-12 z-50 shadow-2xl">
        <button className="text-fuchsia-500"><Music2 className="w-6 h-6" /></button>
        <button className="text-white/40 hover:text-white transition-colors"><Search className="w-6 h-6" /></button>
        <button className="text-white/40 hover:text-white transition-colors"><Activity className="w-6 h-6" /></button>
        <button className="text-white/40 hover:text-white transition-colors"><Heart className="w-6 h-6" /></button>
      </nav>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
