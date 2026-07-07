import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Users, 
  TrendingUp, 
  Activity, 
  Flame, 
  Mic2, 
  Zap,
  CloudRain,
  Play,
  Pause,
  Music,
  Sparkles,
  Shield
} from 'lucide-react';
import { cn } from '../lib/utils';
import { translateVibeToParams, generateMusicStream } from '../lib/gemini';
import { interpretListenerInput } from '../../features/radio/ai/interpretListenerInput';
import type { ListenerInput } from '../../features/radio/ai/interpretListenerInput';
import { generateDjResponse } from '../../features/radio/ai/generateDjResponse';
import type { SessionState } from '../../features/radio/ai/generateDjResponse';
import { ListenerInputPanel } from '../../features/radio/ListenerInputPanel';
import { LiveSubmissionsFeed } from '../../features/radio/LiveSubmissionsFeed';
import type { SubmissionEntry } from '../../features/radio/LiveSubmissionsFeed';
import { submitListenerInput, saveAudienceInspiration, createOwnershipEventIfUsed } from '../../features/radio/api/radioApi';

interface Persona {
  id: string;
  name: string;
  vocalStyle: string;
  color: string;
  description: string;
}

const PERSONAS: Persona[] = [
  { 
    id: 'shadyboy', 
    name: 'ShadyBoy', 
    vocalStyle: 'Grit Soul', 
    color: 'from-pink-500 to-pink-600', 
    description: 'Authentic Chicano grit with deep emotional resonance. Ideal for street-soul narratives and raw, heartfelt storytelling.' 
  },
  { 
    id: 'auraveda', 
    name: 'AuraVeda', 
    vocalStyle: 'Ethereal Soprano', 
    color: 'from-blue-400 to-purple-600', 
    description: 'Celestial harmonies and atmospheric vocal textures. Perfect for cinematic soundscapes and transcendent emotional journeys.' 
  },
  { 
    id: 'neonpulse', 
    name: 'NeonPulse', 
    vocalStyle: 'Glitch Baritone', 
    color: 'from-green-400 to-cyan-600', 
    description: 'Cybernetic cadences and synthetic rhythmic flows. Designed for futuristic club anthems and high-energy electronic fusion.' 
  },
];

interface Summary {
  engagement: number;
  popularThemes: string[];
  topLyrics: string[];
  finalBPM: number;
  finalEnergy: number;
  listenersReached: number;
}

