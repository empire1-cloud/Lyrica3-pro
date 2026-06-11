import React, { useState } from 'react';
import { Play, Sparkles, Loader } from 'lucide-react';
import './VibeBar.css';

interface VibeBarProps {
  onGenerate: (prompt: string) => void;
  isLoading?: boolean;
  suggestions?: string[];
}

const VibeBar: React.FC<VibeBarProps> = ({ 
  onGenerate, 
  isLoading = false,
  suggestions = [
    "90s R&B hurt",
    "Chicano Soul vibes",
    "Late-night drive",
    "Playful trap energy",
    "Soulfire essence"
  ]
}) => {
  const [input, setInput] = useState('');
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

  const handleGenerate = () => {
    const prompt = selectedSuggestion || input;
    if (prompt.trim()) {
      onGenerate(prompt);
      setInput('');
      setSelectedSuggestion(null);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
    onGenerate(suggestion);
  };

  return (
    <div className="vibe-bar-container">
      <div className="vibe-bar-header">
        <h2 className="vibe-title">
          <Sparkles className="spark-icon" />
          One-Tap Soul
        </h2>
        <p className="vibe-subtitle">
          "Create a song for... your late-night breakup, or whatever mood you need"
        </p>
      </div>

      <div className="vibe-input-section">
        <div className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSelectedSuggestion(null);
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="I need a song for a late-night drive after a mutual breakup, but make it 90s R&B..."
            className="vibe-input"
            disabled={isLoading}
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || (!input.trim() && !selectedSuggestion)}
            className={`generate-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <>
                <Loader className="button-icon spinning" />
                Generating...
              </>
            ) : (
              <>
                <Play className="button-icon" />
                Generate
              </>
            )}
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="suggestions-container">
          <p className="suggestions-label">Quick vibes:</p>
          <div className="suggestions-grid">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`suggestion-chip ${selectedSuggestion === suggestion ? 'active' : ''}`}
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generation Progress Indicator */}
      {isLoading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p className="progress-text">Generating your Soulfire... 45%</p>
        </div>
      )}
    </div>
  );
};

export default VibeBar;
