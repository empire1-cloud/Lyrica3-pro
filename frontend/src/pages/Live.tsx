import React, { useEffect, useRef, useState } from 'react';
import { Users, Radio, Heart, Share2, MessageCircle } from 'lucide-react';
import './Live.css';

interface LiveSession {
  id: string;
  title: string;
  listeners: number;
  currentBeat: string;
  currentMood: 'pain' | 'playful' | 'neutral';
  sentiment: {
    emoji: string;
    label: string;
    count: number;
  }[];
}

const Live: React.FC = () => {
  const [session, setSession] = useState<LiveSession>({
    id: 'live-001',
    title: 'Midnight Soul Sessions',
    listeners: 12543,
    currentBeat: '🔥 Rio Drift Phonk',
    currentMood: 'pain',
    sentiment: [
      { emoji: '💔', label: 'feeling this', count: 2100 },
      { emoji: '😭', label: 'too real', count: 1800 },
      { emoji: '🎵', label: 'vibe check', count: 3200 },
      { emoji: '❤️', label: 'healing energy', count: 1500 },
    ],
  });

  const [sentiment, setSentiment] = useState(session.sentiment);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    // Animate listener count
    const interval = setInterval(() => {
      setSession((prev) => ({
        ...prev,
        listeners: prev.listeners + Math.floor(Math.random() * 10 - 3),
      }));
    }, 2000);

    // Animate sentiment counts
    const sentimentInterval = setInterval(() => {
      setSentiment((prev) =>
        prev.map((s) => ({
          ...s,
          count: s.count + Math.floor(Math.random() * 20 - 5),
        }))
      );
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(sentimentInterval);
    };
  }, []);

  // Waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const animate = () => {
      ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgb(255, 107, 107)';
      ctx.lineWidth = 2;
      ctx.beginPath();

      for (let x = 0; x < canvas.width; x++) {
        const y =
          canvas.height / 2 +
          Math.sin((x + time) * 0.01) * 30 +
          Math.sin((x + time * 0.5) * 0.005) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();

      time += 2;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleSentimentVote = (emoji: string) => {
    setSentiment((prev) =>
      prev.map((s) =>
        s.emoji === emoji ? { ...s, count: s.count + 1 } : s
      )
    );
  };

  return (
    <div className="live-container">
      {/* Header */}
      <header className="live-header">
        <div className="header-content">
          <div className="live-badge">
            <Radio size={16} />
            <span>LIVE NOW</span>
          </div>
          <h1 className="session-title">{session.title}</h1>
          <div className="listener-count">
            <Users size={18} />
            <span className="count">{session.listeners.toLocaleString()}</span>
            <span className="label">Listening</span>
          </div>
        </div>
      </header>

      <main className="live-main">
        {/* Now Playing */}
        <section className="now-playing-section">
          <h2 className="section-label">Now Playing</h2>
          <div className="waveform-wrapper">
            <canvas ref={canvasRef} className="waveform-live" width={800} height={200} />
          </div>
          <p className="current-beat">{session.currentBeat}</p>
        </section>

        {/* Sentiment Feed */}
        <section className="sentiment-section">
          <h2 className="section-label">💬 Community Vibe</h2>
          <div className="sentiment-buttons">
            {sentiment.map((s) => (
              <button
                key={s.emoji}
                className="sentiment-btn"
                onClick={() => handleSentimentVote(s.emoji)}
              >
                <span className="sentiment-emoji">{s.emoji}</span>
                <span className="sentiment-label">{s.label}</span>
                <span className="sentiment-count">{s.count.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Influence Controls */}
        <section className="influence-section">
          <h2 className="section-label">🎚️ Shape the Music</h2>
          <div className="influence-controls">
            <button className="influence-btn pain">
              <span>💔</span>
              Add More Pain
            </button>
            <button className="influence-btn playful">
              <span>😊</span>
              Add More Joy
            </button>
            <button className="influence-btn neutral">
              <span>⚡</span>
              Boost Energy
            </button>
          </div>
        </section>

        {/* Live Chat */}
        <section className="chat-section">
          <h2 className="section-label">
            <MessageCircle size={18} />
            Live Chat
          </h2>
          <div className="chat-messages">
            <div className="chat-message">
              <span className="chat-user">User1</span>
              <span className="chat-text">this hits different 🔥</span>
              <span className="chat-time">now</span>
            </div>
            <div className="chat-message">
              <span className="chat-user">SoulCreator</span>
              <span className="chat-text">need this track NOW</span>
              <span className="chat-time">5s ago</span>
            </div>
            <div className="chat-message">
              <span className="chat-user">MusicLover</span>
              <span className="chat-text">the production is insane</span>
              <span className="chat-time">12s ago</span>
            </div>
          </div>
          <div className="chat-input-wrapper">
            <input type="text" placeholder="Share your thoughts..." className="chat-input" />
            <button className="chat-send">Send</button>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="actions-section">
          <button
            className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            {isLiked ? 'Loved' : 'Love This'}
          </button>
          <button className="action-btn share-btn">
            <Share2 size={20} />
            Share Session
          </button>
        </section>
      </main>
    </div>
  );
};

export default Live;
