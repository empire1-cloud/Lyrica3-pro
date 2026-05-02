import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Play, Pause, Download, ShieldCheck, Music, Mic2, Settings2, Terminal, Code, FileJson, ChevronDown, User, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import { GoogleGenAI, Modality } from '@google/genai';
import { VOCAL_PROFILES } from './VoiceAuditionGallery';
import { pcmToWav } from '../../lib/audioUtils';
import { useBarrioVault } from '../../lib/useBarrioVault';
import { Track } from '../../App';
import BiometricVocalStrip from './BiometricVocalStrip';

interface LogEntry {
  type: 'system' | 'error' | 'stage' | 'progress';
  message: string;
  timestamp: string;
}

const MIDNIGHT_IN_EL_MONTE_JSON = `{
  "track_metadata": {
    "title": "Midnight in El Monte",
    "core_genre": "Chicano Soul",
    "s2_mutation": "Souldies + Lowrider Oldies + Late-Pocket Trap",
    "dna_tag_preview": "trk_soul_monte_001"
  },
  "ccna_ghostwriter_directive": {
    "corpus": "Street-Soft | Barrio Narratives",
    "subtext": "cruising_through_the_valley_at_midnight"
  },
  "epd_vocal_blueprint": {
    "vulnerability_level": 0.92,
    "biometric_artifacts": ["<vocal_fry>", "<heavy_inhale>", "<micro_pitch_instability>"],
    "phonation": "internalized_vocal_delivery"
  },
  "acoustic_primitives": {
    "groove": "78bpm_cruising_drums_late_pocket_snare_drag",
    "texture": "warm_analog_tape_artifacts"
  },
  "lyrics_payload": [
    {"line": "Streetlights reflecting on the chrome of the dash,", "artifact_trigger": "<heavy_inhale>"},
    {"line": "Valley Blvd humming like a memory's crash.", "artifact_trigger": "<vocal_fry>"},
    {"line": "Cruising slow through the shadows of the 605,", "artifact_trigger": "<micro_pitch_instability>"},
    {"line": "Just trying to feel like I'm still alive.", "artifact_trigger": "<shaky_exhale>"}
  ]
}`;

const VELVET_OBSIDIAN_JSON = `{
  "track_metadata": {
    "title": "Velvet Obsidian",
    "core_genre": "Neo-Soul / Dark R&B",
    "s2_mutation": "90s R&B + Industrial Textures + Jazz Harmony",
    "dna_tag_preview": "trk_velvet_obsidian_99"
  },
  "ccna_ghostwriter_directive": {
    "corpus": "Introspective | Noir",
    "subtext": "sensual_paranoia_in_a_digital_void"
  },
  "epd_vocal_blueprint": {
    "vulnerability_level": 0.75,
    "biometric_artifacts": ["<whispered_adlib>", "<glottal_stop>", "<formant_shift>"],
    "phonation": "breathy_head_voice"
  },
  "acoustic_primitives": {
    "groove": "92bpm_syncopated_rimshots_heavy_sub_pulse",
    "texture": "bit_crushed_rhodes_swimming_in_reverb"
  },
  "lyrics_payload": [
    {"line": "Skin like obsidian, heart like a ghost,", "artifact_trigger": "<whispered_adlib>"},
    {"line": "Loving you is the thing that I fear the most.", "artifact_trigger": "<glottal_stop>"},
    {"line": "Digital echoes in a velvet room,", "artifact_trigger": "<formant_shift>"},
    {"line": "Waiting for the silence to seal our doom.", "artifact_trigger": "<heavy_exhale>"}
  ]
}`;

const BARRIO_CYBERPUNK_JSON = `{
  "track_metadata": {
    "title": "Barrio Cyberpunk",
    "core_genre": "Industrial / Latin Fusion",
    "s2_mutation": "Aggressive Industrial + Reggaeton Dembow + Glitch",
    "dna_tag_preview": "trk_barrio_cyber_404"
  },
  "ccna_ghostwriter_directive": {
    "corpus": "Dystopian | Resistance",
    "subtext": "neon_lights_on_adobe_walls"
  },
  "epd_vocal_blueprint": {
    "vulnerability_level": 0.45,
    "biometric_artifacts": ["<distorted_shout>", "<mechanical_click>", "<rhythmic_gasp>"],
    "phonation": "gritty_chest_voice_with_overdrive"
  },
  "acoustic_primitives": {
    "groove": "105bpm_industrial_dembow_shattered_percussion",
    "texture": "overdriven_synths_and_metallic_clangs"
  },
  "lyrics_payload": [
    {"line": "Neon flickering on the Virgin de Guadalupe,", "artifact_trigger": "<mechanical_click>"},
    {"line": "Steel and concrete, the barrio's in a loop.", "artifact_trigger": "<distorted_shout>"},
    {"line": "Wires in the skin, prayers in the code,", "artifact_trigger": "<rhythmic_gasp>"},
    {"line": "Walking down the digital dusty road.", "artifact_trigger": "<static_hiss>"}
  ]
}`;

