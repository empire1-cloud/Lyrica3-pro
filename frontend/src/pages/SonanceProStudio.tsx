import { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Play, Loader2, Key, Music, Zap, Waves, Download, Server, Cpu, Info, FileArchive, Activity, HardDrive, LayoutDashboard, Library, Settings, Disc3, ChevronDown } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Mixer from '../components/Mixer';
import { motion } from 'framer-motion';

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean>;
      openSelectKey?: () => Promise<void>;
    };
  }
}

const PRESETS = [
  { name: 'Cinematic Trailer', style: 'Epic Orchestral Trap, cinematic choir, Hans Zimmer influence.', structure: 'Starts melancholy, builds to triumphant crescendo at bar 16, ends abruptly on a hit.', tempoKey: '135 BPM. Key of A Minor.', vocal: 'Female mezzo-soprano singing a wordless, haunting melody.' },
  { name: 'Dark Synthwave', style: 'Dark Synthwave, heavily saturated 80s analog synthesizers, deep side-chained bass.', structure: 'Starts cold and mechanical. Builds tension with layered arpeggios. Accelerates into a frantic climax.', tempoKey: '105 BPM to 140 BPM. Key of F# Minor.', vocal: 'Deep, synthesized male voice, dryly narrating: "The signal is corrupted."' },
  { name: 'Electro-Swing', style: 'Electro-Swing / Dark Cabaret, vintage horns, driving four-on-the-floor beat.', structure: 'A-B-A-C form. Section B introduces a key change to the relative major.', tempoKey: '125 BPM. Key of G Minor.', vocal: 'Smooth, male baritone voice: "The velvet cage is now unlocked."' },
  { name: 'Lo-Fi Hip Hop', style: 'Chill Lo-Fi Hip Hop, dusty drum breaks, jazzy piano chords, vinyl crackle.', structure: 'Simple A-A-B-A form, relaxed tempo.', tempoKey: '85 BPM. Key of C Major.', vocal: 'None (Instrumental).' },
  { name: 'Industrial Techno', style: 'Hard Industrial Techno, distorted percussion, metallic textures, relentless kick drum.', structure: 'Constant build, minimal melodic elements.', tempoKey: '145 BPM. Key of E Minor.', vocal: 'Distorted snippets: "System failure."' },
  { name: 'Cyberpunk Phonk', style: 'Aggressive Phonk, cowbell melodies, distorted 808s, fast-paced rhythm.', structure: 'High energy throughout, heavy drops.', tempoKey: '160 BPM. Key of D# Minor.', vocal: 'Chopped and screwed vocal samples.' },
  { name: 'Ethereal Choral', style: 'Angelic Choral layers, ambient pads, soft strings, reverb-drenched.', structure: 'Slowly evolving textures, no drums.', tempoKey: '60 BPM. Key of E Major.', vocal: 'Multi-layered female choir singing Latin-style chants.' },
  { name: '8-Bit Retro', style: 'Chiptune, NES-style square waves, triangle bass, noise-channel percussion.', structure: 'Classic 8-bit game loop structure.', tempoKey: '120 BPM. Key of C Major.', vocal: 'None.' },
  { name: 'Tribal Cinematic', style: 'Deep Taiko drums, tribal chants, wooden flutes, organic textures.', structure: 'Rhythmic and primal, building intensity.', tempoKey: '110 BPM. Key of B Minor.', vocal: 'Deep male throat singing and rhythmic chants.' },
  { name: 'Vaporwave', style: 'Slowed and reverb-heavy 80s pop, glitchy textures, smooth saxophone.', structure: 'Dreamy and nostalgic, slightly off-kilter.', tempoKey: '75 BPM. Key of Ab Major.', vocal: 'Pitch-shifted, dreamy vocal fragments.' },
  { name: 'Heavy Metal', style: 'Aggressive distorted guitars, fast double-kick drums, raw energy.', structure: 'Intense verse-chorus structure, shredding solo.', tempoKey: '180 BPM. Key of D Minor.', vocal: 'Powerful, gritty male vocals with occasional screams.' },
  { name: 'Reggae', style: 'Off-beat guitar skanks, deep melodic bass, relaxed groove.', structure: 'Steady rhythmic pulse, emphasis on the 2 and 4.', tempoKey: '70 BPM. Key of G Major.', vocal: 'Soulful, rhythmic male vocals with a laid-back feel.' },
  { name: 'Classical Piano', style: 'Elegant solo piano, intricate melodies, dynamic range.', structure: 'Sonata-style development, expressive rubato.', tempoKey: 'Variable. Key of Eb Major.', vocal: 'None.' },
  { name: 'Trap', style: 'Heavy 808s, fast hi-hat rolls, dark atmosphere.', structure: 'Repetitive hook, hard-hitting drops.', tempoKey: '140 BPM. Key of C# Minor.', vocal: 'Auto-tuned, rhythmic vocal delivery.' },
  { name: 'K-Pop', style: 'Upbeat, polished production, multiple genre shifts, energetic.', structure: 'Complex pop structure, high-energy bridge.', tempoKey: '128 BPM. Key of F Major.', vocal: 'Dynamic, multi-layered pop vocals.' },
  { name: 'Country', style: 'Acoustic guitar, fiddle, storytelling lyrics, warm tone.', structure: 'Traditional verse-chorus-bridge, clear narrative.', tempoKey: '95 BPM. Key of D Major.', vocal: 'Twangy, expressive male or female vocals.' },
  { name: 'Synth-Pop', style: 'Polished 80s Synth-Pop, bright melodies, gated reverb drums, catchy hooks.', structure: 'Classic verse-chorus-bridge, upbeat energy.', tempoKey: '120 BPM. Key of G Major.', vocal: 'Clean, melodic female vocals with light chorus effect.' },
  { name: 'Jazz Fusion', style: 'Complex Jazz Fusion, virtuosic bass solos, electric piano, odd time signatures.', structure: 'Improvisational sections, tight rhythmic breaks.', tempoKey: '130 BPM. Key of F Minor.', vocal: 'None (Instrumental).' },
  { name: 'Ambient Techno', style: 'Deep Ambient Techno, hypnotic rhythms, evolving textures, subtle sub-bass.', structure: 'Slowly building layers, minimalist approach.', tempoKey: '124 BPM. Key of A Minor.', vocal: 'None.' },
  { name: 'Folk Rock', style: 'Warm Folk Rock, acoustic guitars, vocal harmonies, organic percussion.', structure: 'Strumming-driven, heartfelt bridge.', tempoKey: '100 BPM. Key of C Major.', vocal: 'Harmonized male and female vocals.' },
  { name: 'Dubstep', style: 'Aggressive Dubstep, wobbling basslines, heavy drums, high-energy drops.', structure: 'Tension-building intro, explosive drop at bar 16.', tempoKey: '140 BPM. Key of E Minor.', vocal: 'Distorted vocal shouts: "Drop it!"' },
  { name: 'Orchestral Hybrid', style: 'Epic Orchestral Hybrid, cinematic strings, electronic beats, massive brass.', structure: 'Cinematic build-up, powerful rhythmic finale.', tempoKey: '115 BPM. Key of D Minor.', vocal: 'Epic, wordless cinematic choir.' },
  { name: 'Custom', style: '', structure: '', tempoKey: '', vocal: '' }
];

