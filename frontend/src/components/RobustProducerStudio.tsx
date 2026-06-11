import React, { useState, useRef, useEffect } from 'react';
import { Music, Settings, Save, RotateCcw, Plus, Trash2, Volume2, Sliders } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  emotion: 'pain' | 'playful' | 'mirror';
  bpm: number;
  key: string;
  intensity: number;
  vocals: {
    breathIntensity: number;
    vocalFryAmount: number;
    emotionalBreakFreq: number;
    proximityEffect: number;
    closedMouthResonance: boolean;
  };
  drums: {
    swing: number;
    snareDrag: number;
    grooveType: 'straight' | 'lazy' | 'locked';
  };
  instrumentation: {
    chordQuality: 'major7' | 'minor9' | 'sus4' | 'diminished';
    warmthBoost: number;
    analogSaturation: number;
    frequencyBump: number;
  };
  vocalPersona: string;
  generatedAt: string;
  waveformData: number[];
  isPlaying: boolean;
}

interface ProducerStudioProps {
  onTrackGenerate?: (track: Track) => void;
  onTrackExport?: (track: Track) => void;
}

export const RobustProducerStudio: React.FC<ProducerStudioProps> = ({
  onTrackGenerate,
  onTrackExport,
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const selectedTrack = tracks.find(t => t.id === selectedTrackId);

  // Initialize Web Audio API
  useEffect(() => {
    const initAudio = async () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }
    };
    initAudio();
  }, []);

  const createNewTrack = () => {
    const newTrack: Track = {
      id: `track_${Date.now()}`,
      name: `Untitled Track ${tracks.length + 1}`,
      emotion: 'mirror',
      bpm: 80,
      key: 'B-Minor',
      intensity: 50,
      vocals: {
        breathIntensity: 0.3,
        vocalFryAmount: 0.2,
        emotionalBreakFreq: 0.15,
        proximityEffect: 0.4,
        closedMouthResonance: true,
      },
      drums: {
        swing: 12,
        snareDrag: 15,
        grooveType: 'lazy',
      },
      instrumentation: {
        chordQuality: 'major7',
        warmthBoost: 75,
        analogSaturation: 60,
        frequencyBump: 250,
      },
      vocalPersona: 'Hurting Girl',
      generatedAt: new Date().toISOString(),
      waveformData: generateMockWaveform(),
      isPlaying: false,
    };
    
    setTracks([...tracks, newTrack]);
    setSelectedTrackId(newTrack.id);
  };

  const generateMockWaveform = (): number[] => {
    return Array.from({ length: 256 }, () => Math.random() * 0.8 + 0.2);
  };

  const handleGenerateTrack = async () => {
    if (!selectedTrack) return;
    
    setIsGenerating(true);
    // Simulate API call to Suno/Lyrica3 backend
    setTimeout(() => {
      const updatedTrack = {
        ...selectedTrack,
        waveformData: generateMockWaveform(),
        generatedAt: new Date().toISOString(),
      };
      
      const updatedTracks = tracks.map(t => t.id === selectedTrack.id ? updatedTrack : t);
      setTracks(updatedTracks);
      
      onTrackGenerate?.(updatedTrack);
      setIsGenerating(false);
    }, 2000);
  };

  const handleDeleteTrack = (trackId: string) => {
    const filtered = tracks.filter(t => t.id !== trackId);
    setTracks(filtered);
    if (selectedTrackId === trackId) {
      setSelectedTrackId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  const updateTrackParam = (param: keyof Track, value: any) => {
    if (!selectedTrack) return;
    
    const updated = { ...selectedTrack, [param]: value };
    const updatedTracks = tracks.map(t => t.id === selectedTrack.id ? updated : t);
    setTracks(updatedTracks);
  };

  const updateVocalParam = (param: keyof Track['vocals'], value: any) => {
    if (!selectedTrack) return;
    
    const updated = {
      ...selectedTrack,
      vocals: { ...selectedTrack.vocals, [param]: value }
    };
    const updatedTracks = tracks.map(t => t.id === selectedTrack.id ? updated : t);
    setTracks(updatedTracks);
  };

  const updateDrumParam = (param: keyof Track['drums'], value: any) => {
    if (!selectedTrack) return;
    
    const updated = {
      ...selectedTrack,
      drums: { ...selectedTrack.drums, [param]: value }
    };
    const updatedTracks = tracks.map(t => t.id === selectedTrack.id ? updated : t);
    setTracks(updatedTracks);
  };

  const updateInstrumentParam = (param: keyof Track['instrumentation'], value: any) => {
    if (!selectedTrack) return;
    
    const updated = {
      ...selectedTrack,
      instrumentation: { ...selectedTrack.instrumentation, [param]: value }
    };
    const updatedTracks = tracks.map(t => t.id === selectedTrack.id ? updated : t);
    setTracks(updatedTracks);
  };

  return (
    <div className="producer-studio">
      <style>{producerStudioStyles}</style>
      
      {/* Header */}
      <header className="studio-header">
        <div className="header-logo">
          <Music className="icon" />
          <h1>Sonance Pro Studio</h1>
        </div>
        <div className="header-info">
          <span className="badge">SOULFIRE ENGINE</span>
          <span className="badge secondary">48KHz/24-BIT</span>
        </div>
      </header>

      <div className="studio-container">
        {/* Left Sidebar - Track List */}
        <aside className="track-list-sidebar">
          <div className="sidebar-header">
            <h3>Sessions</h3>
            <button 
              className="btn-icon add-track-btn"
              onClick={createNewTrack}
              title="New Track"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="track-items">
            {tracks.length === 0 ? (
              <div className="empty-state">
                <p>No tracks yet</p>
                <button 
                  className="btn-secondary-small"
                  onClick={createNewTrack}
                >
                  Create First Track
                </button>
              </div>
            ) : (
              tracks.map(track => (
                <div
                  key={track.id}
                  className={`track-item ${selectedTrackId === track.id ? 'active' : ''}`}
                  onClick={() => setSelectedTrackId(track.id)}
                >
                  <div className="track-item-header">
                    <span className="track-name">{track.name}</span>
                    <span className="track-emotion" data-emotion={track.emotion}>
                      {track.emotion}
                    </span>
                  </div>
                  <div className="track-meta">
                    <span className="meta-item">{track.bpm} BPM</span>
                    <span className="meta-item">{track.key}</span>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTrack(track.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Editor */}
        <main className="studio-editor">
          {selectedTrack ? (
            <>
              {/* Track Header */}
              <div className="editor-header">
                <div className="track-title-edit">
                  <input
                    type="text"
                    value={selectedTrack.name}
                    onChange={(e) => updateTrackParam('name', e.target.value)}
                    className="track-name-input"
                  />
                </div>
                <div className="header-actions">
                  <button 
                    className="btn-primary"
                    onClick={handleGenerateTrack}
                    disabled={isGenerating}
                  >
                    {isGenerating ? '✨ Generating...' : '🔥 Generate'}
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => onTrackExport?.(selectedTrack)}
                  >
                    <Save size={16} /> Export
                  </button>
                </div>
              </div>

              {/* Waveform Visualizer */}
              <div className="waveform-container">
                <WaveformDisplay 
                  data={selectedTrack.waveformData}
                  isPlaying={selectedTrack.isPlaying}
                />
              </div>

              {/* Main Controls Panel */}
              <div className="controls-grid">
                {/* Emotion & Core */}
                <ControlSection title="Emotional Core" icon={<Volume2 size={16} />}>
                  <div className="control-group">
                    <label>Emotion Spectrum</label>
                    <div className="emotion-selector">
                      {(['pain', 'playful', 'mirror'] as const).map(emotion => (
                        <button
                          key={emotion}
                          className={`emotion-btn ${selectedTrack.emotion === emotion ? 'active' : ''}`}
                          onClick={() => updateTrackParam('emotion', emotion)}
                        >
                          {emotion === 'pain' && '💔'}
                          {emotion === 'playful' && '😊'}
                          {emotion === 'mirror' && '🪞'}
                          {emotion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <SliderControl
                    label="Intensity"
                    min={0}
                    max={100}
                    value={selectedTrack.intensity}
                    onChange={(val) => updateTrackParam('intensity', val)}
                  />
                </ControlSection>

                {/* Vocal Controls */}
                <ControlSection title="Biometric Realism" icon={<Sliders size={16} />}>
                  <SliderControl
                    label="Breath Intensity"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedTrack.vocals.breathIntensity}
                    onChange={(val) => updateVocalParam('breathIntensity', val)}
                  />
                  <SliderControl
                    label="Vocal Fry"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedTrack.vocals.vocalFryAmount}
                    onChange={(val) => updateVocalParam('vocalFryAmount', val)}
                  />
                  <SliderControl
                    label="Emotional Break Frequency"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedTrack.vocals.emotionalBreakFreq}
                    onChange={(val) => updateVocalParam('emotionalBreakFreq', val)}
                  />
                  <SliderControl
                    label="Proximity Effect"
                    min={0}
                    max={1}
                    step={0.05}
                    value={selectedTrack.vocals.proximityEffect}
                    onChange={(val) => updateVocalParam('proximityEffect', val)}
                  />
                  <CheckboxControl
                    label="Closed-Mouth Resonance"
                    checked={selectedTrack.vocals.closedMouthResonance}
                    onChange={(val) => updateVocalParam('closedMouthResonance', val)}
                  />
                </ControlSection>

                {/* Drum Controls */}
                <ControlSection title="Rhythm Engine">
                  <div className="control-group">
                    <label>Groove Type</label>
                    <select
                      value={selectedTrack.drums.grooveType}
                      onChange={(e) => updateDrumParam('grooveType', e.target.value as any)}
                      className="select-input"
                    >
                      <option value="straight">Straight</option>
                      <option value="lazy">Lazy Pocket (Late-Pocket)</option>
                      <option value="locked">Locked In</option>
                    </select>
                  </div>
                  <SliderControl
                    label="Swing (ms)"
                    min={0}
                    max={30}
                    value={selectedTrack.drums.swing}
                    onChange={(val) => updateDrumParam('swing', val)}
                  />
                  <SliderControl
                    label="Snare Drag (ms)"
                    min={0}
                    max={30}
                    value={selectedTrack.drums.snareDrag}
                    onChange={(val) => updateDrumParam('snareDrag', val)}
                  />
                </ControlSection>

                {/* Instrumentation */}
                <ControlSection title="Harmonic Character">
                  <div className="control-group">
                    <label>Chord Quality</label>
                    <select
                      value={selectedTrack.instrumentation.chordQuality}
                      onChange={(e) => updateInstrumentParam('chordQuality', e.target.value as any)}
                      className="select-input"
                    >
                      <option value="major7">Major 7th (Bright with Bruise)</option>
                      <option value="minor9">Minor 9th (Deep Warmth)</option>
                      <option value="sus4">Sus4 (Unresolved Tension)</option>
                      <option value="diminished">Diminished (Dark, Complex)</option>
                    </select>
                  </div>
                  <SliderControl
                    label="Warmth Boost (%)"
                    min={0}
                    max={100}
                    value={selectedTrack.instrumentation.warmthBoost}
                    onChange={(val) => updateInstrumentParam('warmthBoost', val)}
                  />
                  <SliderControl
                    label="Analog Saturation"
                    min={0}
                    max={100}
                    value={selectedTrack.instrumentation.analogSaturation}
                    onChange={(val) => updateInstrumentParam('analogSaturation', val)}
                  />
                  <SliderControl
                    label="Freq Bump (Hz)"
                    min={0}
                    max={1000}
                    step={50}
                    value={selectedTrack.instrumentation.frequencyBump}
                    onChange={(val) => updateInstrumentParam('frequencyBump', val)}
                  />
                </ControlSection>

                {/* Session Meta */}
                <ControlSection title="Session Info">
                  <div className="control-group">
                    <label>BPM</label>
                    <input
                      type="number"
                      min={60}
                      max={180}
                      value={selectedTrack.bpm}
                      onChange={(e) => updateTrackParam('bpm', parseInt(e.target.value))}
                      className="number-input"
                    />
                  </div>
                  <div className="control-group">
                    <label>Key</label>
                    <select
                      value={selectedTrack.key}
                      onChange={(e) => updateTrackParam('key', e.target.value)}
                      className="select-input"
                    >
                      <option>C-Major</option>
                      <option>B-Minor</option>
                      <option>D-Major</option>
                      <option>A-Minor</option>
                      <option>E-Major</option>
                      <option>C#-Minor</option>
                      <option>G-Major</option>
                      <option>E-Minor</option>
                      <option>F-Major</option>
                      <option>D-Minor</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Vocal Persona</label>
                    <select
                      value={selectedTrack.vocalPersona}
                      onChange={(e) => updateTrackParam('vocalPersona', e.target.value)}
                      className="select-input"
                    >
                      <option>Hurting Girl</option>
                      <option>ShadyBoy</option>
                      <option>Duo (Girl + Boy)</option>
                      <option>Choir (3+)</option>
                      <option>Spoken Word</option>
                      <option>Ad-lib Only</option>
                    </select>
                  </div>
                </ControlSection>
              </div>

              {/* Advanced Settings Toggle */}
              <div className="advanced-toggle">
                <button 
                  className="btn-ghost"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <Settings size={16} />
                  {showAdvanced ? 'Hide' : 'Show'} Advanced
                </button>
              </div>

              {showAdvanced && (
                <AdvancedSettings track={selectedTrack} onUpdate={updateTrackParam} />
              )}
            </>
          ) : (
            <div className="empty-editor">
              <Music size={48} />
              <h2>No Track Selected</h2>
              <p>Create or select a track to begin editing</p>
              <button className="btn-primary" onClick={createNewTrack}>
                <Plus size={16} /> Create New Track
              </button>
            </div>
          )}
        </main>

        {/* Right Sidebar - History & Presets */}
        <aside className="history-sidebar">
          <div className="sidebar-header">
            <h3>Presets</h3>
          </div>
          <div className="presets-list">
            <PresetCard
              name="Soulfire Default"
              emotion="mirror"
              bpm={80}
              key="B-Minor"
              onClick={() => {
                if (selectedTrack) {
                  updateTrackParam('emotion', 'mirror');
                  updateTrackParam('bpm', 80);
                  updateTrackParam('key', 'B-Minor');
                }
              }}
            />
            <PresetCard
              name="Chicano Soul"
              emotion="pain"
              bpm={92}
              key="E-Minor"
              onClick={() => {
                if (selectedTrack) {
                  updateTrackParam('emotion', 'pain');
                  updateTrackParam('bpm', 92);
                  updateTrackParam('key', 'E-Minor');
                }
              }}
            />
            <PresetCard
              name="Late Night Cruising"
              emotion="playful"
              bpm={76}
              key="A-Minor"
              onClick={() => {
                if (selectedTrack) {
                  updateTrackParam('emotion', 'playful');
                  updateTrackParam('bpm', 76);
                  updateTrackParam('key', 'A-Minor');
                }
              }}
            />
          </div>

          <div className="sidebar-divider" />

          <div className="sidebar-header">
            <h3>Recent</h3>
          </div>
          <div className="recent-list">
            {tracks.slice(-3).map(track => (
              <div key={track.id} className="recent-item">
                <span>{track.name}</span>
                <span className="time">{new Date(track.generatedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

// Sub-Components
interface ControlSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const ControlSection: React.FC<ControlSectionProps> = ({ title, icon, children }) => (
  <div className="control-section">
    <div className="section-title">
      {icon}
      <span>{title}</span>
    </div>
    <div className="section-content">
      {children}
    </div>
  </div>
);

interface SliderControlProps {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
}) => (
  <div className="control-group">
    <div className="label-with-value">
      <label>{label}</label>
      <span className="value-display">{value.toFixed(0)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="slider"
    />
  </div>
);

interface CheckboxControlProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const CheckboxControl: React.FC<CheckboxControlProps> = ({ label, checked, onChange }) => (
  <div className="control-group">
    <label className="checkbox-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="checkbox"
      />
      <span>{label}</span>
    </label>
  </div>
);

interface PresetCardProps {
  name: string;
  emotion: string;
  bpm: number;
  key: string;
  onClick: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ name, emotion, bpm, key, onClick }) => (
  <button className="preset-card" onClick={onClick}>
    <div className="preset-name">{name}</div>
    <div className="preset-meta">
      <span>{emotion}</span>
      <span>{bpm}bpm • {key}</span>
    </div>
  </button>
);

interface WaveformDisplayProps {
  data: number[];
  isPlaying: boolean;
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ data, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.strokeStyle = '#ff1493';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(255, 20, 147, 0.5)';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    data.forEach((value, index) => {
      const x = (index / data.length) * width;
      const y = centerY - (value * height * 0.4);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw baseline
    ctx.strokeStyle = 'rgba(255, 20, 147, 0.2)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
  }, [data]);

  return (
    <div className="waveform-wrapper">
      <canvas
        ref={canvasRef}
        width={800}
        height={120}
        className={`waveform-canvas ${isPlaying ? 'playing' : ''}`}
      />
      <div className="waveform-label">
        <span>Studio-Grade Waveform • 48KHz/24-BIT</span>
      </div>
    </div>
  );
};

const AdvancedSettings: React.FC<{
  track: Track;
  onUpdate: (key: keyof Track, value: any) => void;
}> = ({ track, onUpdate }) => (
  <div className="advanced-settings">
    <h3>Advanced Signal Processing</h3>
    <p className="settings-hint">Fine-tune compression, EQ, reverb, and spatial dynamics.</p>
    <div className="settings-placeholder">
      <code>
        {JSON.stringify({
          ducking: 'enabled',
          eqPreset: 'warm_analog',
          reverbMix: '0.35',
          delayTime: '375ms',
          compThreshold: '-18dB',
          compRatio: '4:1'
        }, null, 2)}
      </code>
    </div>
  </div>
);

// Styles
const producerStudioStyles = `
  * {
    box-sizing: border-box;
  }

  .producer-studio {
    --pink: #ff1493;
    --pink-glow: rgba(255, 20, 147, 0.4);
    --pink-soft: rgba(255, 20, 147, 0.15);
    --pink-dim: rgba(255, 20, 147, 0.08);
    --purple: #9b59b6;
    --gold: #d4a847;
    --bg: #050505;
    --bg-card: #0c0c0c;
    --bg-card-hover: #111111;
    --border: rgba(255, 20, 147, 0.12);
    --border-hover: rgba(255, 20, 147, 0.3);
    --text: #f0f0f0;
    --text-dim: #888888;
    --text-muted: #666666;

    width: 100%;
    height: 100vh;
    background: var(--bg);
    color: var(--text);
    display: flex;
    flex-direction: column;
    font-family: 'Inter', -apple-system, sans-serif;
    overflow: hidden;
  }

  /* Header */
  .studio-header {
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(5, 5, 5, 0.95);
    backdrop-filter: blur(10px);
    z-index: 50;
  }

  .header-logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-logo h1 {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin: 0;
  }

  .header-logo .icon {
    color: var(--pink);
    filter: drop-shadow(0 0 8px var(--pink-glow));
  }

  .header-info {
    display: flex;
    gap: 12px;
  }

  .badge {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--pink);
    border: 1px solid var(--border-hover);
    padding: 6px 12px;
    border-radius: 4px;
    background: var(--pink-dim);
  }

  .badge.secondary {
    color: var(--gold);
    border-color: rgba(212, 168, 71, 0.3);
    background: rgba(212, 168, 71, 0.08);
  }

  /* Main Container */
  .studio-container {
    display: grid;
    grid-template-columns: 240px 1fr 280px;
    gap: 1px;
    flex: 1;
    overflow: hidden;
    background: var(--border);
  }

  /* Sidebar Styling */
  .track-list-sidebar,
  .history-sidebar {
    background: var(--bg-card);
    overflow-y: auto;
    padding: 16px;
    border-right: 1px solid var(--border);
  }

  .history-sidebar {
    border-right: none;
    border-left: 1px solid var(--border);
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }

  .sidebar-header h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    margin: 0;
  }

  .btn-icon {
    background: var(--pink-dim);
    border: 1px solid var(--border-hover);
    color: var(--pink);
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-icon:hover {
    background: var(--border-hover);
    box-shadow: 0 0 12px var(--pink-glow);
  }

  /* Track Items */
  .track-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .empty-state {
    text-align: center;
    padding: 24px 8px;
    color: var(--text-muted);
  }

  .empty-state p {
    font-size: 12px;
    margin-bottom: 12px;
  }

  .track-item {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .track-item:hover {
    border-color: var(--border-hover);
    background: var(--bg-card-hover);
  }

  .track-item.active {
    border-color: var(--pink);
    background: var(--pink-dim);
    box-shadow: 0 0 12px var(--pink-glow);
  }

  .track-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
    gap: 8px;
  }

  .track-name {
    font-size: 13px;
    font-weight: 600;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-emotion {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 3px;
    white-space: nowrap;
    background: var(--border);
  }

  .track-emotion[data-emotion="pain"] { color: #ff6b9d; }
  .track-emotion[data-emotion="playful"] { color: #52d7b3; }
  .track-emotion[data-emotion="mirror"] { color: var(--gold); }

  .track-meta {
    display: flex;
    gap: 8px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .meta-item {
    font-family: 'JetBrains Mono', monospace;
  }

  .btn-delete {
    position: absolute;
    top: 8px;
    right: 8px;
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s;
  }

  .track-item:hover .btn-delete {
    opacity: 1;
    color: #ff6b9d;
  }

  .btn-delete:hover {
    transform: scale(1.2);
  }

  /* Editor */
  .studio-editor {
    background: var(--bg);
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .empty-editor {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--text-muted);
  }

  .empty-editor svg {
    opacity: 0.3;
  }

  .empty-editor h2 {
    font-size: 20px;
    margin: 0;
    color: var(--text-dim);
  }

  .empty-editor p {
    margin: 0 0 16px 0;
  }

  /* Editor Header */
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  .track-title-edit {
    flex: 1;
  }

  .track-name-input {
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text);
    font-size: 24px;
    font-weight: 700;
    padding: 8px 12px;
    border-radius: 6px;
    width: 100%;
    font-family: 'Inter', sans-serif;
  }

  .track-name-input:focus {
    outline: none;
    border-color: var(--pink);
    box-shadow: 0 0 12px var(--pink-glow);
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  /* Buttons */
  .btn-primary,
  .btn-secondary,
  .btn-ghost,
  .btn-secondary-small {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-primary {
    background: var(--pink);
    color: #000;
    padding: 10px 20px;
  }

  .btn-primary:hover:not(:disabled) {
    box-shadow: 0 0 20px var(--pink-glow);
    transform: translateY(-1px);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border-hover);
    padding: 10px 16px;
  }

  .btn-secondary:hover {
    border-color: var(--pink);
    color: var(--pink);
    background: var(--pink-dim);
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-dim);
    padding: 8px 12px;
  }

  .btn-ghost:hover {
    color: var(--pink);
    background: var(--pink-dim);
  }

  .btn-secondary-small {
    background: var(--pink-dim);
    color: var(--pink);
    border: 1px solid var(--border-hover);
    padding: 8px 12px;
    font-size: 12px;
  }

  .btn-secondary-small:hover {
    border-color: var(--pink);
  }

  /* Waveform */
  .waveform-container {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
  }

  .waveform-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .waveform-canvas {
    width: 100%;
    height: auto;
    border-radius: 4px;
    background: var(--bg);
  }

  .waveform-canvas.playing {
    animation: waveform-pulse 0.5s ease-in-out;
  }

  @keyframes waveform-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.95; }
  }

  .waveform-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
    letter-spacing: 0.05em;
  }

  /* Controls Grid */
  .controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }

  .control-section {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .section-title svg {
    color: var(--pink);
    flex-shrink: 0;
  }

  .section-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .control-group label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text);
  }

  .label-with-value {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .value-display {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--pink);
    font-weight: 600;
  }

  /* Sliders */
  .slider {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: var(--bg);
    outline: none;
    -webkit-appearance: none;
    cursor: pointer;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--pink);
    cursor: pointer;
    box-shadow: 0 0 8px var(--pink-glow);
    transition: all 0.2s;
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.3);
    box-shadow: 0 0 16px var(--pink-glow);
  }

  .slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--pink);
    cursor: pointer;
    border: none;
    box-shadow: 0 0 8px var(--pink-glow);
    transition: all 0.2s;
  }

  .slider::-moz-range-thumb:hover {
    transform: scale(1.3);
    box-shadow: 0 0 16px var(--pink-glow);
  }

  .slider::-moz-range-track {
    background: transparent;
    border: none;
  }

  /* Inputs */
  .select-input,
  .number-input {
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 8px 10px;
    border-radius: 4px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
  }

  .select-input:focus,
  .number-input:focus {
    outline: none;
    border-color: var(--pink);
    box-shadow: 0 0 8px var(--pink-glow);
  }

  /* Emotion Selector */
  .emotion-selector {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .emotion-btn {
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text-dim);
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .emotion-btn:hover {
    border-color: var(--border-hover);
  }

  .emotion-btn.active {
    background: var(--pink-dim);
    border-color: var(--pink);
    color: var(--pink);
    box-shadow: 0 0 8px var(--pink-glow);
  }

  /* Checkbox */
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 12px;
  }

  .checkbox {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: var(--pink);
  }

  /* Advanced Settings */
  .advanced-toggle {
    text-align: center;
  }

  .advanced-settings {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px;
    margin-top: 16px;
  }

  .advanced-settings h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--text);
  }

  .settings-hint {
    font-size: 12px;
    color: var(--text-muted);
    margin: 0 0 16px 0;
    font-style: italic;
  }

  .settings-placeholder {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 12px;
    overflow-x: auto;
  }

  .settings-placeholder code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
    line-height: 1.6;
  }

  /* Presets */
  .presets-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .preset-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text);
    font-family: 'Inter', sans-serif;
  }

  .preset-card:hover {
    border-color: var(--pink);
    background: var(--pink-dim);
    box-shadow: 0 0 8px var(--pink-glow);
  }

  .preset-name {
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .preset-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 11px;
    color: var(--text-muted);
    font-family: 'JetBrains Mono', monospace;
  }

  .preset-meta span {
    text-transform: capitalize;
  }

  .sidebar-divider {
    height: 1px;
    background: var(--border);
    margin: 16px 0;
  }

  /* Recent */
  .recent-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .recent-item {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px;
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .recent-item span:first-child {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }

  .recent-item .time {
    font-family: 'JetBrains Mono', monospace;
    color: var(--text-muted);
    font-size: 10px;
    white-space: nowrap;
  }

  /* Scrollbar Styling */
  .track-list-sidebar::-webkit-scrollbar,
  .history-sidebar::-webkit-scrollbar,
  .studio-editor::-webkit-scrollbar {
    width: 6px;
  }

  .track-list-sidebar::-webkit-scrollbar-track,
  .history-sidebar::-webkit-scrollbar-track,
  .studio-editor::-webkit-scrollbar-track {
    background: var(--bg-card);
  }

  .track-list-sidebar::-webkit-scrollbar-thumb,
  .history-sidebar::-webkit-scrollbar-thumb,
  .studio-editor::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }

  .track-list-sidebar::-webkit-scrollbar-thumb:hover,
  .history-sidebar::-webkit-scrollbar-thumb:hover,
  .studio-editor::-webkit-scrollbar-thumb:hover {
    background: var(--border-hover);
  }

  /* Responsive */
  @media (max-width: 1400px) {
    .studio-container {
      grid-template-columns: 200px 1fr 240px;
    }

    .controls-grid {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }
  }

  @media (max-width: 1024px) {
    .studio-container {
      grid-template-columns: 1fr;
    }

    .track-list-sidebar,
    .history-sidebar {
      display: none;
    }

    .controls-grid {
      grid-template-columns: 1fr;
    }
  }
`;

export default RobustProducerStudio;
