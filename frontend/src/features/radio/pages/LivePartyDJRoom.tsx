import React, { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Radio, Flame, Users, Activity, Music, Sparkles,
  Mic2, Zap, Heart, MessageSquare, Shield
} from 'lucide-react';
import { cn } from '../../../components/ui/utils';
import { STATION_PACKS, type StationPack } from '../config/stationPacks';
import { DJ_PERSONAS, getDjPersona } from '../config/djPersonas';
import { StationSelector } from '../components/StationSelector';
import { TwoDeckPlayer } from '../components/TwoDeckPlayer';
import { ListenerInputPanel } from '../ListenerInputPanel';
import { LiveSubmissionsFeed } from '../LiveSubmissionsFeed';
import type { SubmissionEntry } from '../LiveSubmissionsFeed';
import type { ListenerInput } from '../ai/interpretListenerInput';
import { createPartyDJState, handleDjTransition, handleListenerIntent, type PartyDJState } from '../engines/AIPartyDJEngine';
import type { MixState } from '../engines/RadioMixEngine';
import { createRoyaltyEvent, generateEventSummary } from '../engines/RoyaltyEventEngine';
import { createDJAction } from '../engines/TransitionEngine';
import { playTransitionCue } from '../lib/audioCue';
import { ArchisynapseDashboard } from './ArchisynapseDashboard';

export function LivePartyDJRoom() {
  const [selectedStation, setSelectedStation] = useState<StationPack | null>(null);
  const [partyState, setPartyState] = useState<PartyDJState | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>([]);
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const [showStationSelect, setShowStationSelect] = useState(!selectedStation);
  const [showArchisynapse, setShowArchisynapse] = useState(false);

  const handleStationSelect = useCallback((station: StationPack) => {
    const dj = getDjPersona(station.djId);
    if (!dj) return;
    const state = createPartyDJState(dj, station);
    setSelectedStation(station);
    setPartyState(state);
    setShowStationSelect(false);

    // Log session start
    createRoyaltyEvent({
      type: "dj_action",
      sessionId: state.sessionId,
      stationId: station.id,
      djId: dj.id,
      description: `${dj.name} started broadcasting on ${station.name}`,
    });

    // Initial DJ message
    const transitionedState = handleDjTransition(state);
    setPartyState(transitionedState);
  }, []);

  const handleListenerSubmit = useCallback(async (input: ListenerInput) => {
    if (!partyState) return;
    setIsProcessingInput(true);

    const result = handleListenerIntent(partyState, input.inputType, input.text);
    setPartyState(result.state);

    const submissionEntry: SubmissionEntry = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      input,
      interpretation: {
        detectedEmotion: result.intent.detectedEmotion,
        emotionConfidence: 0.8,
        detectedVibe: result.intent.detectedVibe,
        vibeConfidence: 0.7,
        classifiedType: input.inputType,
        typeConfidence: 0.9,
        isOriginalLyrics: result.intent.isOriginalLyrics,
        isCopyrightedReference: result.intent.isCopyrightedReference,
        ownershipEventRequired: result.intent.ownershipEventRequired,
        summary: result.intent.summary,
        suggestedBpmShift: result.intent.suggestedBpmShift,
        suggestedEnergyShift: result.intent.suggestedEnergyShift,
      },
      djResponse: {
        responseType: "shoutout",
        djMessage: result.state.currentMessage,
        detectedEmotion: result.intent.detectedEmotion,
        detectedVibe: result.intent.detectedVibe,
        suggestedMusicChange: {
          bpmShift: result.intent.suggestedBpmShift || undefined,
          energy: result.intent.suggestedEnergyShift || undefined,
        },
        ownershipEventRequired: result.intent.ownershipEventRequired,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    setSubmissions(prev => [...prev, submissionEntry]);
    setIsProcessingInput(false);
  }, [partyState]);

  const handleTogglePlay = useCallback((deck: "A" | "B") => {
    if (!partyState) return;
    setPartyState({
      ...partyState,
      mixState: {
        ...partyState.mixState,
        [deck === "A" ? "deckA" : "deckB"]: {
          ...partyState.mixState[deck === "A" ? "deckA" : "deckB"],
          isPlaying: !partyState.mixState[deck === "A" ? "deckA" : "deckB"].isPlaying,
        },
        activeDeck: deck,
      },
    });
  }, [partyState]);

  const handleCrossfaderChange = useCallback((value: number) => {
    if (!partyState) return;
    setPartyState({
      ...partyState,
      mixState: {
        ...partyState.mixState,
        crossfader: value,
      },
    });
  }, [partyState]);

  const handleLoopToggle = useCallback((deck: "A" | "B") => {
    if (!partyState) return;
    playTransitionCue("loop");
    const deckState = deck === "A" ? partyState.mixState.deckA : partyState.mixState.deckB;
    const action = createDJAction("transition", `${deck === "A" ? "Deck A" : "Deck B"} loop ${deckState.loopActive ? "disabled" : "activated"} (${deckState.loopBars} bars)`);
    setPartyState({
      ...partyState,
      mixState: {
        ...partyState.mixState,
        [deck === "A" ? "deckA" : "deckB"]: {
          ...deckState,
          loopActive: !deckState.loopActive,
        },
      },
      djActions: [...partyState.djActions, action],
    });
  }, [partyState]);

  const handleNextTrack = useCallback((deck: "A" | "B") => {
    if (!partyState) return;
    playTransitionCue("crossfade");
    const transitioned = handleDjTransition(partyState);
    setPartyState(transitioned);
  }, [partyState]);

  if (!selectedStation || showStationSelect) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tighter uppercase">Select a Station</h2>
          <p className="text-[10px] font-mono text-white/30 mt-1">
            Each station has a unique AI DJ host and vibe
          </p>
        </div>
        <StationSelector
          selectedStationId={selectedStation?.id}
          onSelect={handleStationSelect}
        />
      </div>
    );
  }

  if (!partyState) return null;

  const dj = getDjPersona(partyState.persona.id);

  return (
    <div className="space-y-6">
      {/* DJ Host Header */}
      <div className={cn(
        "relative p-5 rounded-2xl border overflow-hidden",
        `bg-gradient-to-br ${partyState.station.color}/10 border-${partyState.station.color.split(" ")[0].replace("from-", "")}/20`
      )}>
        <div className={cn(
          "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20",
          partyState.station.color
        )} />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg",
              partyState.station.color
            )}>
              <Mic2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">{partyState.persona.name}</h2>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      animate={{ height: [3, 8 + i * 2, 3] }}
                      transition={{ duration: 0.5 + i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                      className="w-0.5 bg-green-500 rounded-full"
                    />
                  ))}
                </div>
              </div>
              <p className="text-[10px] font-mono text-white/40">{partyState.station.name}</p>
              <p className="text-[9px] text-white/30 mt-1 italic max-w-lg">
                "{partyState.currentMessage}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
              <Activity className="w-3 h-3 text-fuchsia-500" />
              <span className="text-[8px] font-mono text-white/40">
                {(partyState.energy * 100).toFixed(0)}% Energy
              </span>
            </div>
            <button
              onClick={() => setShowStationSelect(true)}
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-mono hover:bg-white/10 transition-colors"
            >
              Change Station
            </button>
            <button
              onClick={() => setShowArchisynapse(!showArchisynapse)}
              className={cn(
                "px-3 py-1.5 border rounded-lg text-[8px] font-mono transition-colors",
                showArchisynapse
                  ? "bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              <Shield className="w-3 h-3 inline mr-1" />
              Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Archisynapse Ledger Panel */}
      {showArchisynapse && (
        <div className="p-5 bg-fuchsia-500/5 border border-fuchsia-500/10 rounded-2xl">
          <ArchisynapseDashboard />
        </div>
      )}

      {/* Main Grid: TwoDeck + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Two-Deck Player + Station Info */}
        <div className="lg:col-span-2 space-y-4">
          <TwoDeckPlayer
            mixState={partyState.mixState}
            onTogglePlay={handleTogglePlay}
            onCrossfaderChange={handleCrossfaderChange}
            onLoopToggle={handleLoopToggle}
            onNextTrack={handleNextTrack}
            actions={partyState.djActions}
          />

          {/* Station Info */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-2">About This Station</h3>
            <p className="text-xs text-white/60">{partyState.station.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {partyState.station.genre.map(g => (
                <span key={g} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[7px] font-mono uppercase tracking-wider text-white/30">{g}</span>
              ))}
            </div>
          </div>

          {/* Event Summary */}
          <div className="p-3 bg-fuchsia-500/5 border border-fuchsia-500/10 rounded-xl">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-fuchsia-400" />
              <span className="text-[8px] font-mono text-fuchsia-400/60 uppercase tracking-wider">Archisynapse</span>
            </div>
            <p className="text-[8px] font-mono text-white/30 mt-1">
              {generateEventSummary(partyState.sessionId)}
            </p>
          </div>
        </div>

        {/* Right: Listener Feed */}
        <div className="space-y-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-3 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-pink-500" />
              Listener Input
            </h3>
            <ListenerInputPanel
              sessionId={partyState.sessionId}
              userId="You"
              onSubmit={handleListenerSubmit}
              isProcessing={isProcessingInput}
            />
          </div>

          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-white/40 mb-3 flex items-center gap-2">
              <MessageSquare className="w-3 h-3 text-cyan-400" />
              Room Feed
            </h3>
            <LiveSubmissionsFeed submissions={submissions} />
            {submissions.length === 0 && (
              <div className="text-center py-8 text-white/20">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-[10px] font-mono uppercase tracking-widest">
                  Waiting for the room
                </p>
                <p className="text-[8px] font-mono text-white/10 mt-1">
                  Submit lyrics, feelings, or a dedication to shape the vibe
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Genre tags */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}
