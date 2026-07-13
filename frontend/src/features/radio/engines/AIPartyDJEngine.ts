import type { DjPersona } from "../config/djPersonas";
import type { StationPack } from "../config/stationPacks";
import type { DeckState, MixState } from "./RadioMixEngine";
import { createInitialMixState, calculateCrossfadeVolumes } from "./RadioMixEngine";
import { getPreferredTransition, createDJAction, type DJAction, type TransitionType } from "./TransitionEngine";
import { processListenerIntent, type ListenerIntent } from "./ListenerIntentEngine";
import { createRoyaltyEvent } from "./RoyaltyEventEngine";
import type { InputType } from "../ai/interpretListenerInput";

export interface PartyDJState {
  persona: DjPersona;
  station: StationPack;
  mixState: MixState;
  djActions: DJAction[];
  listenerIntents: ListenerIntent[];
  currentMessage: string;
  energy: number;
  isLive: boolean;
  sessionId: string;
}

export function createPartyDJState(persona: DjPersona, station: StationPack): PartyDJState {
  return {
    persona,
    station,
    mixState: createInitialMixState(),
    djActions: [],
    listenerIntents: [],
    currentMessage: persona.catchphrases[0],
    energy: 0.5,
    isLive: true,
    sessionId: `party_${Date.now()}`,
  };
}

export function handleDjTransition(state: PartyDJState): PartyDJState {
  const transition = getPreferredTransition(state.persona.musicRules.preferredTransitions);
  const action = createDJAction(
    "transition",
    `${transition.label} — ${state.persona.name} takes the room ${state.station.name}`,
    transition.type,
    transition.durationMs
  );

  createRoyaltyEvent({
    type: "transition_performed",
    sessionId: state.sessionId,
    stationId: state.station.id,
    djId: state.persona.id,
    description: action.description,
    data: { transitionType: transition.type, durationMs: transition.durationMs },
  });

  return {
    ...state,
    djActions: [...state.djActions, action],
    currentMessage: `${state.persona.catchphrases[Math.floor(Math.random() * state.persona.catchphrases.length)]}`,
  };
}

export function handleListenerIntent(
  state: PartyDJState,
  inputType: InputType,
  text: string
): { state: PartyDJState; intent: ListenerIntent } {
  const intent = processListenerIntent(inputType, text);

  createRoyaltyEvent({
    type: "listener_input_submitted",
    sessionId: state.sessionId,
    stationId: state.station.id,
    djId: state.persona.id,
    description: intent.summary,
    data: { inputType, text, detectedEmotion: intent.detectedEmotion },
  });

  if (intent.ownershipEventRequired) {
    createRoyaltyEvent({
      type: "user_lyrics_used",
      sessionId: state.sessionId,
      description: `Original lyrics used: "${text.slice(0, 60)}..."`,
      data: { text, detectedEmotion: intent.detectedEmotion },
    });
  }

  const responseRule = getResponseRule(state.persona, inputType);
  const energyShift = intent.suggestedEnergyShift;
  const bpmShift = intent.suggestedBpmShift;

  return {
    state: {
      ...state,
      listenerIntents: [...state.listenerIntents, intent],
      currentMessage: responseRule,
      energy: Math.max(0, Math.min(1, state.energy + energyShift)),
      mixState: {
        ...state.mixState,
        deckA: {
          ...state.mixState.deckA,
          bpm: Math.max(60, Math.min(200, state.mixState.deckA.bpm + bpmShift)),
        },
        deckB: {
          ...state.mixState.deckB,
          bpm: Math.max(60, Math.min(200, state.mixState.deckB.bpm + bpmShift)),
        },
      },
    },
    intent,
  };
}

function getResponseRule(persona: DjPersona, inputType: InputType): string {
  const rules: Record<InputType, keyof typeof persona.crowdRules> = {
    lyrics: "lyricInput",
    feeling: "emotionalInput",
    dedication: "dedicationInput",
    shoutout: "shoutoutInput",
    vibe_request: "emotionalInput",
    remix_request: "lyricInput",
  };
  const key = rules[inputType] || "emotionalInput";
  return persona.crowdRules[key];
}

export function getDeckVolumes(state: PartyDJState): { volA: number; volB: number } {
  return calculateCrossfadeVolumes(state.mixState.crossfader);
}