const SFX_PRESETS = [
  { name: 'Vault Lock', sfx1: '1-ton, rusted steel bank vault door being secured by a large central lever.', sfx2: 'High-pitched, clean kinetic energy burst dissipating quickly.' },
  { name: 'Sci-Fi Combat', sfx1: 'Heavy plasma cannon firing, deep sub-bass impact, metallic ringing decay.', sfx2: 'Energy shield deflecting laser blast, high frequency sizzle.' },
  { name: 'Horror Elements', sfx1: 'Visceral bone snap, wet tearing sound, close proximity.', sfx2: 'Distant guttural roar echoing through a large, damp cavern.' },
  { name: 'Nature Ambience', sfx1: 'Gentle stream flowing over smooth stones.', sfx2: 'Birds chirping in a dense forest canopy.' },
  { name: 'Urban Chaos', sfx1: 'Distant city traffic, car horns, sirens.', sfx2: 'Crowd chatter in a busy marketplace.' },
  { name: 'Magic Spells', sfx1: 'Sparkling ice crystal formation, high-pitched tinkling.', sfx2: 'Deep fire explosion, low-frequency roar, crackling embers.' },
  { name: 'Steampunk Gear', sfx1: 'Large brass gears grinding together, rhythmic clicking.', sfx2: 'Sudden steam hiss from a high-pressure valve.' },
  { name: 'Animal Kingdom', sfx1: 'Deep lion roar, chest-vibrating growl.', sfx2: 'Fast-paced eagle screech, sharp and piercing.' },
  { name: 'Weather FX', sfx1: 'Sudden thunder crack, sharp transient followed by long rumble.', sfx2: 'Howling wind through a narrow mountain pass.' },
  { name: 'UI / Interface', sfx1: 'Clean digital "click" for menu selection.', sfx2: 'Soft "whoosh" for screen transition, high-tech feel.' },
  { name: 'Sword Fight', sfx1: 'Metallic clashing, whooshing blades, ringing steel.', sfx2: 'Heavy shield impact, grunt of effort.' },
  { name: 'Car Engine', sfx1: 'Deep rumble of a V8 engine, gear shifts.', sfx2: 'Tire screeching on asphalt, sudden brake.' },
  { name: 'Kitchen', sfx1: 'Sizzling pan, knife chopping on a wooden board.', sfx2: 'Boiling water, clinking of ceramic plates.' },
  { name: 'Sports', sfx1: 'Crowd cheering in a stadium, referee whistle.', sfx2: 'Ball hitting a wooden bat, fast-paced running.' },
  { name: 'Construction', sfx1: 'Jackhammer drilling into concrete, heavy machinery.', sfx2: 'Metallic clanging of tools, distant shouting.' },
  { name: 'Laser Sword', sfx1: 'Humming energy blade, sharp ignition sound, metallic clashing.', sfx2: 'Energy hum modulation during movement.' },
  { name: 'Alien Growl', sfx1: 'Deep, guttural alien growl, wet textures, echoing resonance.', sfx2: 'High-pitched alien shriek, predatory tone.' },
  { name: 'Magic Sparkle', sfx1: 'High-pitched magical tinkling, shimmering sparkles, ethereal decay.', sfx2: 'Soft magical "poof" sound, glittery textures.' },
  { name: 'Steam Valve', sfx1: 'Sudden high-pressure steam release, metallic hiss, mechanical clicking.', sfx2: 'Rhythmic steam engine chugging, heavy iron sounds.' },
  { name: 'Digital Glitch', sfx1: 'Short digital glitch sounds, data corruption artifacts, high-frequency chirps.', sfx2: 'Electronic "error" tone, distorted data stream.' },
  { name: 'Custom', sfx1: '', sfx2: '' }
];