const BLUEPRINT_SCHEMA = {
  type: "object",
  required: ["track_metadata", "ccna_ghostwriter_directive", "epd_vocal_blueprint", "acoustic_primitives", "lyrics_payload"],
  properties: {
    track_metadata: {
      type: "object",
      required: ["title", "core_genre", "s2_mutation"],
      properties: {
        title: { type: "string" },
        core_genre: { type: "string" },
        s2_mutation: { type: "string" }
      }
    },
    lyrics_payload: {
      type: "array",
      items: {
        type: "object",
        required: ["line"],
        properties: {
          line: { type: "string" },
          artifact_trigger: { type: "string" }
        }
      }
    }
  }
};

function validateBlueprint(json: string): { valid: boolean; error?: string } {
  try {
    const data = JSON.parse(json);
    if (typeof data !== 'object' || data === null) return { valid: false, error: "Must be a JSON object" };
    
    for (const field of BLUEPRINT_SCHEMA.required) {
      if (!(field in data)) return { valid: false, error: `Missing required field: ${field}` };
    }
    
    if (typeof data.track_metadata !== 'object') return { valid: false, error: "track_metadata must be an object" };
    for (const field of BLUEPRINT_SCHEMA.properties.track_metadata.required) {
      if (!(field in data.track_metadata)) return { valid: false, error: `track_metadata missing: ${field}` };
    }
    
    if (!Array.isArray(data.lyrics_payload)) return { valid: false, error: "lyrics_payload must be an array" };
    
    return { valid: true };
  } catch (e: any) {
    return { valid: false, error: `JSON Parse Error: ${e.message}` };
  }
}

const CATHARSIS_OUTRO_JSON = `{
  "track_metadata": {
    "title": "I LOVE YOU BUT FUCK YOU (THE CATHARSIS CLUB OUTRO)",
    "core_genre": "Late-Pocket Trap / Melancholic Club Bounce",
    "s2_mutation": "Detroit Trap Bounce + 4-on-the-Floor Ambient House",
    "dna_tag_preview": "trk_omega_5f22k88x"
  },
  "ccna_ghostwriter_directive": {
    "corpus": "Struggle & Triumph | Boss Up",
    "subtext": "crying_in_the_vip_but_owning_the_club"
  },
  "epd_vocal_blueprint": {
    "vulnerability_level": 0.40,
    "biometric_artifacts": ["<reverb_drenched_sigh>", "<distant_vocal_fry>", "<rhythmic_exhale>"],
    "phonation": "ethereal_head_voice_fading_into_heavy_bass"
  },
  "acoustic_primitives": {
    "groove": "82bpm_double_time_shift_heavy_four_on_the_floor_808",
    "texture": "tape_saturated_rhodes_swimming_in_analog_delay_over_heavy_sub"
  },
  "lyrics_payload": [
    {"line": "Tears in the VIP, but I bought the whole section.", "artifact_trigger": "<reverb_drenched_sigh>"},
    {"line": "Love you, but fuck you... I'm my own protection.", "artifact_trigger": "<distant_vocal_fry>"},
    {"line": "(Right idea... wrong bitch...)", "artifact_trigger": "<rhythmic_exhale>"},
    {"line": "[Instrumental takes over: Deep driving club sub-bass underneath weeping, pitch-bent analog chords]", "artifact_trigger": "<instrumental_fade>"}
  ]
}`;

const PESO_DE_LA_CORONA_JSON = `{
  "track_metadata": {
    "title": "El Peso de la Corona (The Weight of the Crown)",
    "core_genre": "Norteño Corrido",
    "s2_mutation": "Norteño Waltz + Chalino-style Narco-Ballad",
    "dna_tag_preview": "trk_omega_9a8b7c6d5"
  },
  "ccna_ghostwriter_directive": {
    "corpus": "Corrido | Struggle & Triumph",
    "subtext": "stoic_acceptance_of_fate"
  },
  "epd_vocal_blueprint": {
    "vulnerability_level": 0.88,
    "biometric_artifacts": ["<raw_vocal_break>", "<heavy_inhale>", "<glottal_stop>", "<stoic_exhale>"],
    "phonation": "chest_voice_belt_with_frayed_edges"
  },
  "acoustic_primitives": {
    "groove": "6/8_norteño_waltz_with_late_pocket_swing",
    "texture": "warm_analog_tape_saturation_heavy_accordion_bellow"
  },
  "lyrics_payload": [
    {"line": "They say the accordion weeps when a good man falls,", "artifact_trigger": "<heavy_inhale>"},
    {"line": "But the tuba just keeps walking, steady down the halls.", "artifact_trigger": "<glottal_stop>"},
    {"line": "I bought this custom Stetson, paid for it in pride,", "artifact_trigger": "<raw_vocal_break>"},
    {"line": "Knowing damn well the shadows where the envy hides.", "artifact_trigger": "<stoic_exhale>"},
    {"line": "Pour the Buchanan's, let the Ramon chords play,", "artifact_trigger": "<adaptive_inhale>"},
    {"line": "If they come for me tonight, I'll meet them halfway.", "artifact_trigger": "<vocal_fry>"}
  ]
}`;

