import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic2, Radio, Sliders, Sparkles, Play, Share2, Layers, 
  Settings2, Activity, Disc3, Music, Flame, Users, ListMusic, ChevronDown, ShieldAlert, X, Loader2,
  Box, UserPlus, Cable, MapPin, Save, Download, Headphones, Mic, Zap, Filter
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type AppMode = 'sonance' | 'universal' | 'orchestrator';

const PROJECTS = {
  smile: {
    id: 'smile',
    title: 'Smile Through the Damage',
    vibe: 'Chicano Soul / MC Magic Vibe',
    matrix: 'Chicano Soul (Analog Brass, Talkbox)',
    rhythm: 'Cruising Drums (15ms Snare Drag)',
    lyrics: `(Talkbox Intro - Smooth Zapp & Roger style)
Yeah... cruising down Whittier...
I told you I was fine, but the rearview mirror knows I'm lying.
Trying to outrun this quiet, but the bass keeps bumping.
(Smooth analog brass swells)
Smile through the damage, keep the ride clean,
You know how we do it for the scene...`,
    vulnerability: 65,
    duo: false,
    prompt: "I need a song for a late-night drive in the rain, Chicano Soul, MC Magic talkbox vibe, masking the pain but keeping it smooth."
  },
  scars: {
    id: 'scars',
    title: 'Scars in the Dark',
    vibe: 'Tired of Being Strong × Guarded Hearts',
    matrix: 'Guarded Hearts (Min9/Maj7, 200Hz warm)',
    rhythm: 'ShadyBoy Soul (72BPM, 15ms Snare Drag)',
    lyrics: `🎤 HOOK — Armor Off (Duet)
Take your armor off, leave it at the door,
We don’t gotta play pretend, not anymore.
You show me your demons, I’ll show you my ghost,
We the ones who hurt the quietest, but love the most.

🎶 VERSE 1 — The Independent Facade (Hurting Girl)
You walk with that attitude, head held high,
Got that designer bag just to carry your pride.
They think you got it together, no flaws to be seen,
But I know the heavy weight on the independent queen.

🎶 PRE‑HOOK — The Mirror Between Us (ShadyBoy)
But I see the cracks in your walls, I see the tear,
I know the sound of a heart that’s beating in fear.`,
    vulnerability: 85,
    duo: true,
    prompt: "I need a duet about two guarded people dropping their armor, ShadyBoy soul vibe, tired of being strong..."
  }
};

const BACKEND = process.env.REACT_APP_BACKEND_URL || '';

