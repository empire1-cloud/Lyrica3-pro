import type { InputType } from "../ai/interpretListenerInput";

export interface ListenerIntent {
  inputType: InputType;
  text: string;
  detectedEmotion: string;
  detectedVibe: string;
  isOriginalLyrics: boolean;
  isCopyrightedReference: boolean;
  ownershipEventRequired: boolean;
  suggestedBpmShift: number;
  suggestedEnergyShift: number;
  summary: string;
}

const EMOTION_KEYWORDS: Record<string, string> = {
  happy: "joy",
  sad: "sadness",
  love: "love",
  heart: "love",
  miss: "nostalgia",
  "i remember": "nostalgia",
  hurt: "pain",
  pain: "pain",
  angry: "anger",
  mad: "anger",
  excited: "excitement",
  hype: "excitement",
  party: "excitement",
  chill: "calm",
  calm: "calm",
  vibe: "calm",
  lonely: "sadness",
  cry: "sadness",
  tears: "sadness",
  beautiful: "joy",
  grateful: "joy",
  blessed: "joy",
};

const COPYRIGHT_PATTERNS = [
  /^i can't feel my face/i,
  /^hello from the other side/i,
  /^someone like you/i,
  /^rolling in the deep/i,
  /^umbrella/i,
  /^single ladies/i,
  /^crazy in love/i,
  /^baby one more time/i,
  /^toxic/i,
  /^in the end/i,
  /^numb/i,
  /^lose yourself/i,
  /^not afraid/i,
  /^love the way you lie/i,
  /^stan/i,
  /^god's plan/i,
  /^hotline bling/i,
  /^old town road/i,
  /^despacito/i,
  /^gasolina/i,
  /^danza kuduro/i,
];

export function processListenerIntent(inputType: InputType, text: string): ListenerIntent {
  const lowerText = text.toLowerCase();

  const detectedEmotion = detectEmotion(lowerText);
  const detectedVibe = detectVibe(lowerText, inputType);
  const isOriginalLyrics = detectOriginalLyrics(lowerText, inputType);
  const isCopyrightedReference = detectCopyright(lowerText);
  const ownershipEventRequired = isOriginalLyrics && !isCopyrightedReference;

  const summary = generateSummary(inputType, text, detectedEmotion);
  const suggestedBpmShift = calculateBpmShift(detectedEmotion, inputType);
  const suggestedEnergyShift = calculateEnergyShift(detectedEmotion, inputType);

  return {
    inputType,
    text,
    detectedEmotion,
    detectedVibe,
    isOriginalLyrics,
    isCopyrightedReference,
    ownershipEventRequired,
    suggestedBpmShift,
    suggestedEnergyShift,
    summary,
  };
}

function detectEmotion(text: string): string {
  for (const [keyword, emotion] of Object.entries(EMOTION_KEYWORDS)) {
    if (text.includes(keyword)) return emotion;
  }
  return "neutral";
}

function detectVibe(text: string, inputType: InputType): string {
  if (inputType === "vibe_request") {
    if (/old school|oldies|classic|retro|90s|80s|70s/.test(text)) return "nostalgic";
    if (/party|club|turn up|hype|banger/.test(text)) return "energetic";
    if (/chill|smooth|relax|cruise|lofi/.test(text)) return "chill";
    if (/dark|sad|melancholy|rain|night/.test(text)) return "dark";
    if (/romantic|love|slow|r&b|soul/.test(text)) return "romantic";
    return "neutral";
  }

  if (inputType === "lyrics") {
    if (/(heart|love|miss|kiss|baby|hold|touch)/.test(text)) return "romantic";
    if (/(pain|hurt|tears|cry|bleed|break|lonely)/.test(text)) return "melancholic";
    if (/(ride|dub|low|creep|slide|gang|west|east)/.test(text)) return "street";
    return "neutral";
  }

  if (inputType === "feeling") {
    if (/(sad|cry|hurt|pain|tears|miss|lonely|broken)/.test(text)) return "melancholic";
    if (/(love|happy|joy|beautiful|grateful|blessed)/.test(text)) return "uplifting";
    if (/(angry|mad|rage|furious|done)/.test(text)) return "aggressive";
    return "neutral";
  }

  return "neutral";
}

function detectOriginalLyrics(text: string, inputType: InputType): boolean {
  if (inputType !== "lyrics") return false;
  if (text.split(" ").length < 3) return false;
  return true;
}

function detectCopyright(text: string): boolean {
  return COPYRIGHT_PATTERNS.some(pattern => pattern.test(text));
}

function generateSummary(inputType: InputType, text: string, emotion: string): string {
  const preview = text.length > 60 ? text.slice(0, 60) + "..." : text;
  const summaries: Record<InputType, string> = {
    lyrics: `Listener shared original lyrics: "${preview}" — emotion detected: ${emotion}`,
    feeling: `Listener feeling: "${preview}" — mood: ${emotion}`,
    dedication: `Listener dedication: "${preview}"`,
    shoutout: `Listener shoutout: "${preview}"`,
    vibe_request: `Listener vibe request: "${preview}"`,
    remix_request: `Listener remix request: "${preview}"`,
  };
  return summaries[inputType] || `Listener input received: "${preview}"`;
}

function calculateBpmShift(emotion: string, inputType: InputType): number {
  if (inputType === "vibe_request") return 0;
  if (emotion === "excitement" || emotion === "anger") return 5;
  if (emotion === "calm" || emotion === "sadness") return -5;
  if (emotion === "nostalgia") return -3;
  return 0;
}

function calculateEnergyShift(emotion: string, inputType: InputType): number {
  if (inputType === "vibe_request") return 0;
  if (emotion === "excitement" || emotion === "anger") return 0.1;
  if (emotion === "calm" || emotion === "sadness") return -0.1;
  return 0;
}
