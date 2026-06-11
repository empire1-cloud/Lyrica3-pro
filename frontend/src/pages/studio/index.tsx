import React, { useState, useEffect } from 'react';
import { RobustProducerStudio } from '@/components/RobustProducerStudio';
import { RemixFlipUI } from '@/components/RemixFlipUI';
import { Music, Settings, LogOut } from 'lucide-react';

interface StudioSession {
  userId: string;
  tracks: any[];
  currentTrackId: string | null;
  createdAt: string;
}

export default function StudioPage() {
  const [session, setSession] = useState<StudioSession | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>>([]);

  // Initialize session
  useEffect(() => {
    const initSession = () => {
      const newSession: StudioSession = {
        userId: localStorage.getItem('userId') || `user_${Date.now()}`,
        tracks: [],
        currentTrackId: null,
        createdAt: new Date().toISOString(),
      };
      setSession(newSession);
      localStorage.setItem('userId', newSession.userId);
    };

    initSession();
  }, []);

  const handleTrackGenerate = async (track: any) => {
    setIsGenerating(true);
    try {
      // Mock API call - replace with actual Suno/Lyrica3 API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...track,
          userId: session?.userId,
        }),
      }).catch(() => ({ ok: false })); // Graceful fallback

      if (!response || !response.ok) {
        addNotification('Generated locally (no backend)', 'info');
      } else {
        addNotification(`✅ Track generated: ${track.name}`, 'success');
      }

      setSelectedTrack(track);
    } catch (error) {
      addNotification('Generation started (backend connection pending)', 'info');
      setSelectedTrack(track);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTrackExport = (track: any) => {
    try {
      // Simulate WAV download
      const element = document.createElement('a');
      element.setAttribute('href', '#');
      element.setAttribute('download', `${track.name}.wav`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      addNotification(`📥 Exported: ${track.name}`, 'success');
    } catch (error) {
      addNotification('Export failed', 'error');
    }
  };

  const handleFlip = (newEmotion: string) => {
    if (!selectedTrack) return;

    const flipped = { ...selectedTrack, emotion: newEmotion as any };
    setSelectedTrack(flipped);
    addNotification(`🔄 Flipped to ${newEmotion}!`, 'success');
  };

  const handleRemix = (remixType: string) => {
    if (!selectedTrack) return;
    addNotification(`🎛️ Remixing (${remixType})...`, 'info');
    // Trigger remix API
  };

  const handleBlend = (track1: string, track2: string, ratio: number) => {
    addNotification(`🔀 Blending at ${Math.round(ratio * 100)}%...`, 'info');
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = `notif_${Date.now()}`;
    setNotifications(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  return (
    <div className="studio-page">
      <style>{studioPageStyles}</style>

      {/* Header */}
      <header className="studio-page-header">
        <div className="header-left">
          <div className="logo">
            <Music size={28} />
            <h1>Sonance Pro</h1>
          </div>
          <p className="subtitle">AI Music Production Studio</p>
        </div>

        <div className="header-right">
          <button
            className="header-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button className="header-btn logout-btn" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="studio-main">
        {/* Left Panel - Producer Studio */}
        <section className="studio-section producer-section">
          <RobustProducerStudio
            onTrackGenerate={handleTrackGenerate}
            onTrackExport={handleTrackExport}
          />
        </section>

        {/* Right Panel - Remix & History */}
        <aside className="studio-section remix-section">
          {selectedTrack ? (
            <>
              <div className="selected-track-header">
                <h2>Now Editing</h2>
                <span className="track-name">{selectedTrack.name}</span>
              </div>

              <RemixFlipUI
                trackId={selectedTrack.id}
                currentEmotion={selectedTrack.emotion}
                onFlip={handleFlip}
                onRemix={handleRemix}
                onBlend={handleBlend}
                isLoading={isGenerating}
              />

              <div className="track-metadata">
                <h3>Track Info</h3>
                <div className="metadata-grid">
                  <div className="meta-item">
                    <span className="meta-label">BPM</span>
                    <span className="meta-value">{selectedTrack.bpm}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Key</span>
                    <span className="meta-value">{selectedTrack.key}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Vocal</span>
                    <span className="meta-value">{selectedTrack.vocalPersona}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Emotion</span>
                    <span className="meta-value" data-emotion={selectedTrack.emotion}>
                      {selectedTrack.emotion}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-remix-section">
              <Music size={40} />
              <p>Select a track to remix</p>
            </div>
          )}
        </aside>
      </div>

      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification notification-${notif.type}`}>
            {notif.message}
          </div>
        ))}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="settings-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Settings</h2>
            <div className="settings-group">
              <label>
                <input type="checkbox" defaultChecked /> Auto-save tracks
              </label>
              <label>
                <input type="checkbox" defaultChecked /> Show generation progress
              </label>
              <label>
                <input type="checkbox" /> Dark mode (always on)
              </label>
            </div>
            <div className="settings-footer">
              <button className="btn-close" onClick={() => setShowSettings(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const studioPageStyles = `
  * {
    box-sizing: border-box;
  }

  .studio-page {
    --pink: #ff1493;
    --pink-glow: rgba(255, 20, 147, 0.4);
    --pink-soft: rgba(255, 20, 147, 0.15);
    --pink-dim: rgba(255, 20, 147, 0.08);
    --bg: #050505;
    --bg-card: #0c0c0c;
    --border: rgba(255, 20, 147, 0.12);
    --text: #f0f0f0;
    --text-dim: #888888;

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
  .studio-page-header {
    background: rgba(5, 5, 5, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 100;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo svg {
    color: var(--pink);
    filter: drop-shadow(0 0 8px var(--pink-glow));
  }

  .logo h1 {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 0.05em;
  }

  .subtitle {
    font-size: 12px;
    color: var(--text-dim);
    margin: 0;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .header-right {
    display: flex;
    gap: 8px;
  }

  .header-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-dim);
    width: 40px;
    height: 40px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .header-btn:hover {
    color: var(--pink);
    border-color: rgba(255, 20, 147, 0.3);
    background: rgba(255, 20, 147, 0.08);
  }

  .header-btn.logout-btn:hover {
    color: #ff6b9d;
  }

  /* Main Content */
  .studio-main {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 1px;
    flex: 1;
    overflow: hidden;
    background: var(--border);
  }

  .studio-section {
    background: var(--bg);
    overflow-y: auto;
    padding: 24px;
  }

  .producer-section {
    grid-column: 1;
  }

  .remix-section {
    grid-column: 2;
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .empty-remix-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: var(--text-dim);
  }

  .empty-remix-section svg {
    opacity: 0.3;
  }

  .selected-track-header {
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }

  .selected-track-header h2 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    margin: 0 0 8px 0;
    font-weight: 600;
  }

  .track-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Track Metadata */
  .track-metadata {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
  }

  .track-metadata h3 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-dim);
    margin: 0 0 12px 0;
    font-weight: 600;
  }

  .metadata-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .meta-label {
    font-size: 10px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 600;
  }

  .meta-value {
    font-size: 13px;
    color: var(--text);
    font-weight: 500;
    font-family: 'JetBrains Mono', monospace;
  }

  .meta-value[data-emotion="pain"] {
    color: #ff6b9d;
  }

  .meta-value[data-emotion="playful"] {
    color: #52d7b3;
  }

  .meta-value[data-emotion="mirror"] {
    color: #d4a847;
  }

  /* Notifications */
  .notifications-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 1000;
    pointer-events: none;
  }

  .notification {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-left: 3px solid;
    border-radius: 6px;
    padding: 12px 16px;
    font-size: 13px;
    animation: slideIn 0.3s ease-out;
    pointer-events: auto;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .notification-success {
    border-left-color: #52d7b3;
    color: #52d7b3;
  }

  .notification-error {
    border-left-color: #ff6b9d;
    color: #ff6b9d;
  }

  .notification-info {
    border-left-color: var(--pink);
    color: var(--pink);
  }

  /* Settings Modal */
  .settings-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
  }

  .settings-modal {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    animation: modalIn 0.3s ease-out;
  }

  @keyframes modalIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .settings-modal h2 {
    font-size: 18px;
    margin: 0 0 20px 0;
    font-weight: 700;
  }

  .settings-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  .settings-group label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    cursor: pointer;
  }

  .settings-group input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: var(--pink);
  }

  .settings-footer {
    display: flex;
    gap: 12px;
  }

  .btn-close {
    flex: 1;
    background: var(--pink);
    color: #000;
    border: none;
    padding: 10px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-close:hover {
    box-shadow: 0 0 16px rgba(255, 20, 147, 0.3);
  }

  /* Scrollbar */
  .studio-section::-webkit-scrollbar {
    width: 6px;
  }

  .studio-section::-webkit-scrollbar-track {
    background: var(--bg);
  }

  .studio-section::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 3px;
  }

  .studio-section::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 20, 147, 0.3);
  }

  /* Responsive */
  @media (max-width: 1280px) {
    .studio-main {
      grid-template-columns: 1fr 320px;
    }
  }

  @media (max-width: 1024px) {
    .studio-main {
      grid-template-columns: 1fr;
    }

    .remix-section {
      display: none;
    }
  }
`;
