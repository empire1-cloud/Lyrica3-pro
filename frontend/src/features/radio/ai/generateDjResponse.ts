import { GoogleGenAI } from "@google/genai";
import type { InterpretedInput, ListenerInput } from "./interpretListenerInput";

let ai: GoogleGenAI | null = null;
function getClient(): GoogleGenAI | null {
  if (ai) return ai;
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) return null;
  try {
    ai = new GoogleGenAI({ apiKey: key });
    return ai;
  } catch (e) {
    console.warn("Gemini client init failed — falling back to offline mode:", e);
    return null;
  }
}

export type DjResponseType =
  | "shoutout"
  | "vibe_shift"
  | "hook_idea"
  | "dj_drop"
  | "queue_change"
  | "remix_seed";

export interface DjResponse {
  responseType: DjResponseType;
  djMessage: string;
  detectedEmotion: string;
  detectedVibe: string;
  suggestedMusicChange?: {
    bpmShift?: number;
    genre?: string;
    mood?: string;
    energy?: number;
  };
  ownershipEventRequired: boolean;
  hookIdea?: string;
  dropText?: string;
  remixSeed?: string;
  timestamp: string;
}

export interface SessionState {
  currentBpm: number;
  currentEnergy: number;
  currentGenre: string;
  currentMood: string;
  currentPersonaName: string;
  crowdEmotion: number;
  activeThemes: string[];
}

const FALLBACK_RESPONSE: DjResponse = {
  responseType: "shoutout",
  djMessage: "Love that energy in the room! Keep it coming.",
  detectedEmotion: "neutral",
  detectedVibe: "ambient",
  ownershipEventRequired: false,
  timestamp: new Date().toISOString(),
};

export async function generateDjResponse(
  sessionState: SessionState,
  listenerInput: ListenerInput,
  interpretation: InterpretedInput
): Promise<DjResponse> {
  try {
    const client = getClient();
    if (!client) return FALLBACK_RESPONSE;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the AI DJ host for SL Universal Radio. The station is currently live with ${sessionState.currentPersonaName}.

Current session state:
- BPM: ${sessionState.currentBpm}
- Energy: ${sessionState.currentEnergy}
- Genre: ${sessionState.currentGenre}
- Mood: ${sessionState.currentMood}
- Crowd Emotion: ${(sessionState.crowdEmotion * 100).toFixed(0)}%
- Active Themes: ${sessionState.activeThemes.join(", ")}

Listener just submitted:
- Type: ${listenerInput.inputType}
- Text: "${listenerInput.text}"

AI Interpretation:
- Emotion: ${interpretation.detectedEmotion} (confidence: ${(interpretation.emotionConfidence * 100).toFixed(0)}%)
- Vibe: ${interpretation.detectedVibe} (confidence: ${(interpretation.vibeConfidence * 100).toFixed(0)}%)
- Classified as: ${interpretation.classifiedType}
- Is original lyrics: ${interpretation.isOriginalLyrics}
- Is copyrighted: ${interpretation.isCopyrightedReference}
- Needs ownership event: ${interpretation.ownershipEventRequired}

Respond as the AI DJ. Choose ONE response type:
- "shoutout": Give the listener a shoutout, acknowledge their presence
- "vibe_shift": Suggest changing the musical direction based on their input
- "hook_idea": If they submitted lyrics, generate a hook/melody idea
- "dj_drop": Create a short DJ drop / transition phrase
- "queue_change": Suggest the next track direction
- "remix_seed": If interesting, turn their input into a remix seed

CRITICAL RULES:
- If copyright detected, DO NOT reproduce the text. Treat as mood reference only.
- If original lyrics detected, set ownershipEventRequired to true.
- Keep response concise and energetic. This is a live radio host.

Return JSON:
- responseType: string
- djMessage: string — the DJ's spoken response (2-3 sentences max)
- detectedEmotion: string
- detectedVibe: string
- suggestedMusicChange: { bpmShift?: number, genre?: string, mood?: string, energy?: number } | null
- ownershipEventRequired: boolean
- hookIdea: string | null — if responseType is "hook_idea", a short hook concept
- dropText: string | null — if responseType is "dj_drop", the drop phrase
- remixSeed: string | null — if responseType is "remix_seed", a remix concept`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return FALLBACK_RESPONSE;

    const parsed = JSON.parse(text);

    return {
      responseType: parsed.responseType || FALLBACK_RESPONSE.responseType,
      djMessage: parsed.djMessage || FALLBACK_RESPONSE.djMessage,
      detectedEmotion: parsed.detectedEmotion || interpretation.detectedEmotion,
      detectedVibe: parsed.detectedVibe || interpretation.detectedVibe,
      suggestedMusicChange: parsed.suggestedMusicChange || undefined,
      ownershipEventRequired: !!parsed.ownershipEventRequired || interpretation.ownershipEventRequired,
      hookIdea: parsed.hookIdea || undefined,
      dropText: parsed.dropText || undefined,
      remixSeed: parsed.remixSeed || undefined,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("Failed to generate DJ response, using fallback", err);
    return {
      ...FALLBACK_RESPONSE,
      timestamp: new Date().toISOString(),
      djMessage: `Yo! I'm feeling what ${listenerInput.inputType === "shoutout" ? "you're putting down" : `that ${listenerInput.text.slice(0, 40)}`} — keep the energy alive in here!`,
    };
  }
}