function LoginGate({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('e1_token'));
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${BACKEND}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, password }),
      });
      const data = await r.json();
      if (data.token) {
        localStorage.setItem('e1_token', data.token);
        setToken(data.token);
      } else {
        setError(data.detail || 'Invalid credentials');
      }
    } catch {
      setError('Connection error — try again');
    }
    setLoading(false);
  };

  if (token) return <>{children}</>;

  return (
    <div style={{ minHeight: '100vh', background: '#030303', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-monospace, monospace' }}>
      <div style={{ width: 360, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 16, padding: 40 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#D4AF37', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>Lyrica 3 Pro</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>EMPIRE 1</div>
          <div style={{ fontSize: 10, color: '#444', marginTop: 4, letterSpacing: '0.2em' }}>SOVEREIGN STUDIO ACCESS</div>
        </div>
        <form onSubmit={login}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Handle"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              required
              style={{ width: '100%', background: '#000', border: '1px solid #222', color: '#fff', padding: '12px 14px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', background: '#000', border: '1px solid #222', color: '#fff', padding: '12px 14px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 14, textAlign: 'center' }}>{error}</div>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#D4AF37', color: '#000', border: 'none', borderRadius: 8, padding: '13px 0', fontWeight: 900, fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Authenticating...' : 'Enter Studio'}
          </button>
        </form>
      </div>
    </div>
  );
}

function StudioApp() {
  const [mode, setMode] = useState<AppMode>('sonance');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500/30 overflow-hidden flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-md z-50 relative">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold tracking-widest text-lg bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-rose-200">
              LYRICA 3 PRO
            </span>
          </div>
          
          <div className="flex bg-neutral-900/50 p-1 rounded-xl border border-neutral-800/50">
            <button
              onClick={() => setMode('sonance')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                mode === 'sonance' 
                  ? 'bg-neutral-800 text-amber-400 shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Sonance Pro
            </button>
            <button
              onClick={() => setMode('universal')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                mode === 'universal' 
                  ? 'bg-neutral-800 text-rose-400 shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              SL Universal
            </button>
            <button
              onClick={() => setMode('orchestrator')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                mode === 'orchestrator' 
                  ? 'bg-neutral-800 text-blue-400 shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              Orchestrator
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {mode === 'sonance' ? (
            <SonancePro key="sonance" />
          ) : mode === 'universal' ? (
            <SLUniversal key="universal" />
          ) : (
            <GenerativeAudioSuite key="orchestrator" />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- GENERATIVE AUDIO SUITE (ORCHESTRATOR) ---
function GenerativeAudioSuite() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setGeneratedAudioUrl(null);
    setGeneratedLyrics(null);
    
    try {
      if (!await window.aistudio.hasSelectedApiKey()) {
        await window.aistudio.openSelectKey();
      }
      
      setIsGenerating(true);
      setGenerationStatus("Initializing Lyria 3 Pro Orchestrator...");
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      
      const prompt = `
        You are the Generative Audio Suite, an autonomous production layer within the Vertex AI Orchestrator. 
        Your goal is to synthesize three distinct categories of studio-ready audio assets in one execution cycle. 
        Every generated segment must be non-repetitive for a minimum of 64 bars (or 3 minutes for soundscapes) 
        to eliminate the synthetic artifacts common in competing models.

        1. Declarative Music Composition
        Generate a complete track based on the following declarative schema.
        Master Style: Electro-Swing / Dark Cabaret, featuring vintage horns and a driving four-on-the-floor beat.
        Structure: A-B-A-C form. Section B (Bars 17-32) must introduce a key change to the relative major.
        Tempo / Key: 125 BPM (steady). Key of G Minor.
        Vocal Stem: Smooth, male baritone voice singing the line: "The velvet cage is now unlocked." (Repeat once at Bar 18).
      `;
      
      setGenerationStatus("Synthesizing Master Composition & Stems...");
      const response = await ai.models.generateContentStream({
        model: "lyria-3-pro-preview",
        contents: prompt,
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      if (audioBase64) {
        setGenerationStatus("Finalizing Audio Assets...");
        const binary = atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);
        setGeneratedAudioUrl(audioUrl);
        setGeneratedLyrics(lyrics);
      } else {
        setError("Failed to generate audio.");
      }
      
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      } else {
        setError(error.message || "An error occurred during generation.");
      }
    } finally {
      setIsGenerating(false);
      setGenerationStatus(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col p-6 overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto w-full space-y-8 pb-24">
        <div className="flex justify-between items-end border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              Generative Audio Suite
            </h1>
            <p className="text-neutral-400 mt-2">Vertex AI Orchestrator • Lyria 3 Pro Integration</p>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${
              isGenerating 
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Executing Cycle...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Execute Generation Cycle
              </>
            )}
          </button>
        </div>

        {/* Status & Output Area */}
        <AnimatePresence>
          {(isGenerating || generatedAudioUrl || error) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6"
            >
              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                    <Activity className="w-12 h-12 text-blue-400 animate-pulse relative z-10" />
                  </div>
                  <p className="text-blue-400 font-mono text-sm">{generationStatus}</p>
                  
                  {/* Progress visualization */}
                  <div className="w-64 h-2 bg-neutral-800 rounded-full overflow-hidden mt-4">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 30, ease: "linear" }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-1">Execution Failed</h4>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {generatedAudioUrl && !isGenerating && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      Generated Assets
                    </h3>
                  </div>
                  
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-neutral-400 mb-3 uppercase tracking-wider">Master Composition</h4>
                    <audio controls src={generatedAudioUrl} className="w-full" />
                  </div>

                  {generatedLyrics && (
                    <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-neutral-400 mb-3 uppercase tracking-wider">Generated Metadata / Lyrics</h4>
                      <pre className="text-sm text-neutral-300 font-mono whitespace-pre-wrap">
                        {generatedLyrics}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Configuration Schema Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-neutral-200 mb-4 border-b border-neutral-800 pb-2">1. Declarative Composition Schema</h3>
            <ul className="space-y-3 text-sm text-neutral-400 font-mono">
              <li><span className="text-blue-400">Master Style:</span> Electro-Swing / Dark Cabaret</li>
              <li><span className="text-blue-400">Structure:</span> A-B-A-C form (Key change @ B)</li>
              <li><span className="text-blue-400">Tempo/Key:</span> 125 BPM | G Minor</li>
              <li><span className="text-blue-400">Vocal Stem:</span> "The velvet cage is now unlocked."</li>
            </ul>
          </div>
          
          <div className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-neutral-200 mb-4 border-b border-neutral-800 pb-2">2. Foley & Acoustic Modeling</h3>
            <ul className="space-y-3 text-sm text-neutral-400 font-mono">
              <li><span className="text-amber-400">SFX 1:</span> The Vault Lock (Aged Steel, 1000kg)</li>
              <li><span className="text-amber-400">SFX 2:</span> Energy Hit (8-12kHz peak, Plasma)</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
function SonancePro() {
  const [activeProject, setActiveProject] = useState<keyof typeof PROJECTS>('scars');
  const project = PROJECTS[activeProject];
  const [showGuardrails, setShowGuardrails] = useState(false);
  
  const [activeVocalTab, setActiveVocalTab] = useState<'lead' | 'secondary'>('lead');
  const [vocalSettings, setVocalSettings] = useState({
    lead: { vulnerability: 65, pan: -20, inhale: 40, proximity: 60, fry: 25, emotionalBreak: 15 },
    secondary: { vulnerability: 85, pan: 20, inhale: 60, proximity: 80, fry: 45, emotionalBreak: 35 }
  });

  const [sonanceTab, setSonanceTab] = useState<'engine' | 'spatial' | 'persona' | 'daw' | 's2' | 'overtone'>('engine');

  // Update slider when project changes
  React.useEffect(() => {
    setVocalSettings(prev => ({
      ...prev,
      lead: { ...prev.lead, vulnerability: project.vulnerability }
    }));
  }, [project.vulnerability]);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-7xl mx-auto px-6 py-8 h-full flex flex-col gap-6 relative z-10"
      >
        <header className="mb-4 flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-amber-50">SL AUDIO Studio</h1>
              <p className="text-neutral-400 mt-1">High-Control Factory • 48kHz/24-bit Output • EMSS Composer</p>
            </div>
            
            {/* Project Selector - EVOLVING, NOT REPLACING */}
            <div className="relative group">
              <button className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl text-sm font-medium hover:border-amber-500/50 transition-colors">
                <ListMusic className="w-4 h-4 text-amber-400" />
                Project: {project.title}
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-64 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button 
                  onClick={() => setActiveProject('smile')}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-neutral-800 transition-colors ${activeProject === 'smile' ? 'text-amber-400 bg-neutral-800/50' : 'text-neutral-300'}`}
                >
                  <div className="font-bold">Smile Through the Damage</div>
                  <div className="text-xs text-neutral-500">Chicano Soul / MC Magic Vibe</div>
                </button>
                <button 
                  onClick={() => setActiveProject('scars')}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-neutral-800 transition-colors border-t border-neutral-800/50 ${activeProject === 'scars' ? 'text-amber-400 bg-neutral-800/50' : 'text-neutral-300'}`}
                >
                  <div className="font-bold">Scars in the Dark</div>
                  <div className="text-xs text-neutral-500">ShadyBoy Soul Duet</div>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-navigation */}
          <div className="flex gap-2 border-b border-neutral-800 pb-2 overflow-x-auto hide-scrollbar">
            <button 
              onClick={() => setSonanceTab('engine')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${sonanceTab === 'engine' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              <Sliders className="w-4 h-4" />
              Engine Room
            </button>
            <button 
              onClick={() => setSonanceTab('spatial')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${sonanceTab === 'spatial' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              <Box className="w-4 h-4" />
              Spatial Soul
            </button>
            <button 
              onClick={() => setSonanceTab('persona')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${sonanceTab === 'persona' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              <UserPlus className="w-4 h-4" />
              Persona Forge
            </button>
            <button 
              onClick={() => setSonanceTab('daw')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${sonanceTab === 'daw' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              <Cable className="w-4 h-4" />
              DAW Bridge
            </button>
            <button 
              onClick={() => setSonanceTab('overtone')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${sonanceTab === 'overtone' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              <Music className="w-4 h-4" />
              Overtone Engine
            </button>
            <button 
              onClick={() => setSonanceTab('s2')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${sonanceTab === 's2' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              <Zap className="w-4 h-4" />
              S2 Synthesizer
            </button>
          </div>
        </header>

        <div className="flex-1 relative">
          {sonanceTab === 'engine' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left Column: EMSS Composer */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-200">
                  <Sparkles className="w-5 h-5" />
                  "Soulfire" Core Engine
                </h2>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full border border-amber-500/20">
                  EMSS Active
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Qualitative Translation Matrix</label>
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      key={`matrix-${project.id}`}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 text-neutral-200"
                      defaultValue={project.matrix}
                    >
                      <option value={project.matrix}>{project.matrix}</option>
                      <option>Warm Souldies Chords (Maj7/Min9)</option>
                      <option>Rio Drift Phonk (Distorted 808s)</option>
                    </select>
                    <select 
                      key={`rhythm-${project.id}`}
                      className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 text-neutral-200"
                      defaultValue={project.rhythm}
                    >
                      <option value={project.rhythm}>{project.rhythm}</option>
                      <option>Cruising Drums (15ms Snare Drag)</option>
                      <option>Late-Pocket Swing (Lazy Feel)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-2">'Street-Soft' Lyrical Ghostwriter</label>
                  <textarea 
                    key={`lyrics-${project.id}`}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 text-neutral-200 h-48 resize-none font-mono text-xs leading-relaxed"
                    defaultValue={project.lyrics}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-neutral-500">Vibe: {project.vibe} • Cracks Rule: Applied</span>
                    <button className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                      <Settings2 className="w-3 h-3" /> Advanced Subtext
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Duo-Soul Engine */}
            <div className={`bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-6 backdrop-blur-sm ${project.duo ? 'border-l-4 border-l-rose-500' : ''}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-200">
                  <Users className="w-5 h-5" />
                  Duo-Soul Engine
                </h2>
                {project.duo ? (
                  <span className="px-3 py-1 bg-rose-500/10 text-rose-400 text-xs rounded-full border border-rose-500/20 flex items-center gap-1 font-medium">
                    <Mic2 className="w-3 h-3" /> Dual Delivery Active
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-neutral-800 text-neutral-400 text-xs rounded-full border border-neutral-700 flex items-center gap-1 font-medium">
                    <Mic2 className="w-3 h-3" /> Single Lead Active
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-2xl rounded-full"></div>
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div>
                      <span className="text-sm font-bold text-rose-300 block">
                        {project.duo ? 'Track A: Hurting Girl' : 'Lead Vocal'}
                      </span>
                      <span className="text-xs text-neutral-500 mt-1 block">
                        {project.duo ? 'Assigned: Hook, Verse 1, Bridge' : 'Assigned: Full Track'}
                      </span>
                    </div>
                    <Mic2 className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-rose-500/50 w-3/4 animate-pulse"></div>
                  </div>
                </div>
                <div className={`bg-neutral-950 border border-neutral-800 rounded-xl p-4 relative overflow-hidden ${!project.duo ? 'opacity-50 grayscale' : ''}`}>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full"></div>
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div>
                      <span className="text-sm font-bold text-blue-300 block">
                        {project.duo ? 'Track B: ShadyBoy' : 'Secondary Vocal (Muted)'}
                      </span>
                      <span className="text-xs text-neutral-500 mt-1 block">
                        {project.duo ? 'Assigned: Hook, Verse 2, Outro' : 'Unassigned'}
                      </span>
                    </div>
                    <Mic2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-blue-500/50 w-1/2 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Biometrics & Guardrails */}
          <div className="space-y-6 flex flex-col">
            
            {/* Cultural Context Guardrails */}
            <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-6 backdrop-blur-sm border-t-4 border-t-emerald-500">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-emerald-400">
                  <ShieldAlert className="w-5 h-5" />
                  Context Guardrails
                </h2>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase tracking-wider font-bold rounded border border-emerald-500/20 animate-pulse">
                  Scanning
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Prohibited Lexicon Filter</span>
                  <span className="text-emerald-400 font-mono text-xs">PASS</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Emotional Dialect Match</span>
                  <span className="text-emerald-400 font-mono text-xs">98.4%</span>
                </div>
                <button 
                  onClick={() => setShowGuardrails(true)}
                  className="w-full mt-2 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-xs text-neutral-300 transition-colors"
                >
                  View Knowledge Base Rules
                </button>
              </div>
            </div>

            {/* Biometric Realism */}
            <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-6 backdrop-blur-sm flex-1 flex flex-col">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-200 mb-4">
                <Activity className="w-5 h-5" />
                Biometric Realism
              </h2>
              
              {project.duo ? (
                <div className="flex gap-2 mb-4">
                  <button 
                    onClick={() => setActiveVocalTab('lead')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${activeVocalTab === 'lead' ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}
                  >
                    Track A: Hurting Girl
                  </button>
                  <button 
                    onClick={() => setActiveVocalTab('secondary')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${activeVocalTab === 'secondary' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}
                  >
                    Track B: ShadyBoy
                  </button>
                </div>
              ) : null}

              <div className="space-y-6 flex-1">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-300">Vulnerability Slider</span>
                    <span className="text-amber-400">{vocalSettings[activeVocalTab].vulnerability}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={vocalSettings[activeVocalTab].vulnerability}
                    onChange={(e) => setVocalSettings(prev => ({
                      ...prev,
                      [activeVocalTab]: { ...prev[activeVocalTab], vulnerability: Number(e.target.value) }
                    }))}
                    className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${activeVocalTab === 'lead' ? 'accent-rose-500 bg-neutral-800' : 'accent-blue-500 bg-neutral-800'}`}
                  />
                  <p className="text-xs text-neutral-500 mt-2">
                    {vocalSettings[activeVocalTab].vulnerability > 75 ? 'High vulnerability set for emotional breaks and cracks.' : 'Balanced vulnerability for smooth, masked delivery.'}
                  </p>
                </div>

                {project.duo && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-neutral-300">Stereo Panning</span>
                      <span className="text-amber-400 font-mono">
                        {vocalSettings[activeVocalTab].pan < 0 ? `L${Math.abs(vocalSettings[activeVocalTab].pan)}` : vocalSettings[activeVocalTab].pan > 0 ? `R${vocalSettings[activeVocalTab].pan}` : 'C'}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="-50" max="50" 
                      value={vocalSettings[activeVocalTab].pan}
                      onChange={(e) => setVocalSettings(prev => ({
                        ...prev,
                        [activeVocalTab]: { ...prev[activeVocalTab], pan: Number(e.target.value) }
                      }))}
                      className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${activeVocalTab === 'lead' ? 'accent-rose-500 bg-neutral-800' : 'accent-blue-500 bg-neutral-800'}`}
                    />
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t border-neutral-800/50">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Adaptive Inhale</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-600 font-mono w-6">{vocalSettings[activeVocalTab].inhale}%</span>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={vocalSettings[activeVocalTab].inhale}
                        onChange={(e) => setVocalSettings(prev => ({
                          ...prev,
                          [activeVocalTab]: { ...prev[activeVocalTab], inhale: Number(e.target.value) }
                        }))}
                        className={`w-24 h-1 rounded-lg appearance-none cursor-pointer ${activeVocalTab === 'lead' ? 'accent-rose-500 bg-neutral-800' : 'accent-blue-500 bg-neutral-800'}`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Vocal Fry / Crackle</span>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-neutral-600 font-mono w-6">{vocalSettings[activeVocalTab].fry}%</span>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={vocalSettings[activeVocalTab].fry}
                        onChange={(e) => setVocalSettings(prev => ({
                          ...prev,
                          [activeVocalTab]: { ...prev[activeVocalTab], fry: Number(e.target.value) }
                        }))}
                        className={`w-24 h-1 rounded-lg appearance-none cursor-pointer ${activeVocalTab === 'lead' ? 'accent-rose-500 bg-neutral-800' : 'accent-blue-500 bg-neutral-800'}`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Emotional Break Sim</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-600 font-mono w-6">{vocalSettings[activeVocalTab].emotionalBreak}%</span>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={vocalSettings[activeVocalTab].emotionalBreak}
                        onChange={(e) => setVocalSettings(prev => ({
                          ...prev,
                          [activeVocalTab]: { ...prev[activeVocalTab], emotionalBreak: Number(e.target.value) }
                        }))}
                        className={`w-24 h-1 rounded-lg appearance-none cursor-pointer ${activeVocalTab === 'lead' ? 'accent-rose-500 bg-neutral-800' : 'accent-blue-500 bg-neutral-800'}`}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-400">Proximity Modeling</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-600 font-mono w-6">{vocalSettings[activeVocalTab].proximity}%</span>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={vocalSettings[activeVocalTab].proximity}
                        onChange={(e) => setVocalSettings(prev => ({
                          ...prev,
                          [activeVocalTab]: { ...prev[activeVocalTab], proximity: Number(e.target.value) }
                        }))}
                        className={`w-24 h-1 rounded-lg appearance-none cursor-pointer ${activeVocalTab === 'lead' ? 'accent-rose-500 bg-neutral-800' : 'accent-blue-500 bg-neutral-800'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2">
              <Disc3 className="w-5 h-5 animate-spin-slow" />
              Render {project.duo ? 'Dual' : 'Studio'} Master (48kHz)
            </button>
          </div>
            </div>
          )}
          {sonanceTab === 'spatial' && <SpatialStudio project={project} />}
          {sonanceTab === 'persona' && <PersonaBuilder />}
          {sonanceTab === 'daw' && <DAWBridge project={project} />}
          {sonanceTab === 'overtone' && <OvertoneEngine project={project} />}
          {sonanceTab === 's2' && <S2Synthesizer />}
        </div>
      </motion.div>

      {/* Guardrails Modal */}
      <AnimatePresence>
        {showGuardrails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/50">
                <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                  <ShieldAlert className="w-6 h-6" />
                  Chicano Soulfire Knowledge Base & Guardrails
                </h2>
                <button onClick={() => setShowGuardrails(false)} className="text-neutral-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6 text-sm text-neutral-300">
                <div className="space-y-2">
                  <h3 className="text-amber-400 font-bold text-base border-b border-neutral-800 pb-2">1. Definitive Glossary</h3>
                  <p><strong>Soulfire / EMSS / Chicano:</strong> An emotional dialect, not a genre stereotype. Defined by bright chords with bruised subtext, late-pocket drums, warm analog textures, internalized vocal delivery, and playful masking of sadness.</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-rose-400 font-bold text-base border-b border-neutral-800 pb-2">2. Prohibited Lexicon (STRICT DENY)</h3>
                  <ul className="list-disc pl-5 space-y-1 text-rose-200/80">
                    <li>Country or Americana cadence / twang / vowel shaping</li>
                    <li>Folk-ballad storytelling structures</li>
                    <li>Choir terminology (soprano, alto, tenor)</li>
                    <li>Classical or crooner references (Bach, Beethoven, Sinatra)</li>
                    <li>Neutral, sanitized, or white-coded emotional tones</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-blue-400 font-bold text-base border-b border-neutral-800 pb-2">3. Hardcoded System Prompts</h3>
                  <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 font-mono text-xs text-neutral-400">
                    <span className="text-blue-300">DIRECTIVE:</span> "You are operating under the Chicano Soulfire creative engine. Your primary goal is to generate output that embodies the 'Playful Pain' of the El Monte street-soul aesthetic."<br/><br/>
                    <span className="text-blue-300">MODULAR COMPOSITION:</span> "Treat rhythm, melody, instrumentation, and emotional tone as separate, combinable layers. When a genre is chosen, it defines the rhythmic and structural base ONLY."
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-emerald-400 font-bold text-base border-b border-neutral-800 pb-2">4. Cultural Context Guardrails</h3>
                  <p>Active checks analyze generated output for compliance with the "Soulfire" dialect. Automatically flags or reruns generations that fall into generic or culturally misaligned patterns (e.g., catching and correcting a "Baltimore soprano" hallucination).</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- NEW COMPONENTS FOR SONANCE PRO ---

function SpatialStudio({ project }: { project: any }) {
  const [roomType, setRoomType] = useState('wood');
  const [micBleed, setMicBleed] = useState(45);
  const [studioAcoustics, setStudioAcoustics] = useState({ absorption: 60, diffusion: 40, reverb: 30 });
  const [activeVoice, setActiveVoice] = useState('lead');
  const [vocalists, setVocalists] = useState([
    { id: 'lead', name: 'Lead', role: 'Lead', color: 'rose', x: -120, y: -80, bleedIntensity: 0 },
    { id: 'double', name: 'Double', role: 'Backup', color: 'rose', x: -140, y: -60 },
    { id: 'harm1', name: 'Harmony High', role: 'Harmony', color: 'amber', x: 120, y: -40 },
    { id: 'harm2', name: 'Harmony Low', role: 'Harmony', color: 'amber', x: 140, y: -20 },
    ...(project.duo ? [{ id: 'secondary', name: 'Secondary', role: 'Lead', color: 'blue', x: 80, y: 100 }] : [])
  ]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col gap-6"
    >
      <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-6 backdrop-blur-sm flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-200">
            <Box className="w-5 h-5" />
            Interactive Multitracking
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 shadow-inner">
              <Users className="w-4 h-4 text-neutral-500" />
              <span className="text-xs text-neutral-300 font-bold">{vocalists.length} Cast Members Active</span>
            </div>
            <select 
              value={roomType}
              onChange={(e) => {
                setRoomType(e.target.value);
                // Dynamic acoustic profiles based on room selection
                const profiles: any = {
                  intimate: { absorption: 90, diffusion: 10, reverb: 5 },
                  wood: { absorption: 60, diffusion: 40, reverb: 30 },
                  cathedral: { absorption: 10, diffusion: 30, reverb: 95 },
                  concrete: { absorption: 20, diffusion: 80, reverb: 60 }
                };
                setStudioAcoustics(profiles[e.target.value]);
              }}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500/50 text-neutral-200"
            >
              <option value="intimate">Intimate Vocal Booth</option>
              <option value="wood">Wood Panel Studio</option>
              <option value="cathedral">Cathedral Reverb</option>
              <option value="concrete">Concrete Basement</option>
            </select>
          </div>
        </div>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* 2D Visualizer */}
            <div className={`flex-1 border-2 rounded-2xl relative overflow-hidden flex items-center justify-center cursor-crosshair group transition-all duration-700 ${
              roomType === 'intimate' ? 'bg-neutral-900 border-neutral-800' : 
              roomType === 'wood' ? 'bg-[#1a1410] border-amber-900/30' :
              roomType === 'cathedral' ? 'bg-[#0f172a] border-blue-900/30' : 'bg-neutral-900 border-neutral-700'
            }`}>
              {/* Studio Grid & Acoustic Markers */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }} />
              
              {/* Room Texture Visualizer */}
              {roomType === 'cathedral' && (
                 <motion.div animate={{ opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 5, repeat: Infinity }} className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent)]" />
              )}
              {roomType === 'wood' && (
                 <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 10px, #111 10px, #111 20px)' }} />
              )}
              
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)]" />
            
            {/* Center Mic System */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10">
              <div className="w-14 h-14 rounded-full border-2 border-neutral-700 bg-neutral-900 flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                <Mic className="w-6 h-6 text-neutral-400" />
              </div>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter shadow-sm bg-neutral-950/80 px-2 rounded">Master Condenser</span>
            </div>

            {/* Bleed Zones */}
            {vocalists.map(v => (
              <motion.div 
                key={`bleed-${v.id}`}
                className="absolute rounded-full border border-neutral-800/30 bg-neutral-800/10 pointer-events-none transition-all duration-300"
                style={{ 
                  left: `calc(50% + ${v.x}px)`, 
                  top: `calc(50% + ${v.y}px)`,
                  width: `${micBleed * 3}px`, 
                  height: `${micBleed * 3}px`,
                  transform: 'translate(-50%, -50%)',
                  opacity: Math.max(0.1, (100 - Math.sqrt(v.x*v.x + v.y*v.y)) / 100)
                }}
              />
            ))}

            {/* Vocalists (Cast Members) */}
            {vocalists.map(v => (
              <motion.div 
                key={v.id}
                drag
                dragMomentum={false}
                onDrag={(e, info) => {
                  setVocalists(prev => prev.map(p => p.id === v.id ? { ...p, x: p.x + info.delta.x, y: p.y + info.delta.y } : p));
                }}
                className={`absolute w-20 h-20 rounded-full bg-${v.color}-500/10 border-2 border-${v.color}-500/50 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing shadow-[0_0_20px_rgba(0,0,0,0.4)] z-20 backdrop-blur-sm group/vocalist`}
                style={{ 
                  left: `calc(50% + ${v.x}px)`, 
                  top: `calc(50% + ${v.y}px)`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className={`w-8 h-8 rounded-full bg-${v.color}-500 flex items-center justify-center mb-1 shadow-inner`}>
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-[9px] font-black text-white uppercase leading-none">{v.name}</span>
                <span className={`text-[7px] font-bold text-${v.color}-300 mt-0.5 opacity-80 uppercase leading-none`}>{v.role}</span>
                
                {/* Distance Indicator */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/vocalist:opacity-100 transition-opacity bg-black/80 px-2 rounded pointer-events-none">
                  <span className="text-[8px] font-mono text-amber-500 whitespace-nowrap">
                    Dist: {Math.sqrt(v.x*v.x + v.y*v.y).toFixed(1)}cm • Prox: {Math.max(0, 100 - (Math.sqrt(v.x*v.x + v.y*v.y) / 2.5)).toFixed(0)}%
                  </span>
                </div>
              </motion.div>
            ))}
            
            {/* Global Bleed Visualization */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-500/10 bg-amber-500/5 pointer-events-none transition-all"
              style={{ width: `${micBleed * 6}px`, height: `${micBleed * 6}px` }}
            />
          </div>

          {/* Controls */}
          <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 shadow-xl">
              <h3 className="text-sm font-bold text-neutral-300 mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-500" />
                Session Architecture
              </h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-[11px] mb-2 uppercase tracking-wide font-bold">
                    <span className="text-neutral-500">Mic Bleed (Crosstalk)</span>
                    <span className="text-amber-400">{micBleed}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={micBleed}
                    onChange={(e) => setMicBleed(parseInt(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-full appearance-none"
                  />
                  <p className="text-[10px] text-neutral-500 mt-2 italic">Low settings create "Isolated Studio" feel, high settings simulate live acoustic ensemble.</p>
                </div>
                
                <div className="pt-4 border-t border-neutral-800/50">
                  <div className="flex justify-between text-[11px] mb-3 uppercase tracking-wide font-bold">
                    <span className="text-neutral-500">Cast Management</span>
                  </div>
                  <div className="space-y-2">
                    {vocalists.map(v => (
                       <div key={v.id} className="flex items-center justify-between bg-neutral-900/50 p-2 rounded-lg border border-neutral-800">
                         <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full bg-${v.color}-500 shadow-[0_0_8px] shadow-${v.color}-500/50`} />
                           <span className="text-xs text-neutral-300 font-medium">{v.role}: {v.name}</span>
                         </div>
                         <button className="text-[10px] text-neutral-600 hover:text-neutral-400 font-bold uppercase">Solo</button>
                       </div>
                    ))}
                    <button className="w-full py-2 border border-dashed border-neutral-700 rounded-lg text-xs text-neutral-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 mt-2">
                      <UserPlus className="w-3 h-3" /> Add AI Vocalist
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex-1">
              <h3 className="text-xs font-bold text-neutral-300 mb-3 uppercase tracking-widest border-b border-neutral-800 pb-2">Aether-Voice Context</h3>
              <div className="font-mono text-[9px] text-neutral-600 space-y-1.5">
                <p>[RT-AUDIO] Raytraced reflections active...</p>
                <p>[PROXIMITY] Calculating bass-boost for Lead...</p>
                <p>[BLEED] Injecting {micBleed}% of Double into Harm1...</p>
                <p className="text-amber-500/60">[AI] Adjusting performance for "Studio Anxiety" heuristics...</p>
                <div className="mt-4 p-2 bg-neutral-900 rounded border border-neutral-800 italic">
                  "The proximity effect is currently modeling a 47-tube condenser microphone profile."
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PersonaBuilder() {
  const [activePersonaTab, setActivePersonaTab] = useState<'profile' | 'licensing'>('profile');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col gap-6 overflow-y-auto pb-12"
    >
      <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-6 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-200">
              <UserPlus className="w-5 h-5" />
              Persona Forge
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setActivePersonaTab('profile')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${activePersonaTab === 'profile' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Vocal DNA Profile
              </button>
              <button 
                onClick={() => setActivePersonaTab('licensing')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${activePersonaTab === 'licensing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Licensing & Ledger
              </button>
            </div>
          </div>
          <button className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-amber-600/20">
            <Save className="w-4 h-4" />
            Mint to SVCL Ledger
          </button>
        </div>

        {activePersonaTab === 'profile' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Identity & Aesthetic */}
            <div className="space-y-6">
              <div className="aspect-square rounded-2xl border-2 border-dashed border-neutral-700 bg-neutral-950 flex flex-col items-center justify-center text-neutral-500 hover:border-amber-500/50 hover:text-amber-400 transition-colors cursor-pointer group overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-rose-500/5 group-hover:opacity-100 transition-opacity" />
                <UserPlus className="w-8 h-8 mb-2 relative z-10" />
                <span className="text-sm font-medium relative z-10">Upload Aesthetic Reference</span>
                <p className="text-[10px] text-neutral-600 mt-2 text-center px-4 relative z-10">AI will derive visual style matching the vocal timbre</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase tracking-wider">Persona Name</label>
                  <input type="text" placeholder="e.g., ShadyBoy, Elara" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 text-neutral-200" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase tracking-wider">'Soulfire' Emotional Dialect</label>
                  <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 text-neutral-200">
                    <option>Chicano Soulfire (Playful Pain)</option>
                    <option>East Side Melancholy</option>
                    <option>Sunset Blvd Aggression</option>
                    <option>Midnight Neon Whisper</option>
                  </select>
                  <p className="text-[10px] text-neutral-500 mt-1 italic">Defines how AI maps prosody to emotive markers.</p>
                </div>
              </div>
            </div>

            {/* Biometric Profile */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1 uppercase tracking-wider">Backstory (Aether-Voice Context)</label>
                <textarea 
                  rows={4}
                  placeholder="Describe their history, what they hide, how they express pain... This informs the micro-hesitations and vocal cracks."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500/50 text-neutral-200 resize-none font-mono text-xs"
                />
              </div>

              <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-6 shadow-inner">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                  <h3 className="text-sm font-bold text-neutral-300">Biometric Vocal Signature (DNA)</h3>
                  <span className="text-[10px] text-amber-500 font-mono">ENCRYPTED</span>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-widest text-neutral-500">
                        <span>Vocal Grit (Harmonic)</span>
                      </div>
                      <input type="range" className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-full appearance-none" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-widest text-neutral-500">
                        <span>Breath Ratio (Air)</span>
                      </div>
                      <input type="range" className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-full appearance-none" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-widest text-neutral-500">
                        <span>Pitch Fragility</span>
                      </div>
                      <input type="range" className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-full appearance-none" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-2 font-bold uppercase tracking-widest text-neutral-500">
                        <span>Formant Resonance</span>
                      </div>
                      <input type="range" className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-full appearance-none" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-sm text-blue-200/80">
                  <strong className="text-blue-300 block mb-1">Vocal Identity & Consent Steward (VICS)</strong>
                  This persona is registered under the Sovereign Vocal Copyright Ledger (SVCL). Any unauthorized use of the derived PAIPDS signature will trigger automatic DMCA re-rendering cycles.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Standard Usage', price: '0.05 SOL/stream', rights: 'Commercial, Non-Exclusive', icon: Download },
                { title: 'Full Ownership', price: '2,500 SOL', rights: 'Exclusive, Perpetual', icon: ShieldAlert },
                { title: 'Creative Commons', price: 'Free', rights: 'Non-Commercial, Attribution', icon: Share2 }
              ].map((tier, i) => (
                <div key={i} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 hover:border-amber-500/50 transition-all group">
                  <tier.icon className="w-10 h-10 text-amber-500/30 group-hover:text-amber-500 mb-4 transition-colors" />
                  <h4 className="text-lg font-bold text-white mb-1">{tier.title}</h4>
                  <p className="text-amber-500 font-mono text-sm mb-4">{tier.price}</p>
                  <ul className="text-xs text-neutral-500 space-y-2 mb-6">
                    <li className="flex items-center gap-2">✓ Verified DNA Tagging</li>
                    <li className="flex items-center gap-2">✓ {tier.rights}</li>
                    <li className="flex items-center gap-2">✓ Micro-royalty Enabled</li>
                  </ul>
                  <button className="w-full py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-bold text-neutral-300 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600 transition-all">
                    Configure Tier
                  </button>
                </div>
              ))}
            </div>
            
            <div className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800">
               <h3 className="text-sm font-bold text-neutral-300 mb-4 uppercase tracking-widest">SVCL Ledger History</h3>
               <div className="space-y-2 font-mono text-[10px] text-neutral-600">
                 <p>[2026-04-24 08:30:12] PERSONA_MINT initiated...</p>
                 <p>[2026-04-24 08:30:15] DNA_HASH: 0x8f2a...c3e4 generated using Vertex AI Biometrics...</p>
                 <p>[2026-04-24 08:30:18] LICENSING_POLICY: COMMERCIAL_RECURRING active.</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DAWBridge({ project }: { project: any }) {
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(128);
  const [sampleRate, setSampleRate] = useState(48000);
  const [outputFormat, setOutputFormat] = useState('PCM_24');
  const [dawPreset, setDawPreset] = useState('Ableton');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col gap-6"
    >
      <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-6 backdrop-blur-sm flex-1">
        <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-200 uppercase tracking-tighter italic">
              <Cable className="w-5 h-5 text-amber-500" />
              Sonance Pro VST/AU Plugin
            </h2>
            <div className="h-4 w-[1px] bg-neutral-800" />
            <select 
              value={dawPreset}
              onChange={(e) => setDawPreset(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest outline-none"
            >
              <option value="Ableton">Ableton Live</option>
              <option value="Logic">Logic Pro</option>
              <option value="FLStudio">FL Studio</option>
              <option value="ProTools">Pro Tools</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end mr-4">
               <span className="text-[9px] font-mono text-neutral-600 uppercase">Input Latency</span>
               <span className="text-[10px] font-mono text-emerald-500">{latency}ms</span>
             </div>
             <button 
              onClick={() => setIsConnected(!isConnected)}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg ${
                isConnected 
                  ? 'bg-amber-500 text-black border border-amber-500/50 shadow-amber-500/10' 
                  : 'bg-neutral-800 text-neutral-300 border border-neutral-700 hover:bg-neutral-700'
              }`}
            >
              <Activity className={`w-4 h-4 ${isConnected ? 'animate-pulse' : ''}`} />
              {isConnected ? `LINKED: ${dawPreset}` : 'ENABLE VST LINK'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6 border-b border-neutral-900 pb-4">
                <h3 className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  REAL-TIME STEM ROUTING MATRIX
                </h3>
                <span className="text-[10px] font-mono text-neutral-600">Buffer: 512 Samples</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-sm font-medium text-neutral-200">Track A (Lead)</span>
                  </div>
                  <select disabled={!isConnected} className="bg-neutral-950 border border-neutral-700 rounded-md px-2 py-1 text-xs text-neutral-300 disabled:opacity-50">
                    <option>Output 3/4</option>
                    <option>Output 1/2</option>
                  </select>
                </div>

                {project.duo && (
                  <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium text-neutral-200">Track B (Secondary)</span>
                    </div>
                    <select disabled={!isConnected} className="bg-neutral-950 border border-neutral-700 rounded-md px-2 py-1 text-xs text-neutral-300 disabled:opacity-50">
                      <option>Output 5/6</option>
                      <option>Output 1/2</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-neutral-900 rounded-lg border border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium text-neutral-200">Instrumental Bus</span>
                  </div>
                  <select disabled={!isConnected} className="bg-neutral-950 border border-neutral-700 rounded-md px-2 py-1 text-xs text-neutral-300 disabled:opacity-50">
                    <option>Output 7/8</option>
                    <option>Output 1/2</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Export Stems (WAV)
              </button>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 flex flex-col">
            <h3 className="text-sm font-bold text-neutral-300 mb-4 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-amber-400" />
              Real-Time Processing Status
            </h3>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-neutral-800 rounded-xl">
              {isConnected ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-emerald-400 animate-pulse" />
                  </div>
                  <h4 className="text-emerald-400 font-bold mb-2">Streaming to DAW</h4>
                  <p className="text-xs text-neutral-500 max-w-xs">
                    Sonance Pro is currently bypassing internal processing. Apply your own EQ, compression, and reverb directly in your DAW mixer.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center mb-4">
                    <Cable className="w-8 h-8 text-neutral-600" />
                  </div>
                  <h4 className="text-neutral-400 font-bold mb-2">Bridge Disconnected</h4>
                  <p className="text-xs text-neutral-600 max-w-xs">
                    Enable the VST link to route individual stems into your DAW for external mixing and processing.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
function OvertoneEngine({ project }: { project: any }) {
  const agents = [
    { id: 'groove', name: 'Kinesthetic Groove Architect', desc: 'Rhythmic physics & percussion topology.', status: 'SYNCED', color: 'rose' },
    { id: 'melody', name: 'Prosody-to-Melody Sculptor', desc: 'Mapping lyrical phonics to pitch contours.', status: 'ACTIVE', color: 'amber' },
    { id: 'timbre', name: 'Psychoacoustic Timbre Director', desc: 'Material sound design & textural resonance.', status: 'IDLE', color: 'emerald' },
    { id: 'narrative', name: 'Narrative Arrangement Director', desc: 'Structural sequence & emotional pacing.', status: 'ACTIVE', color: 'blue' },
    { id: 'collision', name: 'Harmonic Provenance Detector', desc: 'Copyright shield & melodic uniqueness.', status: 'SECURED', color: 'indigo' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col gap-6"
    >
      <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-6 backdrop-blur-sm flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-200 uppercase tracking-tighter italic">
            <Music className="w-5 h-5 text-amber-500" />
            Overtone Composition Suite
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-neutral-500">Pillar #3: Aural Physics</span>
            <div className="h-4 w-[1px] bg-neutral-800" />
            <button className="px-4 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-bold text-rose-500 animate-pulse">
              LIVE SIGNAL
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agent Terminal */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-neutral-500 uppercase tracking-widest mb-4">Neural Agents Active</h3>
            {agents.map(agent => (
              <div key={agent.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex items-center justify-between group hover:border-amber-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-${agent.color}-500/10 flex items-center justify-center border border-${agent.color}-500/20`}>
                    <Activity className={`w-5 h-5 text-${agent.color}-500`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-200">{agent.name}</h4>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-tight">{agent.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-mono font-black ${agent.status === 'IDLE' ? 'text-neutral-600' : 'text-emerald-500 animate-pulse'}`}>{agent.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Real-time Scene Visualizer */}
          <div className="space-y-6">
            <div className="bg-black border border-neutral-800 rounded-2xl p-6 aspect-video relative flex flex-col items-center justify-center overflow-hidden">
               {/* Waveform visualization placeholder */}
               <div className="absolute inset-x-0 bottom-0 top-1/2 opacity-20 pointer-events-none">
                 <div className="flex h-full items-end gap-1 px-4">
                   {[...Array(40)].map((_, i) => (
                     <motion.div 
                       key={i}
                       animate={{ height: [`${20 + Math.random() * 40}%`, `${40 + Math.random() * 60}%`, `${20 + Math.random() * 40}%`] }}
                       transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05 }}
                       className="flex-1 bg-amber-500/50 rounded-t"
                     />
                   ))}
                 </div>
               </div>
               
               <div className="relative z-10 text-center space-y-4">
                 <div className="w-16 h-16 rounded-full border-4 border-dashed border-amber-500/30 flex items-center justify-center animate-spin-slow">
                   <Disc3 className="w-8 h-8 text-amber-500" />
                 </div>
                 <div>
                   <h4 className="text-white font-black uppercase text-sm tracking-widest">Physics Calculation Active</h4>
                   <p className="text-[10px] text-neutral-500 italic max-w-xs mx-auto">Timbre Director is currently mapping "Chicano Heartbreak" to an analog synthesizer patch with 48dB ladder filters.</p>
                 </div>
               </div>

               <div className="absolute top-4 right-4 flex gap-2">
                 <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                 <span className="text-[9px] font-mono text-rose-500">G-SYNC: ON</span>
               </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center text-[11px] font-black uppercase text-neutral-500 border-b border-neutral-900 pb-2">
                <span>Integrated Pillars</span>
                <span className="text-amber-500/50">Cross-Sync Mode</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 flex flex-col gap-1">
                  <span className="text-[9px] text-neutral-500 font-bold uppercase">Ghostwriter</span>
                  <span className="text-[10px] text-neutral-300 italic">"Injecting metadata into rhythm loops..."</span>
                </div>
                <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 flex flex-col gap-1">
                  <span className="text-[9px] text-neutral-500 font-bold uppercase">Aether-Voice</span>
                  <span className="text-[10px] text-neutral-300 italic">"Syncing timbre with vocal air ratio..."</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function S2Synthesizer() {
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [blueprint, setBlueprint] = useState<any>(null);
  const [chaos, setChaos] = useState(40);
  const [popWeight, setPopWeight] = useState(60);

  const deconstructAndReassemble = () => {
    setIsSynthesizing(true);
    setBlueprint(null);
    
    // Simulate S2 Logic with sliders influence
    setTimeout(() => {
      const isWeird = popWeight < 40;
      setBlueprint({
        title: isWeird ? "Antimatter Lowrider" : "Neon-Dust Corrido",
        disruption: isWeird ? "Total Acoustic Dissolution via Neural Phonk" : "Chicano Soulfire deconstructed via Cyberpunk Brujería",
        layers: [
          { type: "Rhythmic Primitive", desc: isWeird ? "Polymetric clock-glitch with distorted 808 sub-harmonics." : "12/8 Huapango pulse modulated by glitch-hop swing." },
          { type: "Vocal Primitive", desc: isWeird ? "Granular synthesis of talkbox gravel and air." : "Talkbox filtered through a bit-crushed liturgical chant." },
          { type: "Lyrical Primitive", desc: "Barrio slang recontextualized as data-corruption metaphors." }
        ],
        crossGenre: isWeird ? "Death-Phonk x Neo-Mariachi" : "Traditional Norteño x Neural Phonk",
        viability: isWeird ? 35 : 92,
        serendipity: chaos
      });
      setIsSynthesizing(false);
    }, 2000);
  };

  const handleSurpriseMe = () => {
    // Generate a random daily conceptual blueprint immediately
    setBlueprint({
      title: "Daily Spark: " + (Math.random() > 0.5 ? "Chrome Mariachi" : "Vapor-Cumbia"),
      disruption: "Daily heuristic injection for rapid prototyping",
      layers: [
        { type: "Surprise Element", desc: "Unexpected flute layering with trap-inspired hi-hat rolls." },
        { type: "Daily Directive", desc: "Focus on themes of 'digital longing' and 'analog heritage'." }
      ],
      crossGenre: "Hybrid Blueprint",
      viability: 88,
      serendipity: 75
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex flex-col gap-6"
    >
      <div className="bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-8 backdrop-blur-sm flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0" />
        
        <div className="w-20 h-20 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
          <Zap className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2 italic tracking-tighter uppercase">Serendipity Synthesizer (S2)</h2>
        <p className="text-neutral-400 mb-8 max-w-lg">
          Bridging the Innovation Gap by synthesizing cultural primitives through high-chaos disruption.
        </p>

        {/* Serendipity Sliders */}
        <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Chaos / Serendipity
              </label>
              <span className="font-mono text-xs text-neutral-500">{chaos}</span>
            </div>
            <input 
              type="range" min="0" max="100" value={chaos} 
              onChange={(e) => setChaos(parseInt(e.target.value))}
              className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-600 font-bold uppercase">
              <span>Ground Truth</span>
              <span>Total Serendipity</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-3 h-3" /> Weirdness vs. Pop
              </label>
              <span className="font-mono text-xs text-neutral-500">{popWeight}</span>
            </div>
            <input 
              type="range" min="0" max="100" value={popWeight} 
              onChange={(e) => setPopWeight(parseInt(e.target.value))}
              className="w-full accent-amber-500 h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-600 font-bold uppercase">
              <span>Pure Weird</span>
              <span>Pop Machine</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          {!blueprint && !isSynthesizing && (
            <>
              <button 
                onClick={deconstructAndReassemble}
                className="group relative px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-amber-600/20 active:scale-95"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Synthesize Blueprint
                </span>
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-rose-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition-opacity -z-10" />
              </button>
              <button 
                onClick={handleSurpriseMe}
                className="px-6 py-4 bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-amber-400 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95"
              >
                <Sparkles className="w-5 h-5" />
                Surprise Me
              </button>
            </>
          )}
        </div>

        {isSynthesizing && (
          <div className="space-y-6 w-full max-w-md">
            <div className="flex justify-between text-xs font-mono text-amber-500 mb-2 uppercase tracking-widest">
              <span>Deconstructing Primitives</span>
              <span>74% Complete</span>
            </div>
            <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2 }}
                className="h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-1 bg-neutral-700 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="h-full w-1/2 bg-amber-400/50 shadow-glow"
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] font-mono text-neutral-600 animate-pulse uppercase">
              Heuristic disruption active: Injecting "Brujería" subtext into "Analog" structures...
            </p>
          </div>
        )}

        {blueprint && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full text-left bg-neutral-950 border-2 border-amber-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase rounded border border-amber-500/20">
                Innovation Index: {blueprint.viability}%
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">{blueprint.title}</h3>
              <p className="text-amber-500 text-sm font-bold">{blueprint.disruption}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-1">Atomic Layers</h4>
                {blueprint.layers.map((layer: any, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-1 h-10 bg-amber-500/20 rounded-full shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">{layer.type}</div>
                      <div className="text-xs text-neutral-200 leading-tight">{layer.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800 pb-1">Strategic Advantage</h4>
                <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
                  <p className="text-xs text-neutral-400 mb-2 font-medium">This conceptual blueprint leverages the "Scars in the Dark" emotional baseline to bridge Chicano identity with global cyberpunk aesthetics.</p>
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
                    <Flame className="w-3 h-3" /> Market Disruption Probable
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-bold uppercase transition-all shadow-lg active:scale-95">
                Feed to Ghostwriter
              </button>
              <button className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-lg shadow-amber-600/20 active:scale-95">
                Execute Final Rendering
              </button>
              <button 
                onClick={() => setBlueprint(null)}
                className="w-12 h-12 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl flex items-center justify-center transition-all active:scale-95"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function SLUniversal() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTrackId, setActiveTrackId] = useState<keyof typeof PROJECTS>('scars');
  const [showFlipOptions, setShowFlipOptions] = useState(false);
  const [isGeneratingRemix, setIsGeneratingRemix] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [remixError, setRemixError] = useState<string | null>(null);
  const [flipVisualStage, setFlipVisualStage] = useState<'original' | 'calculating' | 'remixed'>('original');
  const track = PROJECTS[activeTrackId];

  const handleFlip = async (genre: string) => {
    setShowFlipOptions(false);
    setRemixError(null);
    setFlipVisualStage('calculating');
    
    try {
      if (!await window.aistudio.hasSelectedApiKey()) {
        await window.aistudio.openSelectKey();
      }
      
      setIsGeneratingRemix(true);
      setGeneratedAudioUrl(null);
      setIsPlaying(false);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      
      const prompt = `Generate a 30-second ${genre} remix of a song with the following vibe: ${track.vibe}. The original prompt was: ${track.prompt}. Ensure the DNA tagging for attribution is embedded.`;
      
      const response = await ai.models.generateContentStream({
        model: "lyria-3-clip-preview",
        contents: prompt,
      });

      let audioBase64 = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
        }
      }

      if (audioBase64) {
        const binary = atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);
        setGeneratedAudioUrl(audioUrl);
        setFlipVisualStage('remixed');
      } else {
        setRemixError("Failed to generate audio.");
        setFlipVisualStage('original');
      }
      
    } catch (error: any) {
      console.error(error);
      setFlipVisualStage('original');
      if (error.message?.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
      } else {
        setRemixError(error.message || "An error occurred during generation.");
      }
    } finally {
      setIsGeneratingRemix(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col"
    >
      {/* Visual Soul Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(225,29,72,0.15),rgba(0,0,0,1))]" />
        <motion.div 
          animate={{ 
            scale: isPlaying || isGeneratingRemix ? [1, 1.1, 1] : 1,
            opacity: isPlaying || isGeneratingRemix ? [0.3, 0.5, 0.3] : 0.3,
            rotate: isGeneratingRemix ? [0, 360] : 0
          }}
          transition={{ duration: isGeneratingRemix ? 2 : 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-600/20 blur-[120px] rounded-full"
        />
        
        {/* DNA Tagging Visualization */}
        <div className="absolute top-12 right-12 flex flex-col gap-2 scale-75 opacity-40">
           {[...Array(6)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ x: [0, 20, 0], opacity: [0.2, 0.8, 0.2] }}
               transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
               className="h-1 bg-amber-500 rounded-full"
               style={{ width: `${80 + Math.random() * 40}px` }}
             />
           ))}
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col h-full">
        {/* Vibe Bar */}
        <div className="text-center space-y-6 mb-8 mt-4">
          <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">One-Tap Soul</h1>
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-600/20 to-amber-600/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Sparkles className="h-5 w-5 text-rose-400" />
            </div>
            <input
              type="text"
              className="relative block w-full pl-12 pr-4 py-5 border border-rose-500/30 rounded-2xl leading-5 bg-neutral-900/60 backdrop-blur-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 text-lg shadow-2xl transition-all"
              placeholder="I need a song for a late-night drive in the rain..."
              value={track.prompt}
              readOnly
            />
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            {['Chicano Soulfire', 'Norteño Roots', 'Slow Tempo', 'Guarded Hearts'].map(chip => (
              <button key={chip} className="px-4 py-2 rounded-full bg-neutral-900/80 border border-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:bg-rose-900/30 hover:text-rose-200 hover:border-rose-500/30 transition-all backdrop-blur-sm">
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Aura Stream Player with Transformation Visualizer */}
        <div className="bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800/80 rounded-3xl p-8 shadow-2xl mb-6 relative overflow-hidden">
          {/* Transformation Visualizer Overlay */}
          <AnimatePresence>
            {flipVisualStage === 'calculating' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-rose-950/40 backdrop-blur-md flex flex-col items-center justify-center space-y-6"
              >
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center">
                    <Music className="w-8 h-8 text-neutral-500" />
                  </div>
                  <motion.div 
                     animate={{ x: [0, 40, 0], scale: [1, 1.5, 1] }}
                     transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Cable className="w-10 h-10 text-rose-500" />
                  </motion.div>
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                    <Zap className="w-8 h-8 text-amber-400" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-rose-400 font-black uppercase text-sm tracking-widest animate-pulse">DNA Tagging attribution...</p>
                  <p className="text-xs text-neutral-400 font-mono italic">Recalculating emotional dialect frequencies...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-8 relative z-10">
            <div className={`w-32 h-32 rounded-2xl border flex items-center justify-center shadow-inner relative overflow-hidden group shrink-0 transition-all duration-700 ${flipVisualStage === 'remixed' ? 'bg-amber-500/10 border-amber-500/50 scale-105' : 'bg-gradient-to-br from-neutral-800 to-neutral-900 border-neutral-700/50 scale-100'}`}>
              <Music className={`w-10 h-10 transition-transform ${flipVisualStage === 'remixed' ? 'text-amber-500' : 'text-neutral-600'} group-hover:scale-110`} />
              {flipVisualStage === 'remixed' && (
                <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-1">
                    {flipVisualStage === 'remixed' ? `REMIX: ${track.title}` : track.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    <p className="text-rose-300 font-bold text-sm tracking-wide">
                      {track.duo ? 'ShadyBoy & Hurting Girl' : 'AI Ensemble'}
                    </p>
                    <span className="w-1 h-1 rounded-full bg-neutral-700" />
                    <p className="text-neutral-500 font-medium text-sm">
                      {track.vibe}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 bg-neutral-950/50 px-3 py-1.5 rounded-lg border border-neutral-800 uppercase tracking-widest">
                  <Activity className="w-3 h-3 text-rose-500" />
                  {activeTrackId === 'smile' ? '12.4K' : '45.2K'} Listeners
                </div>
              </div>

              <div className="mt-8 flex items-center gap-6">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-xl shadow-white/10 shrink-0"
                >
                  {isPlaying ? <X className="w-8 h-8 fill-black" /> : <Play className="w-8 h-8 ml-1 fill-black" />}
                </button>
                
              <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500 uppercase">
                    <span>Aura Stream Stage</span>
                    <div className="flex items-center gap-2">
                       <span className={flipVisualStage === 'remixed' ? 'text-amber-500 font-bold' : ''}>
                         {flipVisualStage === 'remixed' ? '0.08 SOL ROYALTY ACTIVE' : 'FREE PREVIEW'}
                       </span>
                       {flipVisualStage === 'remixed' && (
                         <div className="flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 text-amber-500">
                           <ShieldAlert className="w-2.5 h-2.5" />
                           <span className="text-[8px]">DNA VERIFIED</span>
                         </div>
                       )}
                    </div>
                  </div>
                  <div className="h-2 w-full bg-neutral-950 border border-neutral-800 rounded-full overflow-hidden relative">
                    <motion.div 
                      className={`absolute top-0 left-0 h-full ${flipVisualStage === 'remixed' ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_10px_#f59e0b]' : 'bg-gradient-to-r from-rose-500 to-rose-800'}`}
                      initial={{ width: "0%" }}
                      animate={{ width: isPlaying ? "100%" : "35%" }}
                      transition={{ duration: 180, ease: "linear" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

    {/* Social Stem / Flip It */}
          <div className="mt-8 pt-6 border-t border-neutral-800/50 flex flex-col gap-6 relative">
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <div className="relative">
                  <button 
                    onClick={() => setShowFlipOptions(!showFlipOptions)}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-rose-600/20 active:scale-95"
                  >
                    <Layers className="w-5 h-5" />
                    Flip It
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </button>
                  
                  <AnimatePresence>
                    {showFlipOptions && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 mb-2 w-72 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden z-50 p-2 space-y-1"
                      >
                        <div className="p-3 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between rounded-t-xl">
                          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">DNA-Enabled Flips</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-mono text-emerald-500 uppercase">Verified</span>
                          </div>
                        </div>
                        {[
                          { name: 'Norteño Roots', price: '0.05 SOL', desc: 'Accordion & Bajo Sexto re-rendering.' },
                          { name: 'Lowrider Soul', price: '0.03 SOL', desc: 'Analog Brass & Heavy Compression.' },
                          { name: 'Classic R&B', price: '0.04 SOL', desc: 'Warm Rhodes & Motown Grooves.' },
                          { name: 'Phonk Fusion', price: '0.08 SOL', desc: 'Distorted 808s & Cowbells.' },
                          { name: 'Shoegaze', price: '0.06 SOL', desc: 'Wall of sound & dreamy vocals.' }
                        ].map((g) => (
                          <button 
                            key={g.name}
                            onClick={() => handleFlip(g.name)}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-800 transition-colors text-neutral-200 rounded-lg group flex justify-between items-center"
                          >
                            <div>
                               <div className="font-bold text-neutral-100">{g.name}</div>
                               <div className="text-[10px] text-neutral-500 italic mt-0.5">{g.desc}</div>
                            </div>
                            <span className="text-[9px] font-mono bg-amber-500/10 text-amber-500 px-2 py-1 rounded border border-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity">{g.price}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl font-medium transition-colors h-12 shadow-lg">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-neutral-600 block uppercase mb-1">Contract: 0x8f2a...c3e4</span>
                <span className="text-[9px] text-rose-500 font-bold bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 uppercase tracking-widest">SVCL Registered</span>
              </div>
            </div>

            {/* DNA Ledger & Attribution (SL Universal) */}
            {flipVisualStage === 'remixed' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                    <Activity className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest">DNA Attributed Remix Active</h4>
                    <p className="text-xs text-neutral-400 mt-1">Originator: <span className="text-neutral-200 font-bold italic">LYRICA Artist #441</span> • 0.02 SOL micro-royalty per stream</p>
                  </div>
                </div>
                <div className="text-right px-4 border-l border-neutral-800 h-full py-1">
                  <p className="text-[9px] font-mono text-neutral-600 uppercase mb-2 text-center">Attribution Hash</p>
                  <div className="flex gap-1 justify-center">
                    {[...Array(12)].map((_, i) => (
                      <motion.div 
                        key={i} 
                        animate={{ height: [4, 12, 4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                        className="w-[2px] bg-amber-500/40 rounded-full" 
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

      {/* Remix Generation State */}
          <AnimatePresence>
            {(isGeneratingRemix || generatedAudioUrl || remixError) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-neutral-800/50"
              >
                {isGeneratingRemix && (
                  <div className="flex items-center justify-center gap-3 text-rose-400 py-4">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-medium">Generating Flip with Lyria 3 Pro...</span>
                  </div>
                )}
                
                {remixError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 shrink-0" />
                    <p>{remixError}</p>
                  </div>
                )}

                {generatedAudioUrl && !isGeneratingRemix && (
                  <div className="bg-neutral-900/80 border border-rose-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(225,29,72,0.1)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="text-rose-300 font-bold flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Flip Successful
                        </h4>
                        <div className="h-4 w-px bg-neutral-800" />
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                          DNA Tag: {Math.random().toString(36).substring(7).toUpperCase()}
                        </span>
                      </div>
                      <button 
                        onClick={() => setGeneratedAudioUrl(null)}
                        className="text-neutral-500 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <audio controls src={generatedAudioUrl} className="w-full h-10 mb-3" autoPlay />
                    <div className="flex justify-between items-center bg-neutral-950/50 p-2 rounded-lg border border-neutral-800">
                      <span className="text-[10px] text-neutral-500">Original Creator: <span className="text-rose-400 font-bold">Lyrica-User-1</span></span>
                      <span className="text-[10px] text-emerald-400 font-bold">Micro-Royalty Settled (0.02 SOL)</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Aura Stream Queue (Evolving the UI to show both) */}
        <div className="mt-auto bg-neutral-900/40 backdrop-blur-md border border-neutral-800/50 rounded-2xl p-4">
          <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 px-2">Aura Stream Queue</h4>
          <div className="space-y-2">
            {Object.values(PROJECTS).map((p) => (
              <button 
                key={p.id}
                onClick={() => {
                  setActiveTrackId(p.id as keyof typeof PROJECTS);
                  setIsPlaying(true);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  activeTrackId === p.id 
                    ? 'bg-neutral-800/80 border border-neutral-700/50' 
                    : 'hover:bg-neutral-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    activeTrackId === p.id ? 'bg-rose-500/20 text-rose-400' : 'bg-neutral-800 text-neutral-500'
                  }`}>
                    {activeTrackId === p.id && isPlaying ? <Activity className="w-4 h-4 animate-pulse" /> : <Music className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-bold ${activeTrackId === p.id ? 'text-white' : 'text-neutral-300'}`}>
                      {p.title}
                    </div>
                    <div className="text-xs text-neutral-500">{p.vibe}</div>
                  </div>
                </div>
                {activeTrackId === p.id && (
                  <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-1 rounded">PLAYING</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  return (
    <LoginGate>
      <StudioApp />
    </LoginGate>
  );
}
