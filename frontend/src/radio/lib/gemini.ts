import { GoogleGenAI, Modality } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (ai) return ai;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY");
  }

  ai = new GoogleGenAI({ apiKey });
  return ai;
}

export interface VibeParams {
  style: string;
  mood: string;
  tempo: number;
  key: string;
  lyrics: string;
  vocalStyle: string;
  // Master Spec Parameters
  engine?: string;
  moodMatrix?: string[];
  genreDNA?: string;
  proceduralSFX?: string;
  vulnerabilitySlider?: number;
  harmonicStructure?: string;
  personaCount?: number;
  personas?: string[];
  // Pro Parameters (Invisible Translation Layer)
  vocalFry?: number;
  inhaleIntensity?: number;
  emotionalBreak?: number;
  roomSize?: number;
  material?: string;
  breathingPattern?: string;
  genreBlend?: string[];
  instrumentation?: string[];
  spatialEffects?: string[];
  harmonicTension?: number;
  vocalLayering?: string;
  mixWarmth?: number;
  reverbType?: string;
  eraTexture?: string;
  emotionalMode?: 'Pain' | 'Playful' | 'Mirror';
  // Advanced Audio Effects
  delayTime?: number;
  delayFeedback?: number;
  chorusDepth?: number;
  phaserRate?: number;
}