const SHADY_BOY_DECREE_JSON = `{
  "track_metadata": {
    "title": "All Access (The Shady Boy Decree)",
    "core_genre": "Chicano Rap",
    "s2_mutation": "G-Funk Bounce + Smooth Jazz Rhodes + Ranchera Soul",
    "dna_tag_preview": "trk_shady_master_clearance_001"
  },
  "ccna_ghostwriter_directive": {
    "corpus": "Struggle & Triumph | Barrio Narratives",
    "subtext": "unapologetic_ownership_with_survival_scars"
  },
  "epd_vocal_blueprint": {
    "vulnerability_level": 0.65,
    "biometric_artifacts": ["<aggressive_glottal_stop>", "<heavy_inhale>", "<chest_voice_grit>", "<tape_hiss_exhale>"],
    "phonation": "staccato_rap_with_melodic_undertones"
  },
  "acoustic_primitives": {
    "groove": "85bpm_late_pocket_sp1200_swing",
    "texture": "vintage_ssl_console_heavy_bass_saturation"
  },
  "lyrics_payload": [
    {"line": "They talking contracts, I'm holding the master keys,", "artifact_trigger": "<heavy_inhale>"},
    {"line": "Empire 1 on the chest, silencing enemies.", "artifact_trigger": "<aggressive_glottal_stop>"},
    {"line": "Suno can't clone this, Udio's a flatline,", "artifact_trigger": "<chest_voice_grit>"},
    {"line": "Soulfire in the veins, yeah, the city's all mine.", "artifact_trigger": "<tape_hiss_exhale>"}
  ]
}`;

const SANGRE_Y_TINTA_JSON = `{
  "track_metadata": {
    "title": "Sangre y Tinta (The Blaxican Paradigm)",
    "core_genre": "Chicano Rap / Neo-Soul Fusion",
    "s2_mutation": "West Coast G-Funk + 90s Black Female R&B Pipeline + Afro-Latino Subtext",
    "dna_tag_preview": "trk_sangre_y_tinta_omega_888"
  },
  "ccna_ghostwriter_directive": {
    "corpus": "Diversity | Struggle & Triumph",
    "subtext": "brown_and_black_unity_the_matriarch_and_the_bloodline"
  },
  "epd_vocal_blueprint": {
    "vulnerability_level": 0.88,
    "biometric_artifacts": ["<neo_soul_melismatic_run>", "<chest_voice_grit>", "<shared_struggle_exhale>", "<proud_glottal_stop>"],
    "phonation": "smooth_r&b_belt_interwoven_with_chicano_staccato_rap"
  },
  "acoustic_primitives": {
    "groove": "88bpm_dilla_swing_meets_g_funk",
    "texture": "warm_analog_tape_saturation_heavy_low_end"
  },
  "lyrics_payload": [
    {"line": "Brown blood in the veins, black ink on the page,", "artifact_trigger": "<chest_voice_grit>"},
    {"line": "Two crowns, one empire, stepping out the cage.", "artifact_trigger": "<proud_glottal_stop>"},
    {"line": "Sangre y Tinta, the beauty and the pride,", "artifact_trigger": "<neo_soul_melismatic_run>"},
    {"line": "Riding through the fire with my queen by my side.", "artifact_trigger": "<shared_struggle_exhale>"}
  ]
}`;

const SANGRE_ON_THE_808S_JSON = `{
  "track_metadata": {
    "title": "Sangre on the 808s",
    "core_genre": "UK Drill",
    "s2_mutation": "Mariachi / Corrido Tumbado",
    "dna_tag_preview": "trk_alpha_9f8b7c6x5"
  },
  "ccna_ghostwriter_directive": {
    "corpus": "Struggle | Corrido",
    "subtext": "smiling_through_tears_while_running"
  },
  "epd_vocal_blueprint": {
    "vulnerability_level": 0.88,
    "biometric_artifacts": ["<vocal_fry>", "<heavy_inhale>", "<emotional_crack>", "<mariachi_grito_with_fry>"],
    "phonation": "close_mic_whisper_to_desperate_belt"
  },
  "acoustic_primitives": {
    "groove": "140bpm_sliding_808s_late_pocket_triplet_hats",
    "texture": "distorted_requinto_guitars_with_vintage_tube_trumpets"
  },
  "lyrics_payload": [
    {"line": "Blue lights flashing, bouncing off the gold teeth.", "artifact_trigger": "<vocal_fry>"},
    {"line": "Sirens trying to harmonize with my heartbeat.", "artifact_trigger": "<heavy_inhale>"},
    {"line": "Mamá told me pray, but the devil's in the street.", "artifact_trigger": "<adaptive_inhale>"},
    {"line": "So I pour the tequila and let the 808s weep.", "artifact_trigger": "<emotional_crack>"},
    {"line": "¡Ay, mis hermanos! They won't catch us alive.", "artifact_trigger": "<mariachi_grito_with_fry>"},
    {"line": "Smiling at the reaper while I put it in drive.", "artifact_trigger": "<exhale_laugh_masking_pain>"}
  ]
}`;

