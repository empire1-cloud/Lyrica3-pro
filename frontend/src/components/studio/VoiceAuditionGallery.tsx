import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Loader2, Mic2, User, Sparkles, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { pcmToWav } from '../../lib/audioUtils';

export const VOCAL_PROFILES = [
  {
    id: 'voice-vle-001-mateo',
    name: 'Mateo',
    archetype: 'The Corrido Storyteller',
    timbre: 'Gritty & Warm',
    specialty: 'Corridos, Regional Mexican',
    phrase: 'Esta es la historia de un hombre que nunca se rindió.',
    voiceName: 'puck', // Supported voice name
    tags: ['Heart', 'Struggle', 'Authentic'],
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'voice-vle-009-joey',
    name: 'Joey',
    archetype: 'The Urban Crooner',
    timbre: 'Smooth & Velvety',
    specialty: 'R&B, Soul, Pop',
    phrase: 'Baby, let the rhythm take control of your soul.',
    voiceName: 'puck', // Mapping to prebuilt
    tags: ['Smooth', 'Romantic', 'Vocal Runs'],
    color: 'from-blue-400 to-indigo-500'
  },
  {
    id: 'voice-vle-010-xochitl',
    name: 'Xochitl',
    archetype: 'The Nahuatl Dreamer',
    timbre: 'Bright & Resonant',
    specialty: 'Folk, Indigenous Fusion',
    phrase: 'El canto de las flores despierta el amanecer.',
    voiceName: 'kore', // Mapping to prebuilt
    tags: ['Nature', 'Ancient', 'Bright'],
    color: 'from-emerald-400 to-teal-600'
  },
  {
    id: 'voice-vle-011-chalino',
    name: 'Chalino',
    archetype: 'The Ghost of Sinaloa',
    timbre: 'Raw, Frayed Grit',
    specialty: 'Valiente Corridos, Narco-Ballads',
    phrase: 'Mi destino ya está escrito en el polvo del camino.',
    voiceName: 'charon', // Deep/Raspy
    tags: ['Veiled Violence', 'Stoic', 'VICS Verified'],
    color: 'from-amber-900 to-neutral-900'
  },
  {
    id: 'voice-vle-012-ramon',
    name: 'Ramon',
    archetype: 'The Accordion King',
    timbre: 'Melodic & Heavy-Hearted',
    specialty: 'Norteño Waltz, Romantic Corridos',
    phrase: 'El acordeón llora lo que el corazón no puede decir.',
    voiceName: 'puck', // Warm/Melodic
    tags: ['Melodic Phrasing', 'Heartbreak', 'VICS Verified'],
    color: 'from-red-900 to-neutral-900'
  },
  {
    id: 'voice-vle-002-elara',
    name: 'Elara',
    archetype: 'The Ethereal Soul',
    timbre: 'Breathy & Clear',
    specialty: 'Neo-Soul, Ambient Pop',
    phrase: "I've been waiting for the rain to wash it all away...",
    voiceName: 'kore', // Gemini TTS mapping
    tags: ['Heartache', 'Smooth', 'Vulnerable'],
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'voice-vle-003-jax',
    name: 'Jax',
    archetype: 'The Street Prophet',
    timbre: 'Deep & Raspy',
    specialty: 'Hardcore Rap, Boom Bap',
    phrase: 'Streetlights humming, concrete cold, another story that remains untold.',
    voiceName: 'charon', // Gemini TTS mapping
    tags: ['Slang', 'Poverty', 'Hard-hitting'],
    color: 'from-blue-600 to-indigo-700'
  },
  {
    id: 'voice-vle-004-zephyr',
    name: 'Zephyr',
    archetype: 'The Lowrider Synth-Poet',
    timbre: 'Close-Mic Whisper to Strained Belt',
    specialty: 'Chicano Synth-Pop, East LA Soul',
    phrase: 'Yeah, I see you shining in that new ride... [heavy inhale] Got the window down, looking dead inside.',
    voiceName: 'zephyr', // Gemini TTS mapping
    tags: ['Vocal Fry', 'Neon Bruises', 'VICS Verified'],
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'voice-vle-005-aether',
    name: 'Aether',
    archetype: 'The Dissociated Survivor',
    timbre: 'Mic-Swallowing Whisper to Hollow Falsetto',
    specialty: 'Chicano Dream-Soul, Lowrider Oldies',
    phrase: 'Staring at the plaster, making constellations out of cracks... [exhausted_inhale]',
    voiceName: 'autonoe', // Gemini TTS mapping
    tags: ['Exhausted Inhale', 'Dissociated', 'VICS Verified'],
    color: 'from-indigo-500 to-violet-500'
  },
  {
    id: 'voice-vle-006-void',
    name: 'Void',
    archetype: 'The Industrial Cumbia Architect',
    timbre: 'Sub-bass & Glottal Stops',
    specialty: 'Darkwave Cumbia, Experimental',
    phrase: 'Concrete and shadows... the rhythm of the forgotten beating through the floorboards.',
    voiceName: 'charon', // Gemini TTS mapping
    tags: ['Glottal Stop', 'Industrial', 'VICS Verified'],
    color: 'from-neutral-700 to-black'
  },
  {
    id: 'voice-vle-007-ignis',
    name: 'Ignis',
    archetype: 'The Asphalt Corridista',
    timbre: 'Smoke-damaged baritone',
    specialty: 'Trap-Corridos Fusion',
    phrase: 'The streets remember what the history books erased.',
    voiceName: 'puck', // Gemini TTS mapping
    tags: ['Acoustic Grit', '808 Drag', 'VICS Verified'],
    color: 'from-orange-700 to-amber-700'
  },
  {
    id: 'voice-vle-008-terra',
    name: 'Terra',
    archetype: 'The Souldies Siren',
    timbre: 'Warm, analog belt (tape degraded)',
    specialty: 'Vintage Chicano Soul / R&B',
    phrase: 'Tears on the vinyl, but the groove plays on.',
    voiceName: 'aoede', // Gemini TTS mapping
    tags: ['Vinyl Crackle', 'Late-Pocket Swing', 'VICS Verified'],
    color: 'from-amber-700 to-yellow-600'
  }
];

