import React, { useState } from 'react';
import { RotateCcw, Share2, Download, Zap } from 'lucide-react';

interface RemixFlipUIProps {
  trackId: string;
  currentEmotion: 'pain' | 'playful' | 'mirror';
  onFlip: (newEmotion: string) => void;
  onRemix: (remixType: string) => void;
  onBlend: (track1: string, track2: string, ratio: number) => void;
  isLoading?: boolean;
}

const EMOTION_OPPOSITES: Record<string, string> = {
  'pain': 'playful',
  'playful': 'pain',
  'mirror': 'pain',
};

const REMIX_OPTIONS = [
  {
    id: 'keep-lyrics',
    name: 'Keep Lyrics',
    desc: 'Keep lyrics, change beat',
    icon: '🎤'
  },
  {
    id: 'stem-isolate',
    name: 'Stem Isolate',
    desc: 'Show individual tracks',
    icon: '🔊'
  },
  {
    id: 'variations',
    name: 'Variations',
    desc: '3 quick alternatives',
    icon: '✨'
  },
  {
    id: 'tempo-shift',
    name: 'Tempo Shift',
    desc: 'Change speed/energy',
    icon: '⚡'
  }
];

export const RemixFlipUI: React.FC<RemixFlipUIProps> = ({
  trackId,
  currentEmotion,
  onFlip,
  onRemix,
  onBlend,
  isLoading = false
}) => {
  const [selectedRemix, setSelectedRemix] = useState<string | null>(null);
  const [showBlendMode, setShowBlendMode] = useState(false);
  const [blendRatio, setBlendRatio] = useState(50);

  const oppositeEmotion = EMOTION_OPPOSITES[currentEmotion] || 'playful';

  return (
    <div className="remix-flip-ui">
      <style>{remixFlipStyles}</style>

      {/* Main Flip Button */}
      <div className="flip-section">
        <button
          className="flip-button"
          onClick={() => onFlip(oppositeEmotion)}
          disabled={isLoading}
        >
          <RotateCcw size={24} />
          <div className="flip-content">
            <span className="flip-label">Flip It</span>
            <span className="flip-emotion">
              {currentEmotion} → {oppositeEmotion}
            </span>
          </div>
        </button>
        <p className="flip-description">
          Instantly transform to opposite emotion while keeping the vibe
        </p>
      </div>

      {/* Remix Options Grid */}
      <div className="remix-grid">
        {REMIX_OPTIONS.map(option => (
          <button
            key={option.id}
            className={`remix-card ${selectedRemix === option.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedRemix(option.id);
              onRemix(option.id);
            }}
            disabled={isLoading}
          >
            <span className="remix-icon">{option.icon}</span>
            <div className="remix-card-content">
              <span className="remix-name">{option.name}</span>
              <span className="remix-desc">{option.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Blend Mode Toggle */}
      <div className="blend-section">
        <button
          className="blend-toggle"
          onClick={() => setShowBlendMode(!showBlendMode)}
        >
          <span className="blend-icon">🔄</span>
          <span>Blend Two Versions</span>
        </button>

        {showBlendMode && (
          <div className="blend-controls">
            <div className="blend-label">
              <span>Track A</span>
              <span className="blend-ratio">{blendRatio}%</span>
              <span>Track B</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={blendRatio}
              onChange={(e) => setBlendRatio(parseInt(e.target.value))}
              className="blend-slider"
            />
            <button
              className="btn-blend-apply"
              onClick={() => onBlend(trackId, trackId, blendRatio / 100)}
            >
              Apply Blend
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn" title="Share Track">
          <Share2 size={18} />
          <span>Share</span>
        </button>
        <button className="action-btn" title="Download Track">
          <Download size={18} />
          <span>Download</span>
        </button>
        <button className="action-btn" title="Quick Export">
          <Zap size={18} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
};

const remixFlipStyles = `
  .remix-flip-ui {
    background: linear-gradient(135deg, rgba(5,5,5,1) 0%, rgba(12,12,12,0.95) 100%);
    border: 1px solid rgba(255, 20, 147, 0.12);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 600px;
  }

  /* Flip Section */
  .flip-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .flip-button {
    background: linear-gradient(135deg, #ff1493 0%, #ff4da6 100%);
    border: none;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    transition: all 0.3s;
    color: #000;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(255, 20, 147, 0.3);
  }

  .flip-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(255, 20, 147, 0.5);
  }

  .flip-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .flip-button svg {
    font-size: 24px;
    flex-shrink: 0;
  }

  .flip-content {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .flip-label {
    font-size: 16px;
    font-weight: 700;
  }

  .flip-emotion {
    font-size: 12px;
    opacity: 0.8;
    text-transform: capitalize;
  }

  .flip-description {
    font-size: 12px;
    color: #888;
    margin: 0;
    font-style: italic;
  }

  /* Remix Grid */
  .remix-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }

  .remix-card {
    background: #0c0c0c;
    border: 1px solid rgba(255, 20, 147, 0.12);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.2s;
    color: #f0f0f0;
    font-family: 'Inter', sans-serif;
  }

  .remix-card:hover:not(:disabled) {
    border-color: rgba(255, 20, 147, 0.3);
    background: #111;
    transform: translateY(-1px);
  }

  .remix-card.active {
    border-color: #ff1493;
    background: rgba(255, 20, 147, 0.15);
    box-shadow: 0 0 16px rgba(255, 20, 147, 0.3);
  }

  .remix-card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .remix-icon {
    font-size: 28px;
  }

  .remix-card-content {
    display: flex;
    flex-direction: column;
    text-align: center;
    gap: 4px;
  }

  .remix-name {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .remix-desc {
    font-size: 11px;
    color: #888;
  }

  /* Blend Section */
  .blend-section {
    border-top: 1px solid rgba(255, 20, 147, 0.12);
    border-bottom: 1px solid rgba(255, 20, 147, 0.12);
    padding: 16px 0;
  }

  .blend-toggle {
    background: rgba(255, 20, 147, 0.08);
    border: 1px solid rgba(255, 20, 147, 0.2);
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    transition: all 0.2s;
    color: #f0f0f0;
    font-size: 13px;
    font-weight: 600;
    width: 100%;
  }

  .blend-toggle:hover {
    background: rgba(255, 20, 147, 0.12);
    border-color: rgba(255, 20, 147, 0.4);
  }

  .blend-icon {
    font-size: 16px;
  }

  .blend-controls {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .blend-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #888;
    font-family: 'JetBrains Mono', monospace;
  }

  .blend-ratio {
    color: #ff1493;
    font-weight: 700;
    background: rgba(255, 20, 147, 0.1);
    padding: 2px 8px;
    border-radius: 3px;
  }

  .blend-slider {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: #050505;
    outline: none;
    -webkit-appearance: none;
    cursor: pointer;
  }

  .blend-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ff1493;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(255, 20, 147, 0.4);
    transition: all 0.2s;
  }

  .blend-slider::-webkit-slider-thumb:hover {
    transform: scale(1.3);
    box-shadow: 0 0 16px rgba(255, 20, 147, 0.6);
  }

  .blend-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ff1493;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 8px rgba(255, 20, 147, 0.4);
  }

  .btn-blend-apply {
    background: linear-gradient(135deg, rgba(255, 20, 147, 0.8) 0%, rgba(255, 20, 147, 0.6) 100%);
    border: 1px solid #ff1493;
    color: #fff;
    padding: 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-blend-apply:hover {
    background: linear-gradient(135deg, #ff1493 0%, #ff4da6 100%);
    box-shadow: 0 0 12px rgba(255, 20, 147, 0.4);
  }

  /* Quick Actions */
  .quick-actions {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    background: #0c0c0c;
    border: 1px solid rgba(255, 20, 147, 0.12);
    color: #888;
    padding: 10px 12px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
    font-weight: 500;
    flex: 1;
  }

  .action-btn:hover {
    border-color: rgba(255, 20, 147, 0.3);
    color: #ff1493;
    background: rgba(255, 20, 147, 0.08);
  }

  .action-btn svg {
    flex-shrink: 0;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .remix-flip-ui {
      padding: 16px;
      gap: 16px;
    }

    .flip-button {
      padding: 16px;
    }

    .remix-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .quick-actions {
      flex-direction: column;
    }

    .action-btn {
      flex: 1;
      justify-content: center;
    }
  }
`;

export default RemixFlipUI;