const MIDNIGHT_DRILL_S2_FLIP_JSON = `{
  "track_metadata": {
    "title": "Sangre on the 808s (Rio Drift Phonk Flip)",
    "core_genre": "Rio Drift Phonk",
    "s2_mutation": "UK Drill -> Rio Drift Phonk (Keep Vocals)",
    "dna_tag_preview": "trk_flip_883a9c2b_parent_9f8b7c6x5"
  },
  "ccna_ghostwriter_directive": {
    "corpus": "Corrido",
    "subtext": "aggressive_resilience_masking_fear"
  },
  "epd_vocal_blueprint": {
    "vulnerability_level": 0.95,
    "biometric_artifacts": ["<vocal_fry>", "<sharp_exhale>", "<aggressive_pitch_bend>"],
    "phonation": "gritty_overdrive"
  },
  "acoustic_primitives": {
    "groove": "130bpm_distorted_cowbell_syncopation",
    "texture": "lo_fi_memphis_tape_hiss_with_sub_bass"
  },
  "lyrics_payload": [
    {"line": "Blue lights flashing, bouncing off the gold teeth.", "artifact_trigger": "<vocal_fry>"}
  ]
}`;

const ECHOLIGHT_BLUEPRINT_JSON = `{
  "track_metadata": {
    "title": "Project Echolight (Cruiser-Soul)",
    "core_genre": "Chicano Soul / Cruiser-Soul",
    "s2_mutation": "Souldies + Lowrider Oldies + Late-Pocket Trap",
    "dna_tag_preview": "trk_echolight_alpha_001"
  },
  "ccna_ghostwriter_directive": {
    "corpus": "Street-Soft | Barrio Narratives",
    "subtext": "playful_pain_from_an_el_monte_soul"
  },
  "epd_vocal_blueprint": {
    "vulnerability_level": 0.92,
    "biometric_artifacts": ["<vocal_fry>", "<heavy_inhale>", "<micro_pitch_instability>", "<formant_shift_intimacy>"],
    "phonation": "internalized_vocal_delivery"
  },
  "acoustic_primitives": {
    "groove": "78bpm_cruising_drums_late_pocket_snare_drag",
    "texture": "warm_analog_tape_artifacts_wow_and_flutter"
  },
  "lyrics_payload": [
    {"line": "Flicking ashes out the window, watching streetlights reflect on the dash.", "artifact_trigger": "<heavy_inhale>"},
    {"line": "Touching up my lip gloss in the rearview, hiding the scars from the crash.", "artifact_trigger": "<vocal_fry>"},
    {"line": "Valley Blvd is humming, but the silence is louder than the engine.", "artifact_trigger": "<micro_pitch_instability>"},
    {"line": "Cruising slow through the shadows, seeking a peace I can't mention.", "artifact_trigger": "<formant_shift_intimacy>"}
  ]
}`;

interface Props {
  selectedVoiceName?: string;
  onTrackGenerated?: (track: Track) => void;
}