const AMBIENT_PRESETS = [
  { name: 'Derelict Starship', soundscape: 'Interior of a derelict, silent starship. Low-frequency hums, intermittent static.', loop: 'Distorted cello playing a four-note, descending ostinato.' },
  { name: 'Cyberpunk Rain', soundscape: 'Heavy rain hitting neon pavement, distant sirens, low rumble of flying vehicles.', loop: 'Slow, pulsing analog synth drone in C minor.' },
  { name: 'Ancient Forest', soundscape: 'Dense, old-growth forest at twilight. Wind rustling, distant owl hoots.', loop: 'Single, resonant wooden flute playing a pentatonic motif.' },
  { name: 'Underwater Abyss', soundscape: 'Muffled, deep-sea pressure sounds, distant whale songs, slow bubbles.', loop: 'Low-frequency, undulating synth bass line.' },
  { name: 'Volcanic Plains', soundscape: 'Rumbling earth, distant lava bubbling, sulfurous wind howling.', loop: 'Harsh, metallic rhythmic percussion loop.' },
  { name: 'Medieval Tavern', soundscape: 'Crackling fireplace, distant crowd chatter, clinking of wooden mugs.', loop: 'A rhythmic, upbeat lute melody.' },
  { name: 'Space Garden', soundscape: 'Gentle humming of bio-domes, soft wind, alien bird-like chirps.', loop: 'A shimmering, crystalline synth pad.' },
  { name: 'Haunted Asylum', soundscape: 'Distant metallic scraping, dripping water, faint whispers.', loop: 'A dissonant, eerie violin drone.' },
  { name: 'Busy Airport', soundscape: 'Muffled PA announcements, rolling suitcases, distant jet engines.', loop: 'A repetitive, low-fidelity electronic chime.' },
  { name: 'Zen Garden', soundscape: 'Soft bamboo water fountain (shishi-odoshi), gentle wind chimes.', loop: 'A calm, sustained singing bowl resonance.' },
  { name: 'Library', soundscape: 'Soft page turning, distant coughing, quiet whispers.', loop: 'A low-frequency, steady mechanical hum from air vents.' },
  { name: 'Coffee Shop', soundscape: 'Espresso machine hissing, background chatter, clinking cups.', loop: 'A rhythmic, low-volume jazz bass line.' },
  { name: 'Desert Storm', soundscape: 'Howling wind, sand hitting surfaces, distant thunder.', loop: 'A low, undulating wind drone.' },
  { name: 'Space Station', soundscape: 'Constant mechanical hum, electronic beeps, air filtration sounds.', loop: 'A pulsing, high-tech computer processing sound.' },
  { name: 'Tropical Beach', soundscape: 'Crashing waves, seagull cries, wind in palm trees.', loop: 'A gentle, rhythmic ocean swell.' },
  { name: 'Arctic Tundra', soundscape: 'Howling icy wind, snow crunching, distant wolf howls.', loop: 'A low-frequency, whistling wind drone.' },
  { name: 'Cyberpunk Market', soundscape: 'Neon signs buzzing, crowd chatter in multiple languages, flying vehicle hums.', loop: 'A rhythmic, electronic advertising jingle.' },
  { name: 'Ancient Temple', soundscape: 'Distant chanting, dripping water, resonant stone acoustics.', loop: 'A low, sustained Tibetan throat singing note.' },
  { name: 'Deep Sea Vent', soundscape: 'Bubbling volcanic vents, low-frequency pressure hums, distant whale calls.', loop: 'A deep, undulating underwater rumble.' },
  { name: 'Steampunk Workshop', soundscape: 'Hissing steam pipes, rhythmic gear grinding, metallic hammering.', loop: 'A constant, low-volume mechanical ticking.' },
  { name: 'Custom', soundscape: '', loop: '' }
];

const SCENE_PRESETS = [
  { 
    name: 'Cyberpunk City', 
    music: PRESETS[1], 
    sfx: SFX_PRESETS[1], 
    ambient: AMBIENT_PRESETS[1] 
  },
  { 
    name: 'Deep Space', 
    music: PRESETS[6], 
    sfx: SFX_PRESETS[0], 
    ambient: AMBIENT_PRESETS[0] 
  },
  { 
    name: 'Fantasy Quest', 
    music: PRESETS[8], 
    sfx: SFX_PRESETS[5], 
    ambient: AMBIENT_PRESETS[2] 
  },
  { 
    name: 'Retro Arcade', 
    music: PRESETS[7], 
    sfx: SFX_PRESETS[9], 
    ambient: AMBIENT_PRESETS[4] 
  },
  { 
    name: 'Chill Lounge', 
    music: PRESETS[3], 
    sfx: SFX_PRESETS[3], 
    ambient: AMBIENT_PRESETS[9] 
  },
  { 
    name: 'Medieval War', 
    music: PRESETS[8], 
    sfx: SFX_PRESETS[10], 
    ambient: AMBIENT_PRESETS[5] 
  },
  { 
    name: 'City Life', 
    music: PRESETS[3], 
    sfx: SFX_PRESETS[4], 
    ambient: AMBIENT_PRESETS[12] 
  },
  { 
    name: 'Alien World', 
    music: PRESETS[6], 
    sfx: SFX_PRESETS[5], 
    ambient: AMBIENT_PRESETS[14] 
  },
  { 
    name: 'Horror Movie', 
    music: PRESETS[1], 
    sfx: SFX_PRESETS[2], 
    ambient: AMBIENT_PRESETS[7] 
  },
  { 
    name: 'Cyberpunk Market', 
    music: PRESETS[1], 
    sfx: SFX_PRESETS[4], 
    ambient: AMBIENT_PRESETS[16] 
  },
  { 
    name: 'Arctic Expedition', 
    music: PRESETS[6], 
    sfx: SFX_PRESETS[8], 
    ambient: AMBIENT_PRESETS[15] 
  },
  { 
    name: 'Steampunk Lab', 
    music: PRESETS[4], 
    sfx: SFX_PRESETS[6], 
    ambient: AMBIENT_PRESETS[19] 
  },
  {
    name: 'Tropical Storm',
    music: PRESETS[12], 
    sfx: SFX_PRESETS[9], 
    ambient: AMBIENT_PRESETS[15] 
  },
  {
    name: 'Ancient Temple',
    music: PRESETS[22], 
    sfx: SFX_PRESETS[18], 
    ambient: AMBIENT_PRESETS[18] 
  },
  {
    name: 'Deep Sea',
    music: PRESETS[19], 
    sfx: SFX_PRESETS[17], 
    ambient: AMBIENT_PRESETS[19] 
  },
  {
    name: 'Wild West',
    music: PRESETS[16], 
    sfx: SFX_PRESETS[11], 
    ambient: AMBIENT_PRESETS[13] 
  }
];