export async function translateVibeToParams(vibe: string, context?: { weather?: string, time?: string, heartRate?: number }): Promise<VibeParams> {
  const contextStr = context ? ` Context: ${context.weather}, ${context.time}, ${context.heartRate} BPM.` : '';
  
  const isCorrido = /corrido|tumbado|belico|mexican/i.test(vibe);
  const corridoInstructions = isCorrido ? `
  CRITICAL CORE DIRECTIVE: The user is requesting a "Corrido" (traditional Mexican ballad / Corrido Tumbado / Bélico). You MUST generate lyrics and technical parameters that deeply honor and execute the authentic, rich cultural heritage of this storytelling tradition:

  1. DEVELOP SHARP, COMPELLING CHARACTER ARCHETYPES (You MUST choose exactly one discrete archetype to base the whole character/lyrics narrative on):
     - Archetype A: 'El Valiente de la Frontera' (e.g., Don Cruz Maldonado). A man of dignity protecting his land and community from unlawful incursions. Loyal to a fault, armed with a traditional 'súper del once' or 'fiel carabina 30-30', standing firm and fearless.
     - Archetype B: 'El Bandido Generoso' (e.g., Epifanio 'El Gavilán' Verdugo). A Robin Hood outlaw living in the Sierra Madre, taking from exploitative syndicates to support poor farming families in Mocorito or Badiraguato, riding a swift steed or black suburban, guided by faith and regional honor.
     - Archetype C: 'El Emigrante Indomable' (e.g., Mateo 'El Norteño' Cisneros). A gritty dreamer braving searing desert heat and high-border winds, maintaining integrity while enduring grueling labor in the fields or construction sites, solely to send hope and dollars back to his mother in Michoacán or Jalisco.
     - Archetype D: 'El Compadre Traicionado' (e.g., Raymundo 'El Gallo' Loya). A tale of blood-brotherhood and absolute loyalty shattered by the ultimate sting of a 'soplón' (informer) named Lucas, culminating in a dramatic, tragic face-off in a dusty border canteen.

  2. HARD NARRATIVE PROPAGATION (The generated "lyrics" MUST strictly be written in Spanish and follow this solid 3-part arc):
     - THE START (El Saludo / Presentation): You must explicitly set the scene with the date/year (e.g., "Año de mil novecientos...", "Un domingo siete de julio...") and ground it in a real Mexican city/state (e.g., Sinaloa, Sonora, Durango, Jalisco, o Michoacán). Frame the protagonist's name, prestige, and known trade or destiny.
     - THE CRITICAL STRUGGLE (El Conflicto / Climax): Introduce high dramatic tension. Describe the central struggle—be it a sudden ambush ('emboscada traidora'), a face-off with corrupt authorities, or a stand against a traitor. Incorporate specific, historic firearms or regional equipment and include a direct, defiant quote from the protagonist showing they do not fear death (e.g., "No me tengan compasión, que yo de frente me muero").
     - THE CLASSIC FAREWELL (La Despedida / Legacy): Conclude with the mandatory traditional despedida starting with classic phrases like "Ya con esta me despido...", "Vuela, vuela, palomita...", "Vuela, vuela, gorrioncito...", or "Así termina el corrido...". Mention the hero's final resting place, reflect on their honor, and declare how their legend will live forever across the sierra.

  3. AUTHENTIC POETIC METRE, CADENCE & LEXICON:
     - Use genuine Chicano and regional storytelling idioms: 'cuerno de chivo', 'sierra querida', 'riendas de su destino', 'le sobraba valor', 'gallo de pelea', 'contrabando de honor', 'tierra bendita', 'suerte echada', 'fuego cruzado', 'rugido', 'soplón cobarde', 'acero templado'.
     - Formatting structure: Standard Spanish octosyllabic verses (8 syllables per line) styled in 4 to 6 quatrains (coplas) with a natural, flowing balance and traditional ABCB or AABB rhyme schemes.
     - Style / Genre Setup: Force "style" parameter strictly to "Corrido Tradicional" or "Corrido Tumbado / Bélico".
     - Instrumentation Setup: Set "instrumentation" to incorporate exactly "Requinto acoustic guitar, heavy slap Tololoche, Alto horn Charcheta, accordion, Bajo sexto".
     - Rhythm: Set "tempo" to 125-140 BPM with a bouncing 3/4 waltz or galloping 2/4 polka signature.
     - Vocal Design: Set "vocalStyle" strictly to "Voz Campirana con Sentimiento" or "Dueto de la Sierra featuring traditional, high-pitched nasal harmonies".
  ` : '';

  const response = await getClient().models.generateContent({
    model: "gemini-3.5-flash",
    contents: `Translate this music vibe into a full technical emotional blueprint for the music generation engine: "${vibe}".${contextStr}${corridoInstructions}
    The engine supports multi-genre blending (R&B, Oldies, Funk, Rock, Country, Soul, Chicano oldies, 90s duos, 70s funk, 2000s heartbreak, Modern trap-soul, Acoustic country, Corrido / Regional Mexicano).
    
    Return JSON with:
    - style (string)
    - mood (string)
    - tempo (number)
    - key (string)
    - lyrics (string)
    - vocalStyle (string)
    - engine (e.g., "Standard-Ensemble-v1")
    - moodMatrix (string array, e.g., ["melancholy", "nostalgia"])
    - genreDNA (e.g., "90s_R&B_Soul")
    - proceduralSFX (e.g., "light_rain_on_windshield")
    - vulnerabilitySlider (0-1)
    - harmonicStructure (e.g., "Major 7th", "Minor 9th")
    - personaCount (number)
    - personas (string array, e.g., ["Persona A", "Persona B"])
    - vocalFry (0-1)
    - inhaleIntensity (0-1)
    - emotionalBreak (0-1)
    - roomSize (0-1)
    - material (string)
    - breathingPattern (string)
    - genreBlend (string array)
    - instrumentation (string array)
    - spatialEffects (string array)
    - harmonicTension (0-1)
    - vocalLayering (string)
    - mixWarmth (0-1)
    - reverbType (string)
    - eraTexture (string)
    - emotionalMode ('Pain' | 'Playful' | 'Mirror')
    - delayTime (number, ms)
    - delayFeedback (0-1)
    - chorusDepth (0-1)
    - phaserRate (number, Hz)`,
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return {
      style: "Soul / R&B",
      mood: "Melancholic",
      tempo: 90,
      key: "B Minor",
      lyrics: "Two broken smiles in the rain...",
      vocalStyle: "Intimate Confession",
      vocalFry: 0.4,
      inhaleIntensity: 0.6,
      emotionalBreak: 0.3,
      roomSize: 0.5,
      material: "Wood",
      delayTime: 250,
      delayFeedback: 0.3,
      chorusDepth: 0.2,
      phaserRate: 0.5
    };
  }
}

export async function generateMusicStream(params: VibeParams) {
  try {
    // Using Soulfire Clip for 30s preview
    const response = await getClient().models.generateContentStream({
      model: "lyria-3-clip-preview",
      contents: `Generate a 30-second track. Style: ${params.style}. Mood: ${params.mood}. Tempo: ${params.tempo} BPM. Key: ${params.key}. Vocal Style: ${params.vocalStyle}. Lyrics: ${params.lyrics}`,
    });
    return response;
  } catch (error) {
    console.warn("Soulfire model access denied or failed. Falling back to simulated stream with audible preview.");
    
    // Return a mock async iterable with a real audible fallback URL
    async function* mockStream() {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // We'll yield a text part first
      yield {
        candidates: [{
          content: {
            parts: [
              { text: params.lyrics || "Simulated lyrics generated by fallback...\n\n(Verse 1)\nIn the neon glow, we find our way..." }
            ]
          }
        }]
      };

      await new Promise(resolve => setTimeout(resolve, 500));

      // Then we'll yield a "marker" that we'll use in App.tsx to load a real fallback URL
      // Since we can't easily send a large binary here, we'll send a special base64 string
      // that App.tsx will recognize as "use_fallback_url"
      yield {
        candidates: [{
          content: {
            parts: [
              { inlineData: { mimeType: "audio/mpeg", data: "FALLBACK_AUDIO_SIGNAL" } }
            ]
          }
        }]
      };
    }
    
    return mockStream();
  }
}
