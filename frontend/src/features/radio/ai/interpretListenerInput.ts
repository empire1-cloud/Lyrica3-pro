import { GoogleGenAI } from "@google/genai";

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

export type InputType = "lyrics" | "feeling" | "dedication" | "shoutout" | "vibe_request" | "remix_request";

export interface ListenerInput {
  sessionId: string;
  userId?: string;
  inputType: InputType;
  text: string;
  submittedAt: string;
}

export interface InterpretedInput {
  detectedEmotion: string;
  emotionConfidence: number;
  detectedVibe: string;
  vibeConfidence: number;
  classifiedType: InputType;
  typeConfidence: number;
  isOriginalLyrics: boolean;
  isCopyrightedReference: boolean;
  ownershipEventRequired: boolean;
  summary: string;
  suggestedBpmShift: number;
  suggestedEnergyShift: number;
}

const FALLBACK_INTERPRETATION: InterpretedInput = {
  detectedEmotion: "neutral",
  emotionConfidence: 0.5,
  detectedVibe: "ambient",
  vibeConfidence: 0.5,
  classifiedType: "vibe_request",
  typeConfidence: 0.5,
  isOriginalLyrics: false,
  isCopyrightedReference: false,
  ownershipEventRequired: false,
  summary: "Audience input received. Interpreting mood and direction.",
  suggestedBpmShift: 0,
  suggestedEnergyShift: 0,
};

export async function interpretListenerInput(
  input: ListenerInput
): Promise<InterpretedInput> {
  try {
    const client = getClient();
    if (!client) return FALLBACK_INTERPRETATION;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the AI DJ interpreter for SL Universal Radio. Analyze this listener input:

Input Type (self-reported): ${input.inputType}
Text: "${input.text}"

Classify and return JSON with:
- detectedEmotion: the primary emotion detected (e.g., "joy", "sadness", "anger", "love", "nostalgia", "excitement", "melancholy")
- emotionConfidence: 0-1
- detectedVibe: the musical vibe suggested (e.g., "dark R&B", "upbeat house", "soulful ballad", "lofi chill", "phonk")
- vibeConfidence: 0-1
- classifiedType: the actual input type based on content analysis ("lyrics" | "feeling" | "dedication" | "shoutout" | "vibe_request" | "remix_request")
- typeConfidence: 0-1
- isOriginalLyrics: boolean — true if the text appears to be original user-written lyrics
- isCopyrightedReference: boolean — true if the text appears to quote known copyrighted song lyrics
- ownershipEventRequired: boolean — true if the text is original lyrics that might become part of a generated track
- summary: one-sentence summary of what the listener wants
- suggestedBpmShift: number (-20 to 20, how much to shift BPM)
- suggestedEnergyShift: number (-0.5 to 0.5, how much to shift energy)`,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return FALLBACK_INTERPRETATION;

    const parsed = JSON.parse(text);

    return {
      detectedEmotion: parsed.detectedEmotion || FALLBACK_INTERPRETATION.detectedEmotion,
      emotionConfidence: parsed.emotionConfidence ?? FALLBACK_INTERPRETATION.emotionConfidence,
      detectedVibe: parsed.detectedVibe || FALLBACK_INTERPRETATION.detectedVibe,
      vibeConfidence: parsed.vibeConfidence ?? FALLBACK_INTERPRETATION.vibeConfidence,
      classifiedType: parsed.classifiedType || FALLBACK_INTERPRETATION.classifiedType,
      typeConfidence: parsed.typeConfidence ?? FALLBACK_INTERPRETATION.typeConfidence,
      isOriginalLyrics: !!parsed.isOriginalLyrics,
      isCopyrightedReference: !!parsed.isCopyrightedReference,
      ownershipEventRequired: !!parsed.ownershipEventRequired,
      summary: parsed.summary || FALLBACK_INTERPRETATION.summary,
      suggestedBpmShift: parsed.suggestedBpmShift ?? FALLBACK_INTERPRETATION.suggestedBpmShift,
      suggestedEnergyShift: parsed.suggestedEnergyShift ?? FALLBACK_INTERPRETATION.suggestedEnergyShift,
    };
  } catch (err) {
    console.warn("Failed to interpret listener input, using fallback", err);
    return FALLBACK_INTERPRETATION;
  }
}