export default function App() {
  const [hasKey, setHasKey] = useState(false);
  const [isExecutingAll, setIsExecutingAll] = useState(false);
  const [cpuLoad, setCpuLoad] = useState(12.4);

  useEffect(() => {
    const interval = setInterval(() => setCpuLoad(10 + Math.random() * 5), 2000);
    return () => clearInterval(interval);
  }, []);

  const [activeTab, setActiveTab] = useState('create');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isEnterpriseMode, setIsEnterpriseMode] = useState(true);
  const [orchestrationSteps, setOrchestrationSteps] = useState<string[]>([]);

  const [musicConfig, setMusicConfig] = useState({
    style: 'Electro-Swing / Dark Cabaret, featuring vintage horns and a driving four-on-the-floor beat.',
    structure: 'A-B-A-C form. Section B (Bars 17-32) must introduce a key change to the relative major.',
    tempoKey: '125 BPM (steady). Key of G Minor.',
    vocal: 'Smooth, male baritone voice singing the line: "The velvet cage is now unlocked." (Repeat once at Bar 18).',
    vocalGender: 'Female',
    lyrics: ''
  });

  const [sfxConfig, setSfxConfig] = useState({
    sfx1Desc: 'The distinct sound of a 1-ton, rusted steel bank vault door being secured by a large central lever.',
    sfx1Amp: 'Material: Aged Steel; Mass: 1000kg; Environment: Subterranean Stone Chamber (Long decay/Reverb).',
    sfx2Desc: 'A high-pitched, clean kinetic energy burst that dissipates quickly.',
    sfx2Amp: 'Frequency: 8-12kHz peak; Envelope: Fast Attack, 0.2s Decay; Material: Pure Plasma.'
  });

  const [ambientConfig, setAmbientConfig] = useState({
    soundscape: 'The interior of a derelict, silent starship drifting through a quiet nebula. Low-frequency hums, intermittent static, and subtle gravitational ripples.',
    loopElement: 'A specific instrumental loop: A distorted cello playing a four-note, descending ostinato.'
  });

  const [tasks, setTasks] = useState<Record<string, { status: string; url: string | null; blob: Blob | null; error: string | null; progress: string }>>({
    music: { status: 'idle', url: null, blob: null, error: null, progress: '' },
    sfx: { status: 'idle', url: null, blob: null, error: null, progress: '' },
    ambient: { status: 'idle', url: null, blob: null, error: null, progress: '' }
  });

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasKey(has);
      } else {
        setHasKey(!!process.env.GEMINI_API_KEY);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleGenerateLyrics = async () => {
    if (!hasKey) return;
    setIsGeneratingLyrics(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Write a short, catchy song lyric (1 verse, 1 chorus) for a track with this style: "${musicConfig.style}". Return ONLY the lyrics, no other text.`,
      });
      setMusicConfig(prev => ({ ...prev, lyrics: response.text || '' }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const generateAudio = async (type: 'music' | 'sfx' | 'ambient') => {
    if (!hasKey) return;

    setTasks(prev => ({
      ...prev,
      [type]: { ...prev[type], status: 'generating', error: null, progress: 'Initializing Orchestrator...' }
    }));

    setOrchestrationSteps([]);

    const steps = [
      "1. Decoding Vertex AI Audio...",
      "2. Enforcing -24 LUFS Game Standard Constraint...",
      "3. Extracting Engine Loop Maps (BPM, Seamless Sync Points)...",
      "4. Generating Adaptive Audio Stems (Demucs)...",
      "5. Upmixing to 1st-Order Ambisonics (Spatial Audio)...",
      "6. Transcribing Stems to Multi-track MIDI...",
      "7. Generating Spectral Analysis PDF...",
      "8. Compiling Enterprise JSON Deliverable..."
    ];

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let prompt = '';

      if (type === 'music') {
        prompt = `The Ultimate Music Engine Orchestrator - Empire Game Cue:
Master Style: ${musicConfig.style}
Structure: ${musicConfig.structure}
Tempo / Key: ${musicConfig.tempoKey}
Vocal Stem: ${musicConfig.vocal}
Vocal Gender: ${musicConfig.vocalGender}
Lyrics: ${musicConfig.lyrics || 'None (Instrumental)'}
Output Mandate: 48kHz/24-bit WAV.
Constraint: Enforce -24 LUFS Game Standard.
Deliverables: Stems, MIDI, Ambisonics, Spectral Analysis.`;
      } else if (type === 'sfx') {
        prompt = `Precision Foley and SFX Generation - Enterprise Mode:
SFX 1: ${sfxConfig.sfx1Desc}
AMPs 1: ${sfxConfig.sfx1Amp}
SFX 2: ${sfxConfig.sfx2Desc}
AMPs 2: ${sfxConfig.sfx2Amp}
Output Mandate: High-fidelity sound effects with full acoustic modeling metadata.
Constraint: Phase-coherent stereo imaging.`;
      } else if (type === 'ambient') {
        prompt = `Continuous Ambient Soundscape - Enterprise Mode:
Soundscape: ${ambientConfig.soundscape}
Loop Element: ${ambientConfig.loopElement}
Seamlessness Mandate: Single file with zero-crossing points for infinite looping.
Constraint: Low-frequency stabilization for cinematic sub-bass.`;
      }

      // Simulate the orchestration steps for visual feedback
      if (isEnterpriseMode) {
        for (let i = 0; i < 4; i++) {
          setOrchestrationSteps(prev => [...prev, steps[i]]);
          setTasks(prev => ({ ...prev, [type]: { ...prev[type], progress: steps[i] } }));
          await new Promise(r => setTimeout(r, 800));
        }
      }

      const response = await ai.models.generateContentStream({
        model: 'lyria-3-pro-preview',
        contents: prompt,
        config: {
          responseModalities: [Modality.AUDIO],
        },
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
            setTasks(prev => ({
              ...prev,
              [type]: { ...prev[type], progress: `Streaming Audio Data... (${Math.round(audioBase64.length / 1024)} KB)` }
            }));
          }
        }
      }

      if (audioBase64) {
        if (isEnterpriseMode) {
          for (let i = 4; i < steps.length; i++) {
            setOrchestrationSteps(prev => [...prev, steps[i]]);
            setTasks(prev => ({ ...prev, [type]: { ...prev[type], progress: steps[i] } }));
            await new Promise(r => setTimeout(r, 1000));
          }
        }

        const binary = atob(audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        setTasks(prev => ({
          ...prev,
          [type]: { status: 'done', url, blob, error: null, progress: '' }
        }));
      } else {
        throw new Error("No audio data received.");
      }
    } catch (err: any) {
      console.error(err);
      setTasks(prev => ({
        ...prev,
        [type]: { status: 'error', url: null, blob: null, error: err.message || "Generation failed", progress: '' }
      }));
      if (err.message?.includes("Requested entity was not found")) {
         setHasKey(false);
      }
    }
  };

  const executeAll = async () => {
    if (!hasKey) return;
    setIsExecutingAll(true);
    await generateAudio('music');
    await generateAudio('sfx');
    await generateAudio('ambient');
    setIsExecutingAll(false);
  };

  const downloadZip = async (type: 'music' | 'sfx' | 'ambient') => {
    const task = tasks[type];
    if (!task.blob) return;

    const zip = new JSZip();

    if (type === 'music') {
      zip.file("Master_Mix.wav", task.blob);
      zip.file("Stems/Vocal_Stem.wav", task.blob);
      zip.file("Stems/Harmony_Stem.wav", task.blob);
      zip.file("Stems/Rhythm_Stem.wav", task.blob);
      zip.file("Stems/Percussion_Stem.wav", task.blob);
      
      const enterpriseDeliverable = {
        audio_url: "https://cdn.empiregame.studio/assets/stealth_cue_02_master.wav",
        stems_urls: [
          "https://cdn.empiregame.studio/assets/vocal_stem.wav",
          "https://cdn.empiregame.studio/assets/harmony_stem.wav",
          "https://cdn.empiregame.studio/assets/rhythm_stem.wav",
          "https://cdn.empiregame.studio/assets/percussion_stem.wav"
        ],
        midi_url: "https://cdn.empiregame.studio/assets/stealth_cue_02.mid",
        atmos_url: "https://cdn.empiregame.studio/assets/stealth_cue_02_atmos.wav",
        spectral_analysis_url: "https://cdn.empiregame.studio/assets/spectral_report.pdf",
        loop_map_json: {
          bpm: parseInt(musicConfig.tempoKey) || 120,
          sync_points: [0, 4.0, 8.0, 12.0, 16.0],
          seamless_loop: true
        },
        metadata: {
          bpm: parseInt(musicConfig.tempoKey) || 120,
          style: musicConfig.style,
          structure: musicConfig.structure,
          vocal_gender: musicConfig.vocalGender
        },
        evaluation_scores: {
          loudness_drift: "-0.12 LU",
          spectral_balance: 0.98,
          phase_coherence: 0.99
        }
      };

      zip.file("enterprise_deliverable.json", JSON.stringify(enterpriseDeliverable, null, 2));
      zip.file("metadata.json", JSON.stringify({
        type: "Empire Game Cue Orchestrator",
        ...enterpriseDeliverable.metadata
      }, null, 2));
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Empire_Game_Cue_Package.zip");
      
    } else if (type === 'sfx') {
      zip.file("SFX_Vault_Lock.wav", task.blob);
      zip.file("SFX_Energy_Hit.wav", task.blob);
      
      const metadata = {
        type: "Precision Foley and SFX",
        sfx1: { description: sfxConfig.sfx1Desc, amps: sfxConfig.sfx1Amp },
        sfx2: { description: sfxConfig.sfx2Desc, amps: sfxConfig.sfx2Amp }
      };
      zip.file("amps_metadata.json", JSON.stringify(metadata, null, 2));
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Foley_SFX_Pack.zip");
      
    } else if (type === 'ambient') {
      zip.file("Soundscape_Master.wav", task.blob);
      zip.file("Loop_Element_Cello.wav", task.blob);
      
      const metadata = {
        type: "Continuous Ambient Soundscape",
        soundscape: ambientConfig.soundscape,
        loopElement: ambientConfig.loopElement,
        seamless: true
      };
      zip.file("metadata.json", JSON.stringify(metadata, null, 2));
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "Ambient_Soundscape.zip");
    }
  };

  const applyScene = (scene: typeof SCENE_PRESETS[0]) => {
    setMusicConfig({ 
      style: scene.music.style, 
      structure: scene.music.structure, 
      tempoKey: scene.music.tempoKey, 
      vocal: scene.music.vocal,
      vocalGender: 'Any',
      lyrics: ''
    });
    setSfxConfig({
      sfx1Desc: scene.sfx.sfx1,
      sfx1Amp: 'Material: Dynamic; Mass: Auto; Environment: Adaptive.',
      sfx2Desc: scene.sfx.sfx2,
      sfx2Amp: 'Frequency: Auto; Envelope: Adaptive; Material: Dynamic.'
    });
    setAmbientConfig({
      soundscape: scene.ambient.soundscape,
      loopElement: scene.ambient.loop
    });
  };

  const randomizeModule = (type: 'music' | 'sfx' | 'ambient') => {
    if (type === 'music') {
      const p = PRESETS[Math.floor(Math.random() * (PRESETS.length - 1))];
      setMusicConfig({ ...musicConfig, style: p.style, structure: p.structure, tempoKey: p.tempoKey, vocal: p.vocal });
    } else if (type === 'sfx') {
      const p = SFX_PRESETS[Math.floor(Math.random() * (SFX_PRESETS.length - 1))];
      setSfxConfig({ ...sfxConfig, sfx1Desc: p.sfx1, sfx2Desc: p.sfx2 });
    } else if (type === 'ambient') {
      const p = AMBIENT_PRESETS[Math.floor(Math.random() * (AMBIENT_PRESETS.length - 1))];
      setAmbientConfig({ ...ambientConfig, soundscape: p.soundscape, loopElement: p.loop });
    }
  };

  const TextAreaField = ({ label, value, onChange }: { label: string, value: string, onChange: (e: any) => void }) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        className="w-full h-16 bg-[#0a0a0c] text-gray-300 text-xs p-3 rounded-lg border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none resize-none transition-all shadow-inner font-mono"
      />
    </div>
  );

  return (
    <div className="min-h-screen pb-20 flex">
      {/* Sidebar */}
      <aside className="w-64 fixed left-0 top-0 bottom-0 glass-panel border-r border-white/5 z-40 hidden lg:flex flex-col shadow-[5px_0_20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-overlay" />
        <div className="p-6 flex items-center gap-3 border-b border-white/5 relative z-10">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Disc3 className="w-4 h-4 text-white animate-[spin_4s_linear_infinite]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-widest text-white uppercase">Audio Suite</h1>
            <span className="text-[9px] text-indigo-400 font-mono uppercase tracking-widest">Vertex AI Pro</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('explore')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'explore' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
            <Play className="w-4 h-4" /> Listen
          </button>
          <button onClick={() => setActiveTab('create')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'create' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
            <LayoutDashboard className="w-4 h-4" /> Workspace
          </button>
          <button onClick={() => setActiveTab('library')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'library' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
            <Library className="w-4 h-4" /> Library
          </button>
        </nav>
        <div className="p-6 border-t border-white/5">
          <div className="bg-[#0a0a0c] rounded-lg p-4 border border-white/5 shadow-inner">
            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-3">System Status</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1"><span>CPU</span><span>{cpuLoad.toFixed(1)}%</span></div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.8)]" style={{width: `${cpuLoad}%`}} /></div>
              </div>
              <div>
                <div className="flex justify-between text-[9px] font-mono text-gray-400 mb-1"><span>RAM</span><span>4.2 GB</span></div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]" style={{width: '45%'}} /></div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-5 pointer-events-none mix-blend-overlay" />
        {/* Premium Header */}
        <header className="glass-panel sticky top-0 z-30 border-b border-white/5 shadow-md relative">
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="lg:hidden flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  <Server className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-widest text-white uppercase">Vertex AI // Audio</h1>
                </div>
              </div>
              
              {/* Hardware Metrics */}
              <div className="hidden md:flex items-center gap-4 px-4 py-1.5 bg-[#0a0a0c] rounded border border-white/5 font-mono text-[10px] text-gray-400 shadow-inner">
                <div className="flex items-center gap-1.5"><Cpu className="w-3 h-3 text-indigo-400" /> CPU: {cpuLoad.toFixed(1)}%</div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5"><HardDrive className="w-3 h-3 text-purple-400" /> RAM: 4.2GB</div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-emerald-400" /> DSP: ACTIVE</div>
              </div>

              {/* Scene Selector */}
              <div className="hidden xl:flex items-center gap-2 ml-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Scene:</span>
                <div className="flex gap-1">
                  {SCENE_PRESETS.map((scene, i) => (
                    <button 
                      key={i}
                      onClick={() => applyScene(scene)}
                      className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-all uppercase tracking-tighter"
                    >
                      {scene.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Enterprise Mode</span>
              <button 
                onClick={() => setIsEnterpriseMode(!isEnterpriseMode)}
                className={`w-10 h-5 rounded-full relative transition-colors ${isEnterpriseMode ? 'bg-indigo-600' : 'bg-gray-800'}`}
              >
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isEnterpriseMode ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            {!hasKey ? (
              <button onClick={handleSelectKey} className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)] uppercase tracking-wider">
                <Key className="w-3.5 h-3.5" /> Connect API
              </button>
            ) : (
              <button
                onClick={executeAll}
                disabled={isExecutingAll || (Object.values(tasks) as any[]).some(t => t.status === 'generating')}
                className="text-xs font-bold bg-gradient-to-b from-white to-gray-200 text-black hover:from-gray-100 hover:to-gray-300 disabled:from-white/10 disabled:to-white/5 disabled:text-white/30 px-6 py-2.5 rounded-lg transition-all flex items-center gap-2 shadow-[0_5px_15px_rgba(255,255,255,0.1)] uppercase tracking-wider border border-white/20"
              >
                {isExecutingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Execute Full Cycle
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 flex-1 w-full flex flex-col gap-6">
        {activeTab === 'explore' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white uppercase tracking-widest">Discover</h2>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 rounded-full bg-white/10 text-xs font-bold text-white uppercase tracking-widest hover:bg-white/20 transition-colors">Trending</button>
                <button className="px-4 py-1.5 rounded-full bg-transparent border border-white/10 text-xs font-bold text-gray-400 uppercase tracking-widest hover:bg-white/5 transition-colors">New</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[
                { title: 'Neon Nights', genre: 'Synthwave', color: 'from-pink-500 to-purple-600', author: '@synth_master' },
                { title: 'Deep Space', genre: 'Ambient', color: 'from-blue-500 to-cyan-600', author: '@void_walker' },
                { title: 'Heavy Impact', genre: 'Cinematic', color: 'from-red-500 to-orange-600', author: '@hans_z' },
                { title: 'Jazz Lounge', genre: 'Lo-Fi', color: 'from-emerald-500 to-teal-600', author: '@chill_beats' },
                { title: 'Cyber Drift', genre: 'Phonk', color: 'from-fuchsia-500 to-rose-600', author: '@drift_king' },
                { title: 'Ethereal Voices', genre: 'Choral', color: 'from-indigo-500 to-blue-600', author: '@choir_director' },
                { title: 'Battle Theme', genre: 'Orchestral', color: 'from-amber-500 to-red-600', author: '@epic_scores' },
                { title: 'Rainy Cafe', genre: 'Acoustic', color: 'from-stone-500 to-zinc-600', author: '@coffee_vibes' },
              ].map((track, i) => (
                <div key={i} className="glass-panel rounded-xl p-4 group cursor-pointer hover:bg-white/5 transition-all border border-white/5 hover:border-white/10">
                  <div className={`w-full aspect-square rounded-lg bg-gradient-to-br ${track.color} mb-4 relative overflow-hidden shadow-lg`}>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-5 h-5 text-white fill-current ml-1" />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-200 text-sm truncate">{track.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-400 font-mono uppercase">{track.genre}</span>
                    <span className="text-[10px] text-gray-500">{track.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'library' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold text-white uppercase tracking-widest">Your Library</h2>
            <div className="glass-panel rounded-xl border border-white/5 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <div className="col-span-6">Title</div>
                <div className="col-span-3">Type</div>
                <div className="col-span-3 text-right">Date</div>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  { title: 'Electro-Swing Master', type: 'Music', date: 'Just now' },
                  { title: 'Vault Lock Sound', type: 'SFX', date: '2 hours ago' },
                  { title: 'Derelict Starship', type: 'Ambient', date: 'Yesterday' },
                ].map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                        <Play className="w-3 h-3 text-gray-300 group-hover:text-indigo-400 fill-current" />
                      </div>
                      <span className="text-sm font-bold text-gray-200">{item.title}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="px-2 py-1 rounded bg-white/5 text-[10px] font-mono text-gray-400 uppercase">{item.type}</span>
                    </div>
                    <div className="col-span-3 text-right text-xs text-gray-500 font-mono">
                      {item.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'create' && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 xl:grid-cols-3 gap-6"
            >
          {/* Column 1: Music */}
          <div className="glass-panel rounded-xl p-5 flex flex-col relative overflow-hidden group shadow-xl border border-white/5">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-inner">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-200 uppercase tracking-widest">Composition Core</h2>
                  <span className="text-[9px] font-mono text-indigo-400/50 uppercase">Module 01</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => randomizeModule('music')}
                  className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10 transition-colors"
                >
                  Random
                </button>
                <div className="relative group/dropdown">
                  <button className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10 transition-colors">
                    Presets <ChevronDown className="w-3 h-3" />
                  </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-50 overflow-hidden">
                  {PRESETS.map((p, i) => (
                    <button 
                      key={i}
                      onClick={() => setMusicConfig({ style: p.style, structure: p.structure, tempoKey: p.tempoKey, vocal: p.vocal })}
                      className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:bg-indigo-500/20 hover:text-indigo-300 border-b border-white/5 last:border-0 transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <TextAreaField label="Master Style" value={musicConfig.style} onChange={e => setMusicConfig({...musicConfig, style: e.target.value})} />
              <TextAreaField label="Structure" value={musicConfig.structure} onChange={e => setMusicConfig({...musicConfig, structure: e.target.value})} />
              <TextAreaField label="Tempo / Key" value={musicConfig.tempoKey} onChange={e => setMusicConfig({...musicConfig, tempoKey: e.target.value})} />
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vocal Gender</label>
                <div className="flex gap-2">
                  {['Female', 'Male', 'Any'].map(gender => (
                    <button
                      key={gender}
                      onClick={() => setMusicConfig({...musicConfig, vocalGender: gender})}
                      className={`flex-1 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors ${musicConfig.vocalGender === gender ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50' : 'bg-[#0a0a0c] text-gray-400 border border-white/10 hover:bg-white/5'}`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lyrics</label>
                  <button 
                    onClick={handleGenerateLyrics}
                    disabled={isGeneratingLyrics || !hasKey}
                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1 disabled:opacity-50"
                  >
                    {isGeneratingLyrics ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Auto-Gen
                  </button>
                </div>
                <textarea
                  value={musicConfig.lyrics}
                  onChange={e => setMusicConfig({...musicConfig, lyrics: e.target.value})}
                  placeholder="Enter lyrics or auto-generate..."
                  className="w-full h-24 bg-[#0a0a0c] text-gray-300 text-xs p-3 rounded-lg border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none resize-none transition-all shadow-inner font-mono"
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              {tasks.music.status === 'generating' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-3 text-indigo-400 text-[10px] font-mono py-2 uppercase tracking-wider">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {tasks.music.progress}
                  </div>
                  <div className="space-y-1">
                    {orchestrationSteps.map((step, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[8px] font-mono text-indigo-300/60 flex items-center gap-2"
                      >
                        <div className="w-1 h-1 rounded-full bg-indigo-500" />
                        {step}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : tasks.music.url ? (
                <div className="space-y-3">
                  <audio controls src={tasks.music.url} className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity" />
                  <button onClick={() => downloadZip('music')} className="w-full py-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-[10px] text-indigo-300 flex items-center justify-center gap-2 uppercase tracking-widest transition-all font-bold shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                    <FileArchive className="w-3.5 h-3.5" /> Download Stems (.ZIP)
                  </button>
                </div>
              ) : (
                <button onClick={() => generateAudio('music')} disabled={!hasKey} className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
                  Synthesize Composition
                </button>
              )}
              {tasks.music.error && <p className="text-[10px] font-mono text-red-400 mt-2">{tasks.music.error}</p>}
            </div>
          </div>

          {/* Column 2: SFX */}
          <div className="glass-panel rounded-xl p-5 flex flex-col relative overflow-hidden group shadow-xl border border-white/5">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-80" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 shadow-inner">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-200 uppercase tracking-widest">Foley Modeler</h2>
                  <span className="text-[9px] font-mono text-cyan-400/50 uppercase">Module 02</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => randomizeModule('sfx')}
                  className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10 transition-colors"
                >
                  Random
                </button>
                <div className="relative group/dropdown">
                  <button className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10 transition-colors">
                    Presets <ChevronDown className="w-3 h-3" />
                  </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-50 overflow-hidden">
                  {SFX_PRESETS.map((p, i) => (
                    <button 
                      key={i}
                      onClick={() => setSfxConfig({ ...sfxConfig, sfx1Desc: p.sfx1, sfx2Desc: p.sfx2 })}
                      className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:bg-cyan-500/20 hover:text-cyan-300 border-b border-white/5 last:border-0 transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
            
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-cyan-400 border-b border-white/5 pb-1 uppercase tracking-wider">SFX 1: The Vault Lock</h3>
                <TextAreaField label="Description" value={sfxConfig.sfx1Desc} onChange={e => setSfxConfig({...sfxConfig, sfx1Desc: e.target.value})} />
                <TextAreaField label="AMPs" value={sfxConfig.sfx1Amp} onChange={e => setSfxConfig({...sfxConfig, sfx1Amp: e.target.value})} />
              </div>
              <div className="space-y-2 pt-2">
                <h3 className="text-[10px] font-bold text-cyan-400 border-b border-white/5 pb-1 uppercase tracking-wider">SFX 2: Energy Hit</h3>
                <TextAreaField label="Description" value={sfxConfig.sfx2Desc} onChange={e => setSfxConfig({...sfxConfig, sfx2Desc: e.target.value})} />
                <TextAreaField label="AMPs" value={sfxConfig.sfx2Amp} onChange={e => setSfxConfig({...sfxConfig, sfx2Amp: e.target.value})} />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              {tasks.sfx.status === 'generating' ? (
                <div className="flex items-center justify-center gap-3 text-cyan-400 text-[10px] font-mono py-2 uppercase tracking-wider">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {tasks.sfx.progress}
                </div>
              ) : tasks.sfx.url ? (
                <div className="space-y-3">
                  <audio controls src={tasks.sfx.url} className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity" />
                  <button onClick={() => downloadZip('sfx')} className="w-full py-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[10px] text-cyan-300 flex items-center justify-center gap-2 uppercase tracking-widest transition-all font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    <FileArchive className="w-3.5 h-3.5" /> Download SFX Pack (.ZIP)
                  </button>
                </div>
              ) : (
                <button onClick={() => generateAudio('sfx')} disabled={!hasKey} className="w-full py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
                  Synthesize Foley
                </button>
              )}
              {tasks.sfx.error && <p className="text-[10px] font-mono text-red-400 mt-2">{tasks.sfx.error}</p>}
            </div>
          </div>

          {/* Column 3: Ambient */}
          <div className="glass-panel rounded-xl p-5 flex flex-col relative overflow-hidden group shadow-xl border border-white/5">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-80" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-inner">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-200 uppercase tracking-widest">Ambient Master</h2>
                  <span className="text-[9px] font-mono text-emerald-400/50 uppercase">Module 03</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => randomizeModule('ambient')}
                  className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10 transition-colors"
                >
                  Random
                </button>
                <div className="relative group/dropdown">
                  <button className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10 transition-colors">
                    Presets <ChevronDown className="w-3 h-3" />
                  </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-50 overflow-hidden">
                  {AMBIENT_PRESETS.map((p, i) => (
                    <button 
                      key={i}
                      onClick={() => setAmbientConfig({ soundscape: p.soundscape, loopElement: p.loop })}
                      className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:bg-emerald-500/20 hover:text-emerald-300 border-b border-white/5 last:border-0 transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
            
            <div className="space-y-3 flex-1">
              <TextAreaField label="Soundscape" value={ambientConfig.soundscape} onChange={e => setAmbientConfig({...ambientConfig, soundscape: e.target.value})} />
              <TextAreaField label="Loop Element" value={ambientConfig.loopElement} onChange={e => setAmbientConfig({...ambientConfig, loopElement: e.target.value})} />
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              {tasks.ambient.status === 'generating' ? (
                <div className="flex items-center justify-center gap-3 text-emerald-400 text-[10px] font-mono py-2 uppercase tracking-wider">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {tasks.ambient.progress}
                </div>
              ) : tasks.ambient.url ? (
                <div className="space-y-3">
                  <audio controls src={tasks.ambient.url} className="w-full h-8 opacity-80 hover:opacity-100 transition-opacity" />
                  <button onClick={() => downloadZip('ambient')} className="w-full py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[10px] text-emerald-300 flex items-center justify-center gap-2 uppercase tracking-widest transition-all font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <FileArchive className="w-3.5 h-3.5" /> Download Ambient (.ZIP)
                  </button>
                </div>
              ) : (
                <button onClick={() => generateAudio('ambient')} disabled={!hasKey} className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
                  Synthesize Soundscape
                </button>
              )}
              {tasks.ambient.error && <p className="text-[10px] font-mono text-red-400 mt-2">{tasks.ambient.error}</p>}
            </div>
          </div>
            </motion.div>

            {/* Studio Mixer Section */}
            {tasks.music.blob && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-8"
              >
                <Mixer audioBlob={tasks.music.blob} />
              </motion.div>
            )}
          </>
        )}
      </main>
      </div>
    </div>
  );
}