interface Props {
  selectedVoiceName?: string;
  onVoiceSelect?: (voiceName: string) => void;
}

export default function VoiceAuditionGallery({ selectedVoiceName, onVoiceSelect }: Props) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!cooldownUntil) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining === 0) {
        setCooldownUntil(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const handleAudition = async (profile: typeof VOCAL_PROFILES[0]) => {
    // Check cooldown
    if (cooldownUntil && Date.now() < cooldownUntil && !audioUrls[profile.id]) {
      return;
    }
    // If currently playing this profile, pause it
    if (playingId === profile.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }

    // If we already have the audio generated, just play it
    if (audioUrls[profile.id]) {
      if (audioRef.current) {
        audioRef.current.src = audioUrls[profile.id];
        audioRef.current.play().catch(e => {
          console.error("Play failed:", e);
          setPlayingId(null);
        });
        setPlayingId(profile.id);
      }
      return;
    }

    // If there is a pre-rendered preview URL, use it
    if ('previewUrl' in profile && profile.previewUrl) {
      if (audioRef.current) {
        audioRef.current.src = profile.previewUrl as string;
        audioRef.current.play().catch(e => {
          console.error("Play failed:", e);
          setPlayingId(null);
        });
        setPlayingId(profile.id);
      }
      return;
    }

    // Otherwise, generate it via Gemini TTS
    setLoadingId(profile.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: profile.phrase,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: profile.voiceName }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const url = pcmToWav(base64Audio);
        setAudioUrls(prev => ({ ...prev, [profile.id]: url }));
        
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.play().catch(e => {
            console.error("Play failed:", e);
            setPlayingId(null);
          });
          setPlayingId(profile.id);
        }
      }
    } catch (error: any) {
      console.error("Failed to generate audition:", error);
      if (error?.message?.includes('429') || error?.status === 429) {
        setCooldownUntil(Date.now() + 60000);
        setCooldownRemaining(60);
      } else {
        alert("Failed to generate audition clip. Check console for details.");
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-obsidian-900/50 border border-white/5 rounded-3xl p-6 md:p-8 mb-12 relative overflow-hidden glass-card">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onEnded={() => setPlayingId(null)}
        onPause={() => setPlayingId(null)}
        className="hidden"
      />

      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Mic2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Vocal Audition Gallery</h2>
            <p className="text-slate-400 text-sm">Hear the "Soulfire" performance before you start your session. Powered by Aether-Voice.</p>
          </div>
        </div>

        <AnimatePresence>
          {cooldownUntil && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500"
            >
              <Clock className="w-4 h-4 animate-pulse" />
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">API Cooldown</p>
                <p className="text-xs font-mono font-bold leading-none">{cooldownRemaining}s</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {cooldownUntil && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-200">Gemini API Quota Exceeded</p>
              <p className="text-xs text-amber-500/70">The system is currently cooling down to prevent service disruption. New auditions are temporarily disabled, but you can still play previously generated clips.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {VOCAL_PROFILES.map((profile) => (
          <motion.div 
            key={profile.id}
            whileHover={{ y: -4 }}
            onClick={() => handleAudition(profile)}
            className={`bg-black/40 border rounded-2xl p-6 flex flex-col transition-all cursor-pointer ${
              selectedVoiceName === profile.voiceName 
                ? 'border-blue-500 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]' 
                : 'border-white/5 hover:border-white/10'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${profile.color} flex items-center justify-center shadow-lg`}>
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
                    {profile.name}
                    {selectedVoiceName === profile.voiceName && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">{profile.archetype}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Timbre & Specialty</p>
                <p className="text-sm text-slate-300">{profile.timbre} • {profile.specialty}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Soulfire DNA</p>
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map(tag => (
                    <span key={tag} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md bg-obsidian-900 text-slate-300 border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-obsidian-950/80 rounded-lg p-3 border border-white/5">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" /> Signature Phrase
                </p>
                <p className="text-sm text-slate-300 italic">"{profile.phrase}"</p>
              </div>
            </div>

            {selectedVoiceName === profile.voiceName && (
              <div className={`mt-5 p-3 rounded-xl bg-gradient-to-r ${profile.color} flex items-center justify-center shadow-lg`}>
                <span className="text-white font-black tracking-widest uppercase text-sm drop-shadow-md">
                  Active: {profile.name}
                </span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAudition(profile);
                }}
                disabled={(loadingId !== null && loadingId !== profile.id) || (cooldownUntil !== null && !audioUrls[profile.id])}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  playingId === profile.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : (cooldownUntil !== null && !audioUrls[profile.id])
                      ? 'bg-obsidian-950 text-slate-600 border border-white/5 cursor-not-allowed'
                      : 'bg-obsidian-900 text-white hover:bg-obsidian-800 border border-white/5'
                }`}
              >
                {loadingId === profile.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : playingId === profile.id ? (
                  <>
                    <Pause className="w-4 h-4" /> Stop
                  </>
                ) : (cooldownUntil !== null && !audioUrls[profile.id]) ? (
                  <>
                    <Clock className="w-4 h-4" /> Locked
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Audition
                  </>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVoiceSelect?.(profile.voiceName);
                  handleAudition(profile);
                }}
                disabled={cooldownUntil !== null && !audioUrls[profile.id]}
                className={`flex items-center justify-center py-2.5 rounded-xl text-sm font-bold transition-all ${
                  selectedVoiceName === profile.voiceName
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : (cooldownUntil !== null && !audioUrls[profile.id])
                      ? 'bg-obsidian-950 text-slate-600 border border-white/5 cursor-not-allowed'
                      : 'bg-obsidian-900 text-white hover:bg-obsidian-800 border border-white/5'
                }`}
              >
                {selectedVoiceName === profile.voiceName ? 'Selected' : 'Select Voice'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