export function LiveSession({ onClose }: { onClose: () => void }) {
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const [crowdEmotion, setCrowdEmotion] = useState(0.75);
  const [activeThemes, setActiveThemes] = useState<string[]>(["Soul", "Electronic", "Dark"]);
  const [themeVotes, setThemeVotes] = useState<Record<string, number>>({
    "Cyberpunk": 1240,
    "Soul": 890,
    "Dark": 450
  });
  const [currentPersona, setCurrentPersona] = useState<Persona>(PERSONAS[0]);
  const [personaControls, setPersonaControls] = useState({
    vocalGrit: 0.6,
    emotionalDepth: 0.8,
    stagePresence: 0.7,
    reverb: 0.5
  });
  const [liveParams, setLiveParams] = useState({
    key: "B Minor",
    bpm: 125,
    energy: 0.7,
    sadness: 0.3,
    harmonies: false,
    genre: "Soul",
    vocalCrackle: 0.2
  });
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<Summary | null>(null);
  const submissionsEndRef = useRef<HTMLDivElement>(null);

  const [listeners, setListeners] = useState(2412891);
  const [peakListeners, setPeakListeners] = useState(2412891);

  // Real music generation states for Live Concert
  const [currentLiveTrack, setCurrentLiveTrack] = useState<{
    title: string;
    lyrics: string;
    audioUrl?: string;
    playing: boolean;
  } | null>(null);
  const [isGeneratingLiveTrack, setIsGeneratingLiveTrack] = useState(false);
  const [liveLyricsScrollIndex, setLiveLyricsScrollIndex] = useState(0);
  const liveAudioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-advance lyrics as the song plays
  useEffect(() => {
    if (!currentLiveTrack || !currentLiveTrack.playing) return;
    const interval = setInterval(() => {
      setLiveLyricsScrollIndex(prev => prev + 1);
    }, 6000);
    return () => clearInterval(interval);
  }, [currentLiveTrack, currentLiveTrack?.playing]);

  // Handle live generative performance
  const handlePerformLiveGenerativeTrack = async () => {
    setIsGeneratingLiveTrack(true);
    setLiveLyricsScrollIndex(0);
    try {
      // 1. Aggregate top theme in votes
      const topTheme = Object.entries(themeVotes).sort(([, a], [, b]) => b - a)[0]?.[0] || "Soul";
      
      // 2. Aggregate chat lyrics from user submissions
      const userLyrics = submissions
        .filter(s => s.input.inputType === 'lyrics')
        .slice(-3)
        .map(s => s.input.text)
        .join("\n");
      
      const combinedLyrics = userLyrics || "The velvet cage is now unlocked,\nSearching for a ghost in the machine,\nNeon reflections in the dark puddles,\nTwo hearts waiting for a spark.";

      // 3. Compose live generation prompt
      const concertPrompt = `A high energy live concert performance by host persona ${currentPersona.name} (${currentPersona.vocalStyle}) incorporating ${topTheme} elements with audience micro-lyrics: ${combinedLyrics}. Emotion rating: ${(crowdEmotion*100).toFixed(0)}%. Key: ${liveParams.key}, Tempo: ${liveParams.bpm} BPM.`;

      // 4. Translate and retrieve audio stream
      const params = await translateVibeToParams(concertPrompt);
      params.vocalStyle = currentPersona.vocalStyle;
      params.style = `${topTheme}, Live Performance`;
      params.tempo = liveParams.bpm;
      params.key = liveParams.key;
      params.lyrics = combinedLyrics;

      const stream = await generateMusicStream(params);

      // 5. Gather stream chunks
      const audioChunks: Uint8Array[] = [];
      let finalLyricsText = combinedLyrics;
      let isFallback = false;

      for await (const chunk of stream) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          const p = part as any;
          if (p.inlineData?.data) {
            if (p.inlineData.data === "FALLBACK_AUDIO_SIGNAL") {
              isFallback = true;
              break;
            }
            const binary = atob(p.inlineData.data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            audioChunks.push(bytes);
          }
          if (p.text && !userLyrics) {
            finalLyricsText = p.text;
          }
        }
        if (isFallback) break;
      }

      let audioUrl = "";
      if (isFallback) {
        audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
      } else if (audioChunks.length > 0) {
        const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const mergedArray = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of audioChunks) {
          mergedArray.set(chunk, offset);
          offset += chunk.length;
        }
        const blob = new Blob([mergedArray], { type: 'audio/wav' });
        audioUrl = URL.createObjectURL(blob);
      } else {
        audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3";
      }

      setCurrentLiveTrack({
        title: `Crowd Fusion: '${topTheme}' Live Jam`,
        lyrics: finalLyricsText,
        audioUrl,
        playing: true
      });

      // Boost crowd emotion!
      setCrowdEmotion(prev => Math.min(1.0, prev + 0.15));

      // Play audio element
      setTimeout(() => {
        if (liveAudioRef.current) {
          liveAudioRef.current.play().catch(e => console.error("Auto playback failed", e));
        }
      }, 100);

    } catch (err) {
      console.error("Concert performance failed", err);
      // Fallback
      setCurrentLiveTrack({
        title: "Crowd Fusion Solo Jam (Synthesized)",
        lyrics: "Lost in the neon frequency,\nOur voices join in ecstasy.",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        playing: true
      });
    } finally {
      setIsGeneratingLiveTrack(false);
    }
  };

  const toggleLiveTrack = () => {
    if (liveAudioRef.current && currentLiveTrack) {
      if (currentLiveTrack.playing) {
        liveAudioRef.current.pause();
      } else {
        liveAudioRef.current.play().catch(e => console.error(e));
      }
      setCurrentLiveTrack(prev => prev ? { ...prev, playing: !prev.playing } : null);
    }
  };

  // Derive session state from live params for AI DJ
  const sessionState: SessionState = {
    currentBpm: liveParams.bpm,
    currentEnergy: liveParams.energy,
    currentGenre: liveParams.genre,
    currentMood: liveParams.energy > 0.6 ? "high energy" : "chill",
    currentPersonaName: currentPersona.name,
    crowdEmotion,
    activeThemes,
  };

  // Handle listener input → AI interpretation → DJ response
  const handleListenerSubmit = useCallback(async (input: ListenerInput) => {
    setIsProcessingInput(true);
    try {
      // 1. Persist to API / localStorage
      await submitListenerInput(input);

      // 2. AI Interpret the input
      const interpretation = await interpretListenerInput(input);

      // 3. AI DJ generates response
      const djResponse = await generateDjResponse(sessionState, input, interpretation);

      // 4. Build the submission entry
      const entry: SubmissionEntry = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
        input,
        interpretation,
        djResponse,
        timestamp: new Date().toISOString(),
      };

      setSubmissions(prev => [...prev, entry]);

      // 5. Update session state based on interpretation
      if (interpretation.suggestedBpmShift) {
        setLiveParams(prev => ({
          ...prev,
          bpm: Math.max(60, Math.min(200, prev.bpm + interpretation.suggestedBpmShift)),
        }));
      }
      if (interpretation.suggestedEnergyShift) {
        setLiveParams(prev => ({
          ...prev,
          energy: Math.max(0, Math.min(1, prev.energy + interpretation.suggestedEnergyShift)),
        }));
      }
      if (djResponse.suggestedMusicChange?.genre) {
        setLiveParams(prev => ({ ...prev, genre: djResponse.suggestedMusicChange!.genre! }));
      }
      if (djResponse.suggestedMusicChange?.mood) {
        setCrowdEmotion(prev =>
          djResponse.suggestedMusicChange?.mood === "energetic" ? Math.min(1, prev + 0.1) :
          djResponse.suggestedMusicChange?.mood === "chill" ? Math.max(0.1, prev - 0.1) : prev
        );
      }
      if (djResponse.suggestedMusicChange?.energy !== undefined) {
        setLiveParams(prev => ({
          ...prev,
          energy: Math.max(0, Math.min(1, djResponse.suggestedMusicChange!.energy!)),
        }));
      }

      // 6. Boost crowd emotion on engagement
      setCrowdEmotion(prev => Math.min(1, prev + 0.03));

      // 7. Save as audience inspiration
      await saveAudienceInspiration({
        id: entry.id,
        sessionId: input.sessionId,
        userId: input.userId,
        inputType: input.inputType,
        originalText: input.text,
        interpretedEmotion: interpretation.detectedEmotion,
        interpretedVibe: interpretation.detectedVibe,
        djResponseType: djResponse.responseType,
        djMessage: djResponse.djMessage,
        ownershipEventCreated: djResponse.ownershipEventRequired,
        createdAt: entry.timestamp,
      });

      // 8. Create ownership event if original lyrics
      if (djResponse.ownershipEventRequired && interpretation.isOriginalLyrics) {
        await createOwnershipEventIfUsed({
          sessionId: input.sessionId,
          userId: input.userId,
          originalText: input.text,
          inputType: input.inputType,
        });
      }
    } catch (err) {
      console.error("AI DJ processing failed", err);
    } finally {
      setIsProcessingInput(false);
    }
  }, [sessionState, themeVotes]);

  // Update active themes based on top votes
  useEffect(() => {
    const sortedThemes = Object.entries(themeVotes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme);
    
    setActiveThemes(sortedThemes);
    
    if (sortedThemes.length > 0 && sortedThemes[0] !== liveParams.genre) {
      setLiveParams(prev => ({ ...prev, genre: sortedThemes[0] }));
    }
  }, [themeVotes, liveParams.genre]);

  useEffect(() => {
    submissionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [submissions]);

  const handleVote = (theme: string) => {
    setThemeVotes(prev => ({
      ...prev,
      [theme]: (prev[theme] || 0) + 10
    }));
    setCrowdEmotion(prev => Math.min(1, prev + 0.02));
  };

  const handleEndSession = () => {
    const summary: Summary = {
      engagement: Math.floor(crowdEmotion * 100),
      popularThemes: Object.entries(themeVotes).sort(([, a], [, b]) => b - a).slice(0, 3).map(([k]) => k),
      topLyrics: submissions.filter(s => s.input.inputType === 'lyrics').slice(-3).map(s => s.input.text),
      finalBPM: liveParams.bpm,
      finalEnergy: liveParams.energy,
      listenersReached: peakListeners
    };
    setSummaryData(summary);
    setShowSummary(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col"
    >
      {/* Header */}
      <header className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
          <div>
            <h2 className="text-xl font-bold tracking-tighter uppercase">Live Studio Session: {currentPersona.name}</h2>
            <div className="flex items-center gap-4 text-[10px] font-mono text-white/40">
              <span className={cn("flex items-center gap-1 transition-colors duration-500", currentPersona.color.split(' ')[0].replace('from-', 'text-'))}>{currentPersona.description}</span>
              <div className="flex items-center gap-2 px-2 py-1 bg-white/5 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className={cn("flex items-center gap-1 font-bold transition-colors duration-500", currentPersona.color.split(' ')[0].replace('from-', 'text-'))}>
                  <Users className="w-3 h-3" /> {listeners.toLocaleString()}
                </span>
              </div>
              <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> SONANCE PRO v4.2 LIVE</span>
            </div>
          </div>
        </div>
        
        {/* Persona Selector */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setCurrentPersona(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all",
                currentPersona.id === p.id 
                  ? "bg-white/10 text-white shadow-lg" 
                  : "text-white/40 hover:text-white/60"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button 
          onClick={handleEndSession}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Persona Management & Performance Visualizer */}
        <div className="w-80 border-r border-white/10 flex flex-col bg-black/40 overflow-y-auto custom-scrollbar p-6 space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-white/40">AI Persona Engine</h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: "Vocal Grit", key: "vocalGrit" },
                { label: "Emotional Depth", key: "emotionalDepth" },
                { label: "Stage Presence", key: "stagePresence" },
                { label: "Ambient Reverb", key: "reverb" }
              ].map((control) => (
                <div key={control.key} className="space-y-2">
                  <div className="flex justify-between text-[9px] font-bold tracking-widest uppercase text-white/60">
                    <span>{control.label}</span>
                    <span>{(personaControls[control.key as keyof typeof personaControls] * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={personaControls[control.key as keyof typeof personaControls]}
                    onChange={(e) => setPersonaControls(prev => ({ ...prev, [control.key]: parseFloat(e.target.value) }))}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-white/40">Vocal Expression</h3>
            <div className="flex flex-wrap gap-2">
              {['Aggressive', 'Vulnerable', 'Melancholic', 'Ethereal', 'Grit'].map(expr => (
                <button
                  key={expr}
                  onClick={() => setPersonaControls(prev => ({ ...prev, emotionalDepth: Math.min(1, prev.emotionalDepth + 0.1) }))}
                  className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-bold tracking-widest uppercase hover:bg-pink-500/20 hover:border-pink-500/30 transition-all"
                >
                  {expr}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-white/40">Visual Aesthetic</h3>
            <div className="flex flex-wrap gap-2">
              {['Neon', 'Analog', 'Mist', 'Void'].map(style => (
                <button
                  key={style}
                  className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-bold tracking-widest uppercase hover:bg-white/10 transition-all"
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Performance Visualizer */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto bg-black">
          {/* Dynamic Crowd Emotion Visualizer */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Shifting Gradient Background */}
            <motion.div 
              animate={{ 
                background: crowdEmotion > 0.7 
                  ? `radial-gradient(circle at 50% 50%, var(--persona-primary), transparent ${70 + (personaControls.stagePresence * 20)}%)`
                  : `radial-gradient(circle at 50% 50%, var(--persona-secondary), transparent ${60 + (personaControls.reverb * 30)}%)`,
                scale: [1, 1 + (personaControls.stagePresence * 0.2), 1],
                filter: `blur(${10 + (personaControls.reverb * 40)}px)`
              }}
              style={{ 
                '--persona-primary': currentPersona.id === 'shadyboy' ? 'rgba(249, 115, 22, 0.25)' : currentPersona.id === 'auraveda' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(34, 197, 94, 0.25)',
                '--persona-secondary': currentPersona.id === 'shadyboy' ? 'rgba(220, 38, 38, 0.15)' : currentPersona.id === 'auraveda' ? 'rgba(147, 51, 234, 0.15)' : 'rgba(6, 182, 212, 0.15)'
              } as any}
              transition={{ duration: 4 - (personaControls.stagePresence * 2), repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0"
            />
            
            {/* Animated Particles */}
            {[...Array(Math.floor(20 + personaControls.stagePresence * 30))].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: `${Math.random() * 100}%`, 
                  y: `${Math.random() * 100}%`, 
                  opacity: 0,
                  scale: Math.random() * 0.5 + 0.5
                }}
                animate={{ 
                  y: [`${Math.random() * 100}%`, `${Math.random() * 100 - 40}%`],
                  opacity: [0, (crowdEmotion * 0.5) + (personaControls.stagePresence * 0.3), 0],
                  scale: [1, 1.5 + (personaControls.vocalGrit * 0.5), 1],
                  x: [`${Math.random() * 100}%`, `${Math.random() * 100 + (Math.random() - 0.5) * 20}%`]
                }}
                transition={{ 
                  duration: (5 + Math.random() * 5) / (1 + personaControls.stagePresence), 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 5
                }}
                className={cn(
                  "absolute w-1 h-1 rounded-full blur-[1px]",
                  crowdEmotion > 0.6 ? "bg-pink-500" : "bg-blue-400"
                )}
              />
            ))}
          </div>

          <div className="absolute inset-0 overflow-hidden opacity-30">
            <motion.div 
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 90, 180, 270, 360],
                opacity: [0.1, 0.4, 0.1]
              }}
              transition={{ duration: 25 / (1 + personaControls.stagePresence), repeat: Infinity, ease: "linear" }}
              className={cn("absolute inset-0 bg-gradient-to-br blur-[150px] transition-colors duration-1000", currentPersona.color)}
            />
          </div>

          <div className="relative z-10 text-center space-y-8 w-full max-w-2xl px-4">
            {/* Trending Themes Overlay */}
            <div className="flex justify-center items-end gap-4 mb-4 flex-wrap">
              {activeThemes.map((theme, i) => (
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: i === 0 ? 1.1 : 1,
                  }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "px-4 py-2 rounded-full border flex items-center gap-2 backdrop-blur-xl transition-all duration-500",
                    i === 0 
                      ? `bg-gradient-to-r ${currentPersona.color} text-white border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]` 
                      : "bg-white/5 border-white/10 text-white/40"
                  )}
                >
                  <TrendingUp className={cn("w-3 h-3", i === 0 ? "text-black" : "text-white/40")} />
                  <span className={cn("text-[10px] font-black tracking-[0.1em] uppercase", i === 0 ? "text-white" : "text-white/40")}>
                    {theme}
                  </span>
                  {i === 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                    >
                      <Flame className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <p className="text-pink-500 font-mono text-[9px] tracking-[0.3em] uppercase flex items-center gap-2">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Collective Neural Feedback
                </p>
                <p className="text-white/20 font-mono text-[9px] uppercase">Sync: Global Crowd</p>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden relative mx-4">
                <motion.div 
                  animate={{ width: `${crowdEmotion * 100}%` }}
                  className={cn("h-full bg-gradient-to-r transition-colors duration-1000 shadow-[0_0_10px_rgba(255,165,0,0.5)]", currentPersona.color)}
                />
                <motion.div
                  animate={{ 
                    opacity: [0, 0.7, 0],
                    x: ['-100%', '100%']
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-white/30 blur-sm"
                />
              </div>
            </div>

            <div className="aspect-square w-48 mx-auto relative group">
              <div className={cn("absolute inset-0 rounded-full blur-2xl opacity-20 transition-colors duration-1000", currentPersona.color.split(' ')[0].replace('from-', 'bg-'))} />
              <div className="relative w-full h-full border border-white/10 rounded-full flex items-center justify-center overflow-hidden">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.05 + (personaControls.stagePresence * 0.1), 1],
                    opacity: [0.1, 0.3 + (personaControls.stagePresence * 0.2), 0.1]
                  }}
                  transition={{ duration: 0.4 / (1 + personaControls.stagePresence), repeat: Infinity }}
                  className={cn("absolute inset-0 opacity-10 transition-colors duration-1000", currentPersona.color.split(' ')[0].replace('from-', 'bg-'))}
                />
                <motion.div
                  animate={{
                    rotate: [0, 360]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 border border-white/5 rounded-full border-dashed"
                />
                <Mic2 className="w-12 h-12 text-white/50 relative z-10" />
              </div>

              {/* Floating Theme Nucleus */}
              {activeThemes.map((theme, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    y: [0, -80 - (personaControls.stagePresence * 20)],
                    x: [0, (i % 2 === 0 ? 40 : -40) * (1 + personaControls.stagePresence)],
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 3 / (1 + personaControls.stagePresence), repeat: Infinity, delay: i * 0.5 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 bg-black/50 border border-white/10 rounded-full text-[8px] font-black tracking-widest uppercase whitespace-nowrap shadow-xl"
                >
                  {theme}
                </motion.div>
              ))}
            </div>

            {/* Interactive Generate & Perform Controls */}
            <div className="flex flex-col items-center gap-3">
              <button
                disabled={isGeneratingLiveTrack}
                onClick={handlePerformLiveGenerativeTrack}
                className={cn(
                  "px-6 py-3.5 bg-pink-500 hover:bg-pink-400 text-black rounded-full font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2",
                  isGeneratingLiveTrack && "opacity-50 cursor-not-allowed bg-pink-500/15 text-pink-500 border border-pink-500/20"
                )}
              >
                {isGeneratingLiveTrack ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                    Aggregating Chat & Synthesizing...
                  </>
                ) : (
                  <>
                    <Mic2 className="w-4 h-4" />
                    Perform AI Concert Track
                  </>
                )}
              </button>
              {currentLiveTrack && (
                <button
                  onClick={toggleLiveTrack}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full text-[9px] font-mono uppercase tracking-widest flex items-center gap-1.5 transition-all"
                >
                  {currentLiveTrack.playing ? (
                    <>
                      <Pause className="w-3 h-3 text-pink-300 fill-current" />
                      Pause Live Stream Audio
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-pink-300 fill-current" />
                      Resume Live Stream Audio
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-4 w-full max-w-md mx-auto">
              <div className="p-5 bg-white/5 border border-white/10 rounded-2xl min-h-[140px] flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-2 left-3 flex items-center gap-1.5">
                  <div className={cn("w-1.5 h-1.5 rounded-full", currentLiveTrack?.playing ? "bg-green-500 animate-pulse" : "bg-white/20")} />
                  <span className="text-[8px] font-mono uppercase tracking-widest text-white/30">
                    {currentLiveTrack ? "Concert Audio Stream" : "Host Standby"}
                  </span>
                </div>
                {isGeneratingLiveTrack ? (
                  <div className="text-center space-y-3 py-4">
                    <p className="text-pink-500 font-mono text-[9px] uppercase tracking-widest animate-pulse">
                      Analyzing trending theme {Object.entries(themeVotes).sort(([, a], [, b]) => b - a)[0]?.[0]}...
                    </p>
                    <p className="text-white/40 text-[9px] font-mono">
                      Generating high-fidelity live stems with lyric matching
                    </p>
                  </div>
                ) : currentLiveTrack ? (
                  <div className="space-y-3 text-center">
                    <h4 className="text-xs font-bold text-pink-500 uppercase tracking-widest font-mono">
                      {currentLiveTrack.title}
                    </h4>
                    <AnimatePresence mode="wait">
                      <motion.p 
                        key={liveLyricsScrollIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-white/80 font-serif italic text-sm leading-relaxed px-4"
                      >
                        "{currentLiveTrack.lyrics.split('\n')[liveLyricsScrollIndex % currentLiveTrack.lyrics.split('\n').length] || currentLiveTrack.lyrics}"
                      </motion.p>
                    </AnimatePresence>
                    <div className="flex justify-center gap-1 mt-2">
                      {currentLiveTrack.lyrics.split('\n').slice(0, 8).map((_, index) => (
                        <div 
                          key={index} 
                          className={cn(
                            "w-1 h-1 rounded-full transition-all duration-300",
                            (liveLyricsScrollIndex % currentLiveTrack.lyrics.split('\n').length) === index ? "bg-pink-500 w-3" : "bg-white/10"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-white/50 font-serif italic text-xs leading-relaxed text-center px-4 py-2">
                    "Host {currentPersona.name} is reading the crowd direction. Feed lyrics or suggested themes in the live chat and click 'Perform AI Concert Track' to improvise a collective song!"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-[9px] font-mono text-white/20 uppercase mb-1">Key</p>
                <p className="text-sm font-bold">{liveParams.key}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-mono text-white/20 uppercase mb-1">BPM</p>
                <p className="text-sm font-bold">{liveParams.bpm}</p>
              </div>
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-white/20">
                  <Zap className="w-2 h-2" />
                  <p className="text-[8px] font-mono uppercase">Energy</p>
                </div>
                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
                  <motion.div 
                    animate={{ width: `${liveParams.energy * 100}%` }}
                    className="h-full bg-pink-500"
                  />
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-1 text-white/20">
                  <CloudRain className="w-2 h-2" />
                  <p className="text-[8px] font-mono uppercase">Sadness</p>
                </div>
                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
                  <motion.div 
                    animate={{ width: `${liveParams.sadness * 100}%` }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: AI DJ Listener Feed */}
        <div className="w-96 border-l border-white/10 flex flex-col bg-black/40">
          <div className="p-4 border-b border-white/10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-bold tracking-widest uppercase">AI DJ Studio</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                <TrendingUp className="w-3 h-3" />
                <span>LIVE</span>
              </div>
            </div>
            
            {/* Trending Themes Aggregation */}
            <div className="space-y-2">
              {Object.entries(themeVotes)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([theme, votes], i) => (
                  <div key={theme} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-4 h-4 rounded flex items-center justify-center text-[8px] font-bold",
                        i === 0 ? "bg-pink-500 text-black shadow-[0_0_10px_rgba(236,72,153,0.3)]" : "bg-white/10 text-white/40"
                      )}>
                        {i + 1}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold tracking-widest uppercase",
                        i === 0 ? "text-white" : "text-white/40"
                      )}>
                        {theme}
                      </span>
                    </div>
                    <span className="text-[8px] font-mono text-white/20">{votes.toLocaleString()} VOTES</span>
                  </div>
                ))}
            </div>

            {/* Vibe Influence Summary */}
            {submissions.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg">
                <Activity className="w-3 h-3 text-pink-500" />
                <span className="text-[8px] font-mono text-white/60">
                  <strong className="text-pink-500">{submissions.length}</strong> inputs shaped this session
                </span>
                {submissions.filter(s => s.djResponse.ownershipEventRequired).length > 0 && (
                  <span className="flex items-center gap-1 text-[7px] font-mono text-amber-400/60">
                    <Shield className="w-2 h-2" />
                    {submissions.filter(s => s.djResponse.ownershipEventRequired).length} ownership
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Live Submissions Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <LiveSubmissionsFeed submissions={submissions} />
            <div ref={submissionsEndRef} />
          </div>

          {/* Listener Input Panel */}
          <div className="p-4 border-t border-white/10 space-y-3">
            <ListenerInputPanel
              sessionId={`live-${Date.now()}`}
              userId="You"
              onSubmit={handleListenerSubmit}
              isProcessing={isProcessingInput}
            />
            <p className="text-[8px] font-mono text-white/20 uppercase text-center">
              Your input shapes the live session in real time
            </p>
          </div>
        </div>
      </div>
      {/* Post-Session Summary Modal */}
      <AnimatePresence>
        {showSummary && summaryData && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl p-8 space-y-8 overflow-hidden"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 blur-[100px] -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] -ml-32 -mb-32" />

              <div className="text-center space-y-2 relative">
                <div className="flex items-center justify-center gap-2 text-pink-500 mb-4 font-mono text-[10px] tracking-[0.5em] uppercase">
                  <Flame className="w-4 h-4 animate-bounce" /> Session Concluded
                </div>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic">Studio Session Wrap</h2>
                <p className="text-white/40 text-sm italic">"The echo of a million hearts in one stream."</p>
              </div>

              <div className="grid grid-cols-2 gap-8 relative">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-white/20 uppercase">Peak Global Audience</p>
                    <p className="text-3xl font-black text-white">{summaryData.listenersReached.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-white/20 uppercase">Collective Engagement</p>
                    <div className="flex items-center gap-4">
                      <p className="text-3xl font-black text-pink-500">{summaryData.engagement}%</p>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500" style={{ width: `${summaryData.engagement}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-white/20 uppercase">Final Sonance Parameters</p>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-[8px] font-bold text-white/40 uppercase">BPM</p>
                        <p className="font-bold">{summaryData.finalBPM}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-white/40 uppercase">Energy</p>
                        <p className="font-bold">{(summaryData.finalEnergy * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-white/20 uppercase">Top Collaborative Themes</p>
                    <div className="flex flex-wrap gap-2">
                      {summaryData.popularThemes.map((theme, i) => (
                        <span key={theme} className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                          i === 0 ? "bg-pink-500 text-black shadow-lg shadow-pink-500/20" : "bg-white/5 text-white/40 border border-white/10"
                        )}>
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-white/20 uppercase">Most Voted Lyrics</p>
                    <div className="space-y-2">
                      {summaryData.topLyrics.map((lyric, i) => (
                        <div key={i} className="p-3 bg-white/5 border border-white/10 rounded-xl italic text-xs text-white/60">
                          "{lyric}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 relative pt-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-pink-500 text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-pink-400 transition-all shadow-lg shadow-pink-500/20"
                >
                  Save Recording & Exit
                </button>
                <button className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-all">
                  Share Session Recap
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Live Concert Audio Element */}
      <audio 
        ref={liveAudioRef} 
        src={currentLiveTrack?.audioUrl || undefined}
        onEnded={() => {
          setCurrentLiveTrack(prev => prev ? { ...prev, playing: false } : null);
        }}
      />
    </motion.div>
  );
}