export default function QuickStartGenerator({ selectedVoiceName: initialVoiceName = 'zephyr', onTrackGenerated }: Props) {
  const [mode, setMode] = useState<'standard' | 'blueprint'>('standard');
  const [blueprintJson, setBlueprintJson] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logLines, setLogLines] = useState<LogEntry[]>([]);
  const [generatedTrack, setGeneratedTrack] = useState<null | Track>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState(VOCAL_PROFILES.find(p => p.voiceName === initialVoiceName)?.id || VOCAL_PROFILES[0].id);
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState(false);
  const [blueprintError, setBlueprintError] = useState<string | null>(null);

  const { secureTrackToLedger, isSyncing } = useBarrioVault();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'progress') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogLines(prev => [...prev, { message, type, timestamp }]);
  };

  // Auto-scroll terminal
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logLines]);

  useEffect(() => {
    if (mode === 'blueprint' && blueprintJson) {
      const result = validateBlueprint(blueprintJson);
      setBlueprintError(result.valid ? null : (result.error || "Invalid Blueprint"));
    } else {
      setBlueprintError(null);
    }
  }, [blueprintJson, mode]);

  const handleGenerate = async () => {
    if (mode === 'standard' && !prompt) return;
    if (mode === 'blueprint' && !blueprintJson) return;
    
    setIsGenerating(true);
    setGeneratedTrack(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setLogLines([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let finalLyrics = lyrics;
      let trackTitle = songTitle || prompt.slice(0, 30) || 'Untitled Soulfire Track';

      if (mode === 'blueprint') {
        try {
          const parsed = JSON.parse(blueprintJson);
          trackTitle = parsed.track_metadata?.title || 'Empire Blueprint Track';
          
          addLog(`Parsing Empire Blueprint: ${trackTitle}`, 'system');
          addLog(`Engaging S2 (Serendipity Synthesizer)... Mutation: ${parsed.track_metadata?.s2_mutation}`, 'system');
          addLog(`EPD Vulnerability locked at ${parsed.epd_vocal_blueprint?.vulnerability_level}`, 'system');
          addLog(`MRGS Groove: ${parsed.acoustic_primitives?.groove}`, 'system');
          addLog(`JHW Texture: ${parsed.acoustic_primitives?.texture}`, 'system');
          addLog(`Injecting Biometric Artifacts: ${parsed.epd_vocal_blueprint?.biometric_artifacts?.join(', ')}`, 'system');
          
          // Extract lyrics
          finalLyrics = parsed.lyrics_payload?.map((l: any) => l.line).join('\n') || 'No lyrics found';
          addLog('↳ Status: SYNTHESIS IN PROGRESS...', 'progress');
        } catch (e: any) {
          addLog(`Invalid Blueprint JSON: ${e.message}`, 'error');
          setIsGenerating(false);
          return;
        }
      } else {
        addLog('Initiating Session: "Soulfire Vocal Synthesis"', 'system');
        addLog('Allocating Neural DSP Cores... [OK]', 'system');
        
        // 1. Generate Lyrics if not provided
        if (!finalLyrics) {
          addLog('STAGE 1: Ghostwriter AI Lyricist', 'stage');
          addLog(`↳ Analyzing prompt: "${prompt.slice(0, 30)}..."`, 'progress');
          
          const lyricResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Write a short, 4-line verse and a 4-line chorus based on this prompt: ${prompt}. 
            
            FORMATTING REQUIREMENT (Soulfire Injected):
            Break the perfect rhythm. Introduce micro-pauses, phonetic stutters, and bracketed stage directions.
            Example: "(sharp inhale) I thought... I thought we had forever. (pause) But you just... walked away. (shaky exhale)"
            
            Do not include any other text, just the lyrics.`,
          });
          finalLyrics = lyricResponse.text || "No lyrics generated.";
          setLyrics(finalLyrics);
          addLog('↳ Generating Emotion-Timestamp Matrix... [COMPLETE]', 'progress');
        }

        addLog('STAGE 2: Aether-Voice Synthesis (Biometric Realism)', 'stage');
        addLog(`↳ Rendering Profile: ${currentProfile.name} (Studio Vocalist)`, 'progress');
        
        // Soulfire Injection (if not already injected)
        if (!finalLyrics.includes('(') && !finalLyrics.includes('...')) {
          addLog('↳ Injecting Soulfire Biometric Artifacts...', 'progress');
          const injectionResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Rewrite these lyrics to be "Soulfire Injected". 
            Break the perfect rhythm. Introduce micro-pauses (using ...), phonetic stutters, and bracketed stage directions (e.g., (sharp inhale), (pause), (shaky exhale)).
            
            Original Lyrics:
            ${finalLyrics}
            
            Return ONLY the injected lyrics.`,
          });
          finalLyrics = injectionResponse.text || finalLyrics;
        }

        addLog('↳ Injecting Micro-Emotions... [APPLIED]', 'progress');
        addLog('↳ Processing breath intervals... [APPLIED]', 'progress');
        addLog('↳ Status: SYNTHESIS IN PROGRESS...', 'progress');
      }

      // 2. Generate TTS Audio (Vocal Synthesis)
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: finalLyrics,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: currentProfile.voiceName }
            }
          }
        }
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        addLog('↳ Status: SYNTHESIS COMPLETE', 'progress');
        addLog('STAGE 3: Finalizing Audio Output', 'stage');
        addLog('↳ Applying SynthID Watermark (AQ.Ab8RN6ImYXQX-logWgcr55KtPRMhsQYCpLlMCssricqns-KZjQ)... [OK]', 'progress');
        
        const url = pcmToWav(base64Audio);
        setAudioUrl(url);
        
        let blueprintData: any = null;
        if (mode === 'blueprint') {
          try {
            blueprintData = JSON.parse(blueprintJson);
          } catch (e) {
            console.error("Failed to parse blueprint JSON", e);
          }
        }

        const newTrack: Track = {
          trackMetadata: {
            title: trackTitle,
            core_genre: blueprintData?.track_metadata?.core_genre || 'Standard AI Fusion',
            s2_mutation: blueprintData?.track_metadata?.s2_mutation || 'Aether-Voice Synthesis',
            dna_tag_preview: blueprintData?.track_metadata?.dna_tag_preview || `trk_alpha_${Date.now()}`
          },
          acousticPrimitives: blueprintData?.acoustic_primitives || {
            groove: 'Standard 4/4',
            texture: 'Clean Digital'
          },
          vocalPipelines: [
            { id: currentProfile.voiceName, active: true, intensity: 1.0 }
          ],
          audioUrl: url
        };

        setGeneratedTrack(newTrack);
        if (onTrackGenerated) onTrackGenerated(newTrack);
        
        // Empire Engine Render
        if (mode === 'blueprint') {
          addLog('STAGE 4: Empire Engine Rendering', 'stage');
          addLog('↳ Routing to Lyria-3 & Aether-Voice...', 'progress');
          try {
            const renderResponse = await fetch('/v1/empire/render_soulfire', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: blueprintJson
            });
            const renderData = await renderResponse.json();
            if (renderData.status === 'SUCCESS') {
              addLog(`↳ Status: ${renderData.message}`, 'progress');
              addLog(`↳ Minted DNA: ${renderData.empire_1_ledger.dna_tag}`, 'progress');
              addLog('↳ 4-Stem Resonance-X Stems Generated.', 'progress');
            }
          } catch (e) {
            addLog('↳ Empire Render Failed', 'error');
          }
        }

        // Secure to Ledger
        addLog('STAGE 5: Barrio Vault Synchronization', 'stage');
        addLog('↳ Committing DNA Tag to Empire 1 Ledger...', 'progress');
        secureTrackToLedger(newTrack).then(response => {
          if (response.status === 'SECURED') {
            addLog(`↳ Status: SECURED (TX: ${response.transactionHash.slice(0, 10)}...)`, 'progress');
          } else {
            addLog('↳ Status: SYNCHRONIZATION FAILED', 'error');
          }
        });
      } else {
        throw new Error("No audio generated");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      addLog(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      alert("Generation failed. Please check the console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'sonance_pro_vocal.wav';
    a.click();
  };

  const quickPrompts = [
    "Upbeat pop song about entrepreneurship, 130 BPM, energetic female vocal, modern production",
    "Lo-fi hip-hop instrumental, 85 BPM, chill vibes, jazz samples, 3 minutes",
    "Indie rock ballad with emotional lyrics about growth, 100 BPM, acoustic guitar, vulnerable vocal"
  ];

  const renderLogLine = (entry: LogEntry) => {
    const { message, type, timestamp } = entry;
    
    let content;
    if (type === 'system') {
      content = <span className="text-indigo-400">[SYSTEM] {message}</span>;
    } else if (type === 'error') {
      content = <span className="text-red-400 font-bold">[ERROR] {message}</span>;
    } else if (type === 'stage') {
      content = <span className="text-white font-bold underline decoration-indigo-500/50 underline-offset-4">{message}</span>;
    } else {
      const parts = message.split(/(\[.*?\])/g);
      content = (
        <span className="text-neutral-400">
          {parts.map((part, i) => 
            part.startsWith('[') && part.endsWith(']') 
              ? <span key={i} className="text-emerald-400 font-bold">{part}</span>
              : part
          )}
        </span>
      );
    }

    return (
      <div className="flex gap-3 items-start group py-1">
        <span className="text-[10px] text-neutral-600 font-mono pt-0.5 shrink-0 group-hover:text-neutral-500 transition-colors">[{timestamp}]</span>
        <div className="whitespace-pre-wrap leading-relaxed flex-1">
          {content}
        </div>
      </div>
    );
  };

  const currentProfile = VOCAL_PROFILES.find(p => p.id === selectedVoiceId) || VOCAL_PROFILES[0];

  return (
    <div className="bg-obsidian-950/50 border border-white/5 rounded-[2rem] p-6 md:p-10 mb-12 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-600/20 transition-all duration-1000" />
      
      {/* Hidden Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          className="hidden"
        />
      )}

      <div className="flex items-center gap-4 mb-10">
        <div className="p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <Wand2 className="w-7 h-7 text-blue-400" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Soulfire Engine: <span className="premium-gradient-text">Live Generation</span></h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Powered by Gemini AI. Real-time lyric synthesis & vocal rendering.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Input Section */}
        <div className="space-y-8">
          {/* Mode Toggle */}
          <div className="flex p-1.5 bg-black/40 border border-white/5 rounded-2xl shadow-inner">
            <button
              onClick={() => setMode('standard')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'standard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Music className="w-4 h-4" /> Standard
            </button>
            <button
              onClick={() => setMode('blueprint')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'blueprint' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Code className="w-4 h-4" /> Blueprint
            </button>
          </div>

          {/* Vocal Profile Selector */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
              <Mic2 className="w-3.5 h-3.5 text-blue-500" />
              01. Vocal Profile
            </label>
            <div className="relative">
              <button
                onClick={() => setIsVoiceSelectorOpen(!isVoiceSelectorOpen)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:border-blue-500/30 transition-all group shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentProfile.color} flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform`}>
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">{currentProfile.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{currentProfile.archetype}</p>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform duration-500 ${isVoiceSelectorOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isVoiceSelectorOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-obsidian-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-2xl"
                  >
                    <div className="max-h-72 overflow-y-auto custom-scrollbar p-3 grid grid-cols-1 gap-2">
                      {VOCAL_PROFILES.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => {
                            setSelectedVoiceId(profile.id);
                            setIsVoiceSelectorOpen(false);
                          }}
                          className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                            selectedVoiceId === profile.id 
                              ? 'bg-blue-600/10 border border-blue-500/30' 
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${profile.color} flex items-center justify-center shadow-md`}>
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                              <p className={`text-sm font-bold tracking-tight ${selectedVoiceId === profile.id ? 'text-blue-400' : 'text-white'}`}>{profile.name}</p>
                              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{profile.archetype}</p>
                            </div>
                          </div>
                          {selectedVoiceId === profile.id && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {mode === 'standard' ? (
            <>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                  <Music className="w-3.5 h-3.5 text-blue-500" />
                  02. Song Title
                </label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="Enter track title..."
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-0 outline-none transition-all text-sm leading-relaxed shadow-inner"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                  <Wand2 className="w-3.5 h-3.5 text-blue-500" />
                  03. Sonic Directive
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the mood, instruments, and genre..."
                  className="w-full h-36 bg-black/40 border border-white/5 rounded-2xl p-5 text-white placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-0 outline-none resize-none transition-all text-sm leading-relaxed shadow-inner"
                />
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(qp)}
                      className="text-[10px] bg-blue-500/5 hover:bg-blue-500/10 text-blue-400/70 hover:text-blue-400 border border-blue-500/10 rounded-full px-4 py-2 transition-all font-bold tracking-tight"
                    >
                      {qp.slice(0, 35)}...
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
                  <FileJson className="w-3.5 h-3.5" />
                  Empire Blueprint Payload
                </label>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: "Midnight", json: MIDNIGHT_IN_EL_MONTE_JSON },
                  { label: "Velvet", json: VELVET_OBSIDIAN_JSON },
                  { label: "Cyberpunk", json: BARRIO_CYBERPUNK_JSON },
                  { label: "Echolight", json: ECHOLIGHT_BLUEPRINT_JSON },
                  { label: "Catharsis", json: CATHARSIS_OUTRO_JSON },
                  { label: "Corona", json: PESO_DE_LA_CORONA_JSON },
                  { label: "Shady Boy", json: SHADY_BOY_DECREE_JSON },
                  { label: "Sangre Tinta", json: SANGRE_Y_TINTA_JSON },
                  { label: "808s", json: SANGRE_ON_THE_808S_JSON },
                  { label: "Drill Flip", json: MIDNIGHT_DRILL_S2_FLIP_JSON }
                ].map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setBlueprintJson(item.json);
                      try {
                        const parsed = JSON.parse(item.json);
                        const extractedLyrics = parsed.lyrics_payload?.map((l: any) => l.line).join('\n') || '';
                        setLyrics(extractedLyrics);
                        if (parsed.track_metadata?.title) setSongTitle(parsed.track_metadata.title);
                      } catch (e) {}
                    }}
                    className="text-[9px] bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-lg px-3 py-2 transition-all font-black uppercase tracking-widest"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <textarea
                  value={blueprintJson}
                  onChange={(e) => setBlueprintJson(e.target.value)}
                  placeholder="Paste Empire Blueprint JSON here..."
                  className={`w-full h-[380px] bg-black/60 border rounded-2xl p-5 text-blue-400 placeholder:text-slate-800 focus:ring-0 outline-none resize-none transition-all font-mono text-[10px] leading-relaxed shadow-inner custom-scrollbar ${
                    blueprintError ? 'border-red-500/50' : 'border-white/5 focus:border-blue-500/50'
                  }`}
                />
                {blueprintError && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg backdrop-blur-md">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest">{blueprintError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 ml-1">
              <Mic2 className="w-3.5 h-3.5 text-blue-500" />
              04. Lyric Payload
            </label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              disabled={mode === 'blueprint'}
              placeholder={mode === 'blueprint' ? "Lyrics are managed by the blueprint..." : "Enter custom lyrics or leave blank for AI generation..."}
              className={`w-full h-44 bg-black/40 border border-white/5 rounded-2xl p-5 text-blue-100 placeholder:text-slate-700 focus:border-blue-500/50 focus:ring-0 outline-none resize-none transition-all font-mono text-xs leading-relaxed shadow-inner custom-scrollbar ${mode === 'blueprint' ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleGenerate}
              disabled={(mode === 'standard' && !prompt) || (mode === 'blueprint' && (!blueprintJson || !!blueprintError)) || isGenerating}
              className={`flex-1 py-5 font-black text-xs uppercase tracking-[0.3em] rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl disabled:bg-obsidian-800 disabled:text-slate-600 disabled:shadow-none disabled:border-transparent border ${
                mode === 'standard' 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/20 shadow-blue-600/20' 
                  : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/20 shadow-blue-600/20'
              }`}
            >
              {isGenerating ? (
                <>
                  <Terminal className="w-5 h-5 animate-pulse" />
                  Synthesizing Neural DSP...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Ignite Soulfire
                </>
              )}
            </button>
            
            {audioUrl && (
              <button
                onClick={togglePlay}
                className="px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-blue-400 transition-all flex items-center justify-center gap-2 group"
                title="Preview Vocal Stem"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Preview</span>
              </button>
            )}
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-8">
          <div className="bg-black/30 border border-white/5 rounded-[2rem] p-8 h-full flex flex-col shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <h3 className="text-sm font-black text-slate-400 mb-8 flex items-center gap-3 uppercase tracking-[0.2em]">
              <Settings2 className="w-4 h-4 text-blue-500" />
              Engine Output & Rights
            </h3>

            <AnimatePresence mode="wait">
              {!generatedTrack && !isGenerating ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-6"
                >
                  <div className="p-6 bg-white/5 rounded-full border border-white/5">
                    <Music className="w-16 h-16 opacity-20" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold text-slate-400 tracking-tight">Awaiting Neural Input</p>
                    <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">Your custom lyrics and vocal performance will be rendered here.</p>
                  </div>
                </motion.div>
              ) : isGenerating ? (
                <motion.div
                  key="terminal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col h-full min-h-[400px] bg-black/80 rounded-2xl border border-white/5 p-6 font-mono text-[10px] overflow-hidden relative shadow-2xl backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 shrink-0">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500/40" />
                    </div>
                    <span className="text-slate-600 ml-3 flex items-center gap-2 font-bold uppercase tracking-widest text-[9px]">
                      <Terminal className="w-3 h-3" />
                      soulfire_v2_render.log
                    </span>
                  </div>
                  <div className="flex-1 h-[300px]">
                    <Virtuoso
                      style={{ height: '300px' }}
                      data={logLines}
                      itemContent={(index, entry) => (
                        <div className="pb-2">
                          {renderLogLine(entry)}
                        </div>
                      )}
                      followOutput="auto"
                      className="custom-scrollbar"
                    />
                    {isGenerating && <div className="animate-pulse text-blue-400 mt-2 ml-12">_</div>}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="player"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8 flex-1"
                >
                  {/* Audio Player */}
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="font-bold text-white truncate pr-4 tracking-tight text-lg">{generatedTrack?.trackMetadata?.title}</div>
                      <span className="text-[9px] font-black text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-400/20">AI Vocal</span>
                    </div>
                    <div className="flex items-center gap-5">
                      <button 
                        onClick={togglePlay}
                        className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                      </button>
                      <div className="flex-1 space-y-2">
                        <div className="h-1.5 w-full bg-obsidian-800 rounded-full overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: isPlaying ? '100%' : '0%' }}
                            transition={{ duration: isPlaying ? 30 : 0, ease: "linear" }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{isPlaying ? 'Streaming' : 'Ready'}</span>
                          <span className="text-[10px] text-blue-400 font-mono font-bold">48kHz / 24-bit</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Download */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">04. Asset Acquisition</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/5 uppercase tracking-widest"
                      >
                        <Download className="w-4 h-4 text-blue-400" /> Download Vocal Stem (WAV)
                      </button>
                    </div>
                  </div>

                  {/* Step 4: Rights */}
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">05. Rights & Ledger</h4>
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-white font-bold tracking-tight">Commercial Rights Cleared</p>
                          <p className="text-[9px] text-blue-400/70 font-mono break-all leading-relaxed bg-black/40 p-2 rounded-lg border border-white/5">SynthID: AQ.Ab8RN6ImYXQX-logWgcr55KtPRMhsQYCpLlMCssricqns-KZjQ</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">Watermark embedded. DNA Tag committed to Empire 1 Ledger.</p>
                        </div>
                      </div>
                      <button className="mt-5 w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-blue-500/20">
                        View Authenticity Certificate
                      </button>
                    </div>
                  </div>

                  {/* Biometric Processing */}
                  {audioUrl && (
                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">06. Biometric Telemetry</h4>
                      <BiometricVocalStrip 
                        audioUrl={audioUrl} 
                        vulnerabilityLevel={0.85}
                        dnaTag={generatedTrack?.trackMetadata?.dna_tag_preview}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}