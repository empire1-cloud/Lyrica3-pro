import { useState, useEffect, useCallback, useMemo } from "react";
import { useFreeTier } from "../lib/useFreeTier";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Square, Rewind, FastForward, SkipBack, SkipForward,
  Mic2, Settings, FolderOpen, Layers, Volume2, Maximize2,
  ListMusic, X, Save, Settings2, SlidersHorizontal, AlertCircle,
  Users, BarChart3, Copy, Building2
} from "lucide-react";

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

type Stem = { name: string; level?: number; peak?: number; src?: string | null };
type Track = {
  id: string; dna_tag: string; title: string; creator: string; cultural_matrix: string;
  stems: Stem[]; streams?: number; flips?: number; earnings_usd?: number;
  created_at?: string; parent_dna?: string; biometrics?: any;
};
type WalletData = {
  handle: string; wallet: string; balance_usd: number;
  lifetime_streams: number; lifetime_flips: number; active_tracks: number;
};

function authHeaders() {
  const token = localStorage.getItem('e1_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
function absolutize(src?: string | null) {
  if (!src) return null;
  if (src.startsWith('http') || src.startsWith('blob:')) return src;
  return `${BACKEND}${src.startsWith('/') ? '' : '/'}${src}`;
}

// ----------------------------------------------------------------------
// LOGIN GATE - Redesigned to fit DAW aesthetic (dark, minimal, sharp)
// ----------------------------------------------------------------------
function LoginGate({ children, onBack }: { children: React.ReactNode; onBack?: () => void }) {
  const [token, setToken] = useState(() => localStorage.getItem('e1_token'));
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsReg] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const r = await fetch(`${BACKEND}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, password }),
      });
      const data = await r.json();
      if (data.token) { localStorage.setItem('e1_token', data.token); setToken(data.token); }
      else setError(data.detail || 'Invalid credentials');
    } catch { setError('Connection error'); }
    setLoading(false);
  };

  if (token) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#050505] text-[#ccc] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm bg-[#0a0a14] border border-[#2d2d6b] shadow-2xl shadow-[#ff1493]/10">
        <div className="px-6 py-4 border-b border-[#2d2d6b] bg-[#1a1a4e]">
          <h1 className="text-sm font-bold tracking-widest text-[#eee] uppercase flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-[#ff1493]" /> Sonance Pro
          </h1>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-[#888] font-mono">Operator ID</label>
            <input type="text" placeholder="Handle" value={handle} onChange={e => setHandle(e.target.value)} required
              className="w-full bg-[#050505] border border-[#2d2d6b] text-[#ddd] px-3 py-2 text-sm focus:outline-none focus:border-[#ff1493] transition-colors rounded-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-[#888] font-mono">Passcode</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-[#050505] border border-[#2d2d6b] text-[#ddd] px-3 py-2 text-sm focus:outline-none focus:border-[#ff1493] transition-colors rounded-sm" />
          </div>
          {error && <p className="text-[#ff1493] text-xs text-center font-mono py-1 bg-[#ff1493]/10 border border-[#ff1493]/30">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#1a1a4e] hover:bg-[#2d2d6b] text-[#eee] font-bold text-xs uppercase tracking-wider py-2 transition-colors disabled:opacity-50 border border-[#2d2d6b] rounded-sm">
            {loading ? 'Authenticating...' : isRegister ? 'Initialize Access' : 'Engage'}
          </button>
          <div className="text-center pt-2">
            <button type="button" onClick={() => { setIsReg(!isRegister); setError(''); }}
              className="text-[#888] hover:text-[#ff1493] transition-colors text-[10px] uppercase tracking-wider">
              {isRegister ? 'Switch to Login' : 'Switch to Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// STEM PLAYER - DAW Track Style
// ----------------------------------------------------------------------
function StemPlayer({ stem, trackId }: { stem: Stem; trackId: string }) {
  const src = absolutize(stem.src || null);
  const [playing, setPlaying] = useState(false);

  if (!src) return (
    <div className="flex flex-col bg-[#0a0a14] border border-[#2d2d6b] p-2 h-[60px] relative overflow-hidden">
      <div className="flex justify-between items-center z-10">
        <span className="text-[10px] uppercase text-[#666] font-mono">{stem.name}</span>
        <span className="text-[9px] text-[#555] font-mono">OFFLINE</span>
      </div>
      <div className="absolute bottom-0 left-0 h-[30px] w-full flex items-end gap-[1px] opacity-20">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="flex-1 bg-[#1a1a4e]" style={{ height: `${20 + Math.random() * 30}%` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-[#13132b] border border-[#2d2d6b] p-2 h-[70px] relative group hover:border-[#ff1493] transition-colors">
      <div className="flex justify-between items-center z-10 mb-1">
        <span className="text-[10px] uppercase text-[#eee] font-mono">{stem.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#aaa] font-mono">{(stem.level || 0.75).toFixed(2)} dB</span>
          <button onClick={() => setPlaying(!playing)}
            className="w-5 h-5 bg-[#1a1a4e] hover:bg-[#2d2d6b] flex items-center justify-center text-[#ddd]">
            {playing ? <Pause className="w-3 h-3 text-[#ff1493]" /> : <Play className="w-3 h-3 text-[#ff1493]" />}
          </button>
        </div>
      </div>
      
      {/* Fake Waveform */}
      <div className="absolute bottom-1 left-2 right-2 h-[30px] flex items-center gap-[1px] opacity-40 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className={`flex-1 ${playing ? 'bg-[#ff1493]' : 'bg-[#2d2d6b]'}`} style={{ 
            height: `${playing ? 30 + Math.random() * 70 : 20 + Math.random() * 40}%`,
            transition: 'height 0.1s ease'
          }} />
        ))}
      </div>
      <audio src={src} className="hidden" />
    </div>
  );
}

// ----------------------------------------------------------------------
// MAIN STUDIO
// ----------------------------------------------------------------------
export default function ProStudio({ onLogout }: { onLogout?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [genres, setGenres] = useState<string[]>(['Acid Jazz', 'Afrobeat', 'Alternative Country', 'Baroque', 'Bengal Baul', 'Bhangra', 'Bluegrass', 'Blues Rock', 'Bossa Nova', 'Breakbeat', 'Celtic Folk', 'Chillout', 'Chiptune', 'Classic Rock', 'Contemporary R&B', 'Cumbia', 'Deep House', 'Disco Funk', 'Drum & Bass', 'Dubstep', 'EDM', 'Electro Swing', 'Funk Metal', 'G-funk', 'Garage Rock', 'Glitch Hop', 'Grime', 'Hyperpop', 'Indian Classical', 'Indie Electronic', 'Indie Folk', 'Indie Pop', 'Irish Folk', 'Jam Band', 'Jamaican Dub', 'Jazz Fusion', 'Latin Jazz', 'Lo-Fi Hip Hop', 'Marching Band', 'Merengue', 'New Jack Swing', 'Minimal Techno', 'Moombahton', 'Neo-Soul', 'Orchestral Score', 'Piano Ballad', 'Polka', 'Post-Punk', '60s Psychedelic Rock', 'Psytrance', 'R&B', 'Reggae', 'Reggaeton', 'Renaissance Music', 'Salsa', 'Shoegaze', 'Ska', 'Surf Rock', 'Synthpop', 'Techno', 'Trance', 'Trap Beat', 'Trip Hop', 'Vaporwave', 'Witch house', 'SGV Oldies', 'Trap Soul', 'Drill']);
  const [moods, setMoods] = useState<string[]>(['Acoustic Instruments', 'Ambient', 'Bright Tones', 'Chill', 'Crunchy Distortion', 'Danceable', 'Dreamy', 'Echo', 'Emotional', 'Ethereal Ambience', 'Experimental', 'Fat Beats', 'Funky', 'Glitchy Effects', 'Huge Drop', 'Live Performance', 'Lo-fi', 'Ominous Drone', 'Psychedelic', 'Rich Orchestration', 'Saturated Tones', 'Subdued Melody', 'Sustained Chords', 'Swirling Phasers', 'Tight Groove', 'Unsettling', 'Upbeat', 'Virtuoso', 'Weird Noises', 'Late-Night Honesty', 'Street Resilience', 'Defiant Bloom']);
  const [instruments, setInstruments] = useState<string[]>(['303 Acid Bass', '808 Hip Hop Beat', 'Accordion', 'Alto Saxophone', 'Bagpipes', 'Balalaika Ensemble', 'Banjo', 'Bass Clarinet', 'Bongos', 'Boomy Bass', 'Bouzouki', 'Buchla Synths', 'Cello', 'Charango', 'Clavichord', 'Conga Drums', 'Didgeridoo', 'Dirty Synths', 'Djembe', 'Drumline', 'Dulcimer', 'Fiddle', 'Flamenco Guitar', 'Funk Drums', 'Glockenspiel', 'Guitar', 'Hang Drum', 'Harmonica', 'Harp', 'Harpsichord', 'Hurdy-gurdy', 'Kalimba', 'Koto', 'Lyre', 'Mandolin', 'Maracas', 'Marimba', 'Mbira', 'Mellotron', 'Metallic Twang', 'Moog Oscillations', 'Ocarina', 'Persian Tar', 'Pipa', 'Precision Bass', 'Ragtime Piano', 'Rhodes Piano', 'Shamisen', 'Shredding Guitar', 'Sitar', 'Slide Guitar', 'Smooth Pianos', 'Spacey Synths', 'Steel Drum', 'Synth Pads', 'Tabla', 'TR-909 Drum Machine', 'Trumpet', 'Tuba', 'Vibraphone', 'Viola Ensemble', 'Warm Acoustic Guitar', 'Woodwinds', 'Auto']);
  const [keys, setKeys] = useState<{value: string, label: string}[]>([
    {value: 'SCALE_UNSPECIFIED', label: 'Auto (Model Decides)'},
    {value: 'C_MAJOR_A_MINOR', label: 'C major / A minor'},
    {value: 'D_FLAT_MAJOR_B_FLAT_MINOR', label: 'D♭ major / B♭ minor'},
    {value: 'D_MAJOR_B_MINOR', label: 'D major / B minor'},
    {value: 'E_FLAT_MAJOR_C_MINOR', label: 'E♭ major / C minor'},
    {value: 'E_MAJOR_D_FLAT_MINOR', label: 'E major / C♯/D♭ minor'},
    {value: 'F_MAJOR_D_MINOR', label: 'F major / D minor'},
    {value: 'G_FLAT_MAJOR_E_FLAT_MINOR', label: 'G♭ major / E♭ minor'},
    {value: 'G_MAJOR_E_MINOR', label: 'G major / E minor'},
    {value: 'A_FLAT_MAJOR_F_MINOR', label: 'A♭ major / F minor'},
    {value: 'A_MAJOR_G_FLAT_MINOR', label: 'A major / F♯/G♭ minor'},
    {value: 'B_FLAT_MAJOR_G_MINOR', label: 'B♭ major / G minor'},
    {value: 'B_MAJOR_A_FLAT_MINOR', label: 'B major / G♯/A♭ minor'},
  ]);
  
  const [lyrics, setLyrics] = useState('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Acid Jazz');
  const [mood, setMood] = useState('Ambient');
  const [instrument, setInstrument] = useState('Auto');
  const [trackKey, setTrackKey] = useState('SCALE_UNSPECIFIED');
  const [imageBase64, setImageBase64] = useState<string>('');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Strip the data URI prefix (e.g., data:image/jpeg;base64,)
        const base64Data = base64String.split(',')[1];
        setImageBase64(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const [vulnerabilityAgg, setVulnAgg] = useState(0.54);
  const [swingMs, setSwingMs] = useState(12);

  const freeTier = useFreeTier();
  const canGenerate = useMemo(() => lyrics.trim().length > 0 && !freeTier.isLocked, [lyrics, freeTier.isLocked]);

  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [orchestratorLog, setOrchestratorLog] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'studio'|'workspace'|'analytics'|'batch'|'enterprise'>('studio');

  const generateLyrics = async () => {
    if (lyricsLoading) return;
    setLyricsLoading(true);
    try {
      const r = await fetch(`${BACKEND}/api/generate_lyrics`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ genre, mood, instrument: instrument === 'Auto' ? undefined : instrument }),
      });
      const data = await r.json();
      if (data.lyrics) setLyrics(data.lyrics);
    } catch (e) {
      console.error(e);
    } finally {
      setLyricsLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const tracksRes = await fetch(`${BACKEND}/api/tracks`, { headers: authHeaders() });
      if (tracksRes.ok) {
        const list = await tracksRes.json();
        setTracks(Array.isArray(list) ? list : []);
      }
    } catch {}
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const generate = async () => {
    if (!canGenerate || loading) return;
    setLoading(true); setError('');
    setOrchestratorLog([]);
    
    // Simulate orchestration steps for visual feedback
    const steps = [
      "> SL Audio Master: Interpreting subtext...",
      "> SL Audio Master: Calculating emotional vector...",
      "> SL Audio Master: Applying respect protocol...",
      "> The Beast: Generating Lyria directives...",
      "> Chirp 3 HD: Synthesizing vocal performance...",
      "> Lyria 3 Pro: Orchestrating instrumental stems...",
      "> DSP: Applying mastering chain..."
    ];
    
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setOrchestratorLog(prev => [...prev, steps[stepIndex]]);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1500);

    try {
      const r = await fetch(`${BACKEND}/api/generate`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ lyrics, genre, mood, title: title || undefined, vulnerability_override: vulnerabilityAgg, swing_ms: swingMs, instrument: instrument === 'Auto' ? undefined : instrument, key_scale: trackKey === 'SCALE_UNSPECIFIED' ? undefined : trackKey, reference_image_b64: imageBase64 || undefined }),
      });
      clearInterval(interval);
      setOrchestratorLog(prev => [...prev, "> Operation complete. Unpacking stems."]);
      
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail || 'Generation failed');
      setTracks(prev => [data, ...prev.filter(t => t.dna_tag !== data.dna_tag)]);
      setTitle(''); setLyrics('');
      freeTier.incrementGeneration();
    } catch (e: any) { 
      clearInterval(interval);
      setError(e?.message || 'Generation failed.'); 
      setOrchestratorLog(prev => [...prev, "> Error encountered. Aborting."]);
    }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#ddd] flex flex-col font-sans select-none">
      
      {/* Top Transport / Menu Bar */}
      <header className="h-12 bg-[#1a1a4e] border-b border-[#2d2d6b] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#ff1493] rounded-sm" />
            <span className="font-bold tracking-widest text-xs text-[#eee] uppercase">Sonance Pro</span>
          </div>
          
          {/* Fake Transport Controls */}
          <div className="flex items-center gap-1 bg-[#0a0a14] p-1 border border-[#2d2d6b] rounded-sm">
            <button className="w-8 h-6 flex items-center justify-center hover:bg-[#1a1a4e] text-[#888]"><SkipBack className="w-3 h-3" /></button>
            <button className="w-8 h-6 flex items-center justify-center hover:bg-[#1a1a4e] text-[#888]"><Rewind className="w-3 h-3" /></button>
            <button className="w-10 h-6 flex items-center justify-center bg-[#1a1a4e] hover:bg-[#2d2d6b] text-[#eee]"><Play className="w-3 h-3 text-[#ff1493]" /></button>
            <button className="w-8 h-6 flex items-center justify-center hover:bg-[#1a1a4e] text-[#888]"><Square className="w-3 h-3" /></button>
            <button className="w-8 h-6 flex items-center justify-center hover:bg-[#1a1a4e] text-[#888]"><FastForward className="w-3 h-3" /></button>
            <button className="w-8 h-6 flex items-center justify-center hover:bg-[#1a1a4e] text-[#888]"><SkipForward className="w-3 h-3" /></button>
          </div>
          
          {/* Info Readout */}
          <div className="flex items-center gap-4 px-3 py-1 bg-[#050505] border border-[#2d2d6b] font-mono text-[10px] text-[#ff1493]">
            <span>120.00 BPM</span>
            <span className="w-px h-3 bg-[#2d2d6b]" />
            <span>4/4</span>
            <span className="w-px h-3 bg-[#2d2d6b]" />
            <span>CPU: {loading ? '84%' : '12%'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onLogout} className="text-[10px] uppercase text-[#888] hover:text-[#eee] font-mono transition-colors border border-[#2d2d6b] px-2 py-1 bg-[#0a0a14]">
            Disconnect
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Navigation Bar */}
        <aside className="w-14 bg-[#050505] border-r border-[#2d2d6b] flex flex-col items-center py-4 gap-4 z-10 shrink-0">
          <button onClick={() => setActiveView('studio')} className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${activeView === 'studio' ? 'bg-[#1a1a4e] text-[#ff1493] border border-[#ff1493]/30' : 'text-[#888] hover:text-[#eee] hover:bg-[#1a1a4e]'}`} title="Generation Studio">
            <Layers className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveView('workspace')} className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${activeView === 'workspace' ? 'bg-[#1a1a4e] text-[#ff1493] border border-[#ff1493]/30' : 'text-[#888] hover:text-[#eee] hover:bg-[#1a1a4e]'}`} title="Team Workspace (Docs/Sheets)">
            <Users className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveView('analytics')} className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${activeView === 'analytics' ? 'bg-[#1a1a4e] text-[#ff1493] border border-[#ff1493]/30' : 'text-[#888] hover:text-[#eee] hover:bg-[#1a1a4e]'}`} title="AI Analytics">
            <BarChart3 className="w-5 h-5" />
          </button>
          <button onClick={() => setActiveView('batch')} className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${activeView === 'batch' ? 'bg-[#1a1a4e] text-[#ff1493] border border-[#ff1493]/30' : 'text-[#888] hover:text-[#eee] hover:bg-[#1a1a4e]'}`} title="Batch Processing Queue">
            <Copy className="w-5 h-5" />
          </button>
          <div className="mt-auto" />
          <button onClick={() => setActiveView('enterprise')} className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${activeView === 'enterprise' ? 'bg-[#1a1a4e] text-[#ff1493] border border-[#ff1493]/30' : 'text-[#888] hover:text-[#eee] hover:bg-[#1a1a4e]'}`} title="Enterprise Governance">
            <Building2 className="w-5 h-5" />
          </button>
        </aside>

        {/* Left Browser Panel */}
        <aside className="w-64 bg-[#0a0a14] border-r border-[#2d2d6b] flex flex-col">
          <div className="p-2 border-b border-[#2d2d6b] bg-[#1a1a4e]">
            <span className="text-[9px] uppercase tracking-widest text-[#888] font-bold">Project Catalog</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-[#2d2d6b] scrollbar-track-transparent">
            {tracks.map((t, idx) => (
              <div key={t.id || idx} className="flex flex-col p-2 bg-[#1a1a4e] hover:bg-[#2d2d6b] border border-[#2d2d6b] cursor-pointer group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-[#ddd] truncate">{t.title || 'Untitled'}</span>
                  <span className="text-[8px] text-[#666] font-mono">{t.dna_tag.slice(0, 8)}</span>
                </div>
                <span className="text-[9px] text-[#ff1493]">{t.cultural_matrix}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Canvas (Arranger / Generation Form) */}
        <main className="flex-1 bg-[#030303] flex flex-col relative">
          {/* Header */}
          <div className="p-2 border-b border-[#2d2d6b] bg-[#1a1a4e] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#ff1493]" />
              <span className="text-[10px] uppercase tracking-widest text-[#eee] font-bold">Soulfire Generation Matrix</span>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-4">
              
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-1 space-y-1">
                  <label className="text-[9px] uppercase text-[#888] font-mono">Track ID / Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} 
                    className="w-full bg-[#13132b] border border-[#2d2d6b] text-[#eee] px-2 py-1.5 text-xs focus:border-[#ff1493] focus:outline-none rounded-none" />
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-[9px] uppercase text-[#888] font-mono">Genre Protocol</label>
                  <select value={genre} onChange={e => setGenre(e.target.value)} 
                    className="w-full bg-[#13132b] border border-[#2d2d6b] text-[#eee] px-2 py-1.5 text-xs focus:border-[#ff1493] focus:outline-none rounded-none appearance-none cursor-pointer">
                    {genres.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-[9px] uppercase text-[#888] font-mono">Emotional Vector</label>
                  <select value={mood} onChange={e => setMood(e.target.value)} 
                    className="w-full bg-[#13132b] border border-[#2d2d6b] text-[#eee] px-2 py-1.5 text-xs focus:border-[#ff1493] focus:outline-none rounded-none appearance-none cursor-pointer">
                    {moods.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-[9px] uppercase text-[#888] font-mono">Core Instrument</label>
                  <select value={instrument} onChange={e => setInstrument(e.target.value)} 
                    className="w-full bg-[#13132b] border border-[#2d2d6b] text-[#eee] px-2 py-1.5 text-xs focus:border-[#ff1493] focus:outline-none rounded-none appearance-none cursor-pointer">
                    {instruments.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="col-span-1 space-y-1">
                  <label className="text-[9px] uppercase text-[#888] font-mono">Key / Scale</label>
                  <select value={trackKey} onChange={e => setTrackKey(e.target.value)} 
                    className="w-full bg-[#13132b] border border-[#2d2d6b] text-[#eee] px-2 py-1.5 text-xs focus:border-[#ff1493] focus:outline-none rounded-none appearance-none cursor-pointer">
                    {keys.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] uppercase text-[#888] font-mono">Lyric Seed Input</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer text-[9px] text-[#ff1493] hover:text-white uppercase tracking-widest font-bold transition-colors">
                      {imageBase64 ? 'Image Attached ✓' : '+ Attach Inspiration Image'}
                      <input type="file" accept="image/jpeg, image/png" className="hidden" onChange={handleImageUpload} />
                    </label>
                    <button onClick={generateLyrics} disabled={lyricsLoading}
                      className="text-[9px] text-[#ff1493] hover:text-white uppercase tracking-widest font-bold disabled:opacity-50 transition-colors">
                      {lyricsLoading ? 'Generating...' : 'Auto-Generate Lyrics'}
                    </button>
                  </div>
                </div>
                <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} rows={6} 
                  className="w-full bg-[#0a0a14] border border-[#2d2d6b] text-[#eee] px-3 py-2 text-sm focus:border-[#ff1493] focus:outline-none font-mono resize-y rounded-none" />
              </div>

              <div className="grid grid-cols-2 gap-4 border border-[#2d2d6b] bg-[#0a0a14] p-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] uppercase text-[#888] font-mono">Vulnerability Depth</label>
                    <span className="text-[9px] text-[#ff1493] font-mono">{(vulnerabilityAgg * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.01} value={vulnerabilityAgg} onChange={e => setVulnAgg(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#1a1a4e] appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#ff1493]" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] uppercase text-[#888] font-mono">Late-Pocket Swing Delay</label>
                    <span className="text-[9px] text-[#ff1493] font-mono">{swingMs}ms</span>
                  </div>
                  <input type="range" min={10} max={15} step={1} value={swingMs} onChange={e => setSwingMs(parseInt(e.target.value))}
                    className="w-full h-1 bg-[#1a1a4e] appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#ff1493]" />
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                {error ? (
                  <div className="text-[#ff1493] text-xs font-mono bg-[#ff1493]/10 px-2 py-1 border border-[#ff1493]/30 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> {error}
                  </div>
                ) : <div />}
                
                <button onClick={generate} disabled={!canGenerate || loading}
                  className="bg-[#1a1a4e] hover:bg-[#2d2d6b] border border-[#ff1493] text-white px-6 py-2 text-xs uppercase tracking-widest font-bold disabled:opacity-50 flex items-center gap-2">
                  {loading ? 'Synthesizing...' : 'Execute Generation'}
                  <Play className="w-3 h-3 text-[#ff1493]" />
                </button>
              </div>

            </div>

            {/* Timeline View (Visual placeholder for recent tracks) */}
            <div className="mt-8 border-t border-[#2d2d6b] pt-4">
              <span className="text-[10px] uppercase text-[#666] font-mono mb-2 block">Active Arranger View</span>
              {tracks.slice(0, 3).map((t, idx) => (
                <div key={t.dna_tag} className="mb-2">
                  <div className="flex items-center gap-2 bg-[#13132b] border border-[#2d2d6b] p-1 mb-[1px]">
                    <span className="w-4 text-[9px] text-[#888] font-mono text-center">{idx + 1}</span>
                    <span className="text-xs text-[#ddd] w-48 truncate">{t.title || 'Track'}</span>
                    <span className="text-[9px] text-[#ff1493] font-mono">{t.dna_tag.slice(0,10)}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-[1px]">
                    {Array.isArray(t.stems) && t.stems.map((s, i) => (
                      <StemPlayer key={`${t.dna_tag}_${s.name}_${i}`} stem={s} trackId={t.dna_tag} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>

        {/* Right Inspector / Mixer */}
        <aside className="w-72 bg-[#0a0a14] border-l border-[#2d2d6b] flex flex-col">
          <div className="p-2 border-b border-[#2d2d6b] bg-[#1a1a4e]">
            <span className="text-[9px] uppercase tracking-widest text-[#eee] font-bold flex items-center gap-2">
              <SlidersHorizontal className="w-3 h-3 text-[#ff1493]" /> Master Channel
            </span>
          </div>
          
          <div className="p-4 flex-1 flex flex-col gap-6">
            
            {/* Fake Master Meters */}
            <div className="flex gap-2 h-48 justify-center items-end bg-[#050505] border border-[#2d2d6b] p-2">
              <div className="w-3 h-full bg-[#13132b] relative flex flex-col justify-end">
                <div className={`w-full bg-gradient-to-t from-[#ff1493] via-[#ff69b4] to-[#ffb6c1] transition-all ${loading ? 'h-[75%]' : 'h-[10%]'}`} />
              </div>
              <div className="w-3 h-full bg-[#13132b] relative flex flex-col justify-end">
                <div className={`w-full bg-gradient-to-t from-[#ff1493] via-[#ff69b4] to-[#ffb6c1] transition-all ${loading ? 'h-[80%]' : 'h-[12%]'}`} />
              </div>
              <div className="flex flex-col justify-between h-full text-[8px] text-[#ff1493] font-mono ml-1">
                <span>0</span>
                <span>-6</span>
                <span>-12</span>
                <span>-24</span>
                <span>-48</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-[#888]">
                  <span>LUFS Target</span>
                  <span className="text-[#ff1493]">-14.0</span>
                </div>
                <div className="h-1 bg-[#1a1a4e]"><div className="h-full w-[80%] bg-[#ff1493]" /></div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-[#888]">
                  <span>Master Gain</span>
                  <span className="text-[#ff1493]">0.0 dB</span>
                </div>
                <input type="range" min="-12" max="12" defaultValue="0" 
                  className="w-full h-1 bg-[#1a1a4e] appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-[#ff1493]" />
              </div>
            </div>
            
            <div className="mt-auto border-t border-[#2d2d6b] pt-4 flex flex-col gap-2">
              <div className="bg-[#13132b] border border-[#2d2d6b] p-3 text-center">
                <span className="block text-[8px] uppercase tracking-widest text-[#666] mb-1">Soulfire Engine Status</span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${loading ? 'text-white' : 'text-[#ff1493]'}`}>
                  {loading ? 'Processing' : 'Online & Ready'}
                </span>
              </div>
              
              {(orchestratorLog.length > 0) && (
                <div className="bg-[#050505] border border-[#2d2d6b] p-2 h-32 overflow-y-auto font-mono text-[8px] text-[#888] flex flex-col gap-1">
                  {orchestratorLog.map((log, i) => (
                    <span key={i} className="text-[#00ffcc]">{log}</span>
                  ))}
                  {loading && <span className="animate-pulse text-[#ff1493]">_</span>}
                </div>
              )}
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
}

export { LoginGate };