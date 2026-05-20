import React from 'react';

export interface Track {
  name: string;
  steps: boolean[];
  pitchBends: number[];
}

interface StepSequencerProps {
  patternData: Track[];
  setPatternData: (data: Track[]) => void;
  onGenerateAI: () => void;
  isGenerating: boolean;
}

export default function StepSequencer({ patternData, setPatternData, onGenerateAI, isGenerating }: StepSequencerProps) {
  // Toggle a specific step on or off
  const toggleStep = (instrumentIndex: number, stepIndex: number) => {
    const newPattern = [...patternData];
    newPattern[instrumentIndex] = {
      ...newPattern[instrumentIndex],
      steps: [...newPattern[instrumentIndex].steps],
      pitchBends: [...newPattern[instrumentIndex].pitchBends]
    };
    newPattern[instrumentIndex].steps[stepIndex] = !newPattern[instrumentIndex].steps[stepIndex];
    setPatternData(newPattern);
  };

  const updatePitchBend = (instrumentIndex: number, stepIndex: number, value: number) => {
    const newPattern = [...patternData];
    newPattern[instrumentIndex] = {
      ...newPattern[instrumentIndex],
      steps: [...newPattern[instrumentIndex].steps],
      pitchBends: [...newPattern[instrumentIndex].pitchBends]
    };
    newPattern[instrumentIndex].pitchBends[stepIndex] = value;
    setPatternData(newPattern);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[var(--color-studio-fg)] tracking-wider">
          SEQUENCER <span className="text-[var(--color-studio-accent)]">•</span>
        </h2>
        <button 
          onClick={onGenerateAI}
          disabled={isGenerating}
          className={`px-4 py-2 bg-[var(--color-studio-aqua)] text-[#0C0532] font-bold rounded-lg shadow-[0_0_15px_rgba(9,225,159,0.3)] hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-[#0C0532] border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>🤖 Generate Pattern AI</>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-4 overflow-x-auto no-scrollbar">
        {patternData.map((track, trackIdx) => (
          <div key={track.name} className="flex items-center gap-4 min-w-[600px]">
            {/* Instrument Label */}
            <div className="w-24 text-sm font-mono text-gray-400">
              {track.name}
            </div>
            
            {/* 16-Step Grid */}
            <div className="grid grid-cols-16 gap-2 flex-1">
              {track.steps.map((isActive, stepIdx) => (
                <div key={stepIdx} className="flex flex-col gap-1 items-center">
                  <div
                    onClick={() => toggleStep(trackIdx, stepIdx)}
                    className={`aspect-square w-full pad-tactile ${isActive ? 'active-step' : ''}`}
                  ></div>
                  {isActive && (
                    <input 
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={track.pitchBends[stepIdx] || 0}
                      onChange={(e) => updatePitchBend(trackIdx, stepIdx, parseInt(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-[var(--color-studio-accent)]"
                      title={`Pitch: ${track.pitchBends[stepIdx] > 0 ? '+' : ''}${track.pitchBends[stepIdx] || 0} st`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {[...Array(16)].map((_, i) => (
          <div key={i} className="flex-1 text-center text-[10px] font-mono text-gray-500">
            {(i % 4 === 0) ? (i + 1) : '·'}
          </div>
        ))}
      </div>
    </div>
  );
}
