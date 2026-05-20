import React, { useEffect } from 'react';

const LANDING_STYLES = `
/* ═══════════════════════════════════════════════════
   LYRICA 3 PRO — BLACK + NEON PINK
   SGV / Chicano-rooted. Barrio-premium.
   ═══════════════════════════════════════════════════ */

:root {
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
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', -apple-system, sans-serif;
  line-height: 1.6;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ── STATUS BAR ── */
.status-bar {
  background: #0a0a0a;
  border-bottom: 1px solid var(--border);
  padding: 8px 0;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.status-bar-inner {
  display: flex;
  animation: scroll-left 30s linear infinite;
  white-space: nowrap;
  gap: 40px;
}

@keyframes scroll-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.status-item {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--pink);
  flex-shrink: 0;
}

.status-item .dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--pink);
  border-radius: 50%;
  margin-right: 6px;
  box-shadow: 0 0 6px var(--pink-glow);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── NAV ── */
nav {
  position: fixed;
  top: 33px;
  left: 0;
  right: 0;
  z-index: 99;
  background: rgba(5, 5, 5, 0.85);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  padding: 0 40px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.15em;
  color: var(--pink);
  text-decoration: none;
  text-shadow: 0 0 20px var(--pink-glow);
}

.nav-links {
  display: flex;
  gap: 32px;
  list-style: none;
}

.nav-links a {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-dim);
  text-decoration: none;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: color 0.3s;
}

.nav-links a:hover { color: var(--pink); }

.nav-cta {
  background: var(--pink);
  color: #000;
  padding: 10px 24px;
  border-radius: 6px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}

.nav-cta:hover {
  box-shadow: 0 0 30px var(--pink-glow);
  transform: translateY(-1px);
}

/* ── HERO ── */
.hero {
  padding: 200px 40px 120px;
  text-align: center;
  position: relative;
  overflow: hidden;
  background: url('/artists/carnival_vibe.jpg') center center / cover no-repeat;
}
.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.92) 50%, rgba(5,5,5,1) 100%);
  z-index: 0;
}
.hero > * { position: relative; z-index: 1; }

.hero::before {
  content: '';
  position: absolute;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, var(--pink-glow) 0%, transparent 60%);
  opacity: 0.15;
  pointer-events: none;
}

.hero-badge {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--pink);
  border: 1px solid var(--border-hover);
  padding: 8px 20px;
  border-radius: 100px;
  margin-bottom: 32px;
  background: var(--pink-dim);
}

.hero h1 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(48px, 7vw, 88px);
  font-weight: 700;
  line-height: 1.05;
  margin-bottom: 24px;
  letter-spacing: -0.03em;
}

.hero h1 .pink {
  color: var(--pink);
  text-shadow: 0 0 40px var(--pink-glow);
}

.hero-sub {
  font-size: 20px;
  color: var(--text-dim);
  max-width: 640px;
  margin: 0 auto 48px;
  line-height: 1.7;
  font-weight: 300;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-bottom: 48px;
  flex-wrap: wrap;
}

.hero-stat {
  text-align: center;
}

.hero-stat .num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 32px;
  font-weight: 700;
  color: var(--pink);
  text-shadow: 0 0 20px var(--pink-glow);
}

.hero-stat .label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-muted);
  margin-top: 4px;
}

.hero-ctas {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary {
  background: var(--pink);
  color: #000;
  padding: 16px 40px;
  border-radius: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
}

.btn-primary:hover {
  box-shadow: 0 0 40px var(--pink-glow);
  transform: translateY(-2px);
}

.btn-secondary {
  background: transparent;
  color: var(--text);
  padding: 16px 40px;
  border-radius: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border: 1px solid var(--border-hover);
  transition: all 0.3s;
}

.btn-secondary:hover {
  border-color: var(--pink);
  color: var(--pink);
  background: var(--pink-dim);
}

/* ── SECTIONS ── */
section { padding: 100px 40px; }

.section-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--pink);
  margin-bottom: 12px;
}

.section-title {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(32px, 4vw, 52px);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
  line-height: 1.15;
}

.section-sub {
  font-size: 18px;
  color: var(--text-dim);
  max-width: 640px;
  line-height: 1.7;
  font-weight: 300;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 0 40px;
}

/* ── PROBLEM SECTION ── */
.problem {
  background: linear-gradient(180deg, var(--bg) 0%, #080808 100%);
}

.problem-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 48px;
}

.problem-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px;
  transition: all 0.3s;
}

.problem-card:hover {
  border-color: var(--border-hover);
  background: var(--bg-card-hover);
}

.problem-card .icon {
  font-size: 28px;
  margin-bottom: 16px;
}

.problem-card h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.problem-card p {
  font-size: 14px;
  color: var(--text-dim);
  line-height: 1.6;
}

/* ── SOULFIRE ENGINE ── */
.soulfire {
  position: relative;
}

.soulfire::after {
  content: '';
  position: absolute;
  right: -200px;
  top: 50%;
  transform: translateY(-50%);
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--pink-glow) 0%, transparent 60%);
  opacity: 0.08;
  pointer-events: none;
}

.soulfire-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  margin-top: 48px;
  align-items: center;
}

.soulfire-visual {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px;
  position: relative;
  overflow: hidden;
}

.soulfire-visual::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--pink-dim) 0%, transparent 50%);
  pointer-events: none;
}

.spectrum-bar {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 120px;
  margin-bottom: 24px;
  justify-content: center;
}

.spectrum-bar .bar {
  width: 8px;
  border-radius: 4px 4px 0 0;
  animation: spectrum-pulse 1.5s ease-in-out infinite;
}

.spectrum-bar .bar:nth-child(1) { height: 30%; background: #ff1493; animation-delay: 0s; }
.spectrum-bar .bar:nth-child(2) { height: 50%; background: #ff1493; animation-delay: 0.1s; }
.spectrum-bar .bar:nth-child(3) { height: 80%; background: #ff1493; animation-delay: 0.2s; }
.spectrum-bar .bar:nth-child(4) { height: 100%; background: #ff1493; animation-delay: 0.3s; }
.spectrum-bar .bar:nth-child(5) { height: 70%; background: #ff1493; animation-delay: 0.4s; }
.spectrum-bar .bar:nth-child(6) { height: 90%; background: #ff1493; animation-delay: 0.5s; }
.spectrum-bar .bar:nth-child(7) { height: 45%; background: #ff1493; animation-delay: 0.6s; }
.spectrum-bar .bar:nth-child(8) { height: 65%; background: #ff1493; animation-delay: 0.7s; }
.spectrum-bar .bar:nth-child(9) { height: 35%; background: #ff1493; animation-delay: 0.8s; }
.spectrum-bar .bar:nth-child(10) { height: 55%; background: #ff1493; animation-delay: 0.9s; }
.spectrum-bar .bar:nth-child(11) { height: 75%; background: #ff1493; animation-delay: 1.0s; }
.spectrum-bar .bar:nth-child(12) { height: 40%; background: #ff1493; animation-delay: 1.1s; }

@keyframes spectrum-pulse {
  0%, 100% { transform: scaleY(1); opacity: 0.7; }
  50% { transform: scaleY(0.5); opacity: 1; }
}

.spectrum-label {
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--pink);
}

.spectrum-range {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
}

.soulfire-features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sf-feature {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.sf-feature .sf-icon {
  width: 40px;
  height: 40px;
  background: var(--pink-dim);
  border: 1px solid var(--border);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.sf-feature h4 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.sf-feature p {
  font-size: 14px;
  color: var(--text-dim);
  line-height: 1.5;
}

/* ── DNA TAGGING ── */
.dna {
  background: #080808;
}

.dna-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  margin-top: 48px;
}

.dna-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 36px;
  transition: all 0.3s;
}

.dna-card:hover {
  border-color: var(--border-hover);
}

.dna-card .tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--pink);
  margin-bottom: 12px;
  text-transform: uppercase;
}

.dna-card h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 12px;
}

.dna-card p {
  font-size: 14px;
  color: var(--text-dim);
  line-height: 1.7;
}

.dna-code {
  margin-top: 20px;
  background: #0a0a0a;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-dim);
  line-height: 1.8;
  overflow-x: auto;
}

.dna-code .key { color: var(--pink); }
.dna-code .val { color: var(--text); }
.dna-code .comment { color: var(--text-muted); }

/* ── ARTIST DNA STACK (Suno Surpass) ── */
.dna-stack {
  position: relative;
}

.dna-stack::before {
  content: '';
  position: absolute;
  left: -200px;
  top: 30%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(155, 89, 182, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

.layer-section {
  margin-top: 60px;
}

.layer-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.layer-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--pink);
  background: var(--pink-dim);
  border: 1px solid var(--border-hover);
  padding: 4px 12px;
  border-radius: 4px;
  text-transform: uppercase;
}

.layer-header h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 24px;
  font-weight: 600;
}

.layer-header p {
  font-size: 14px;
  color: var(--text-dim);
  margin-left: auto;
  font-style: italic;
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.artist-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 28px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.artist-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--pink), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.artist-card:hover {
  border-color: var(--border-hover);
  background: var(--bg-card-hover);
  transform: translateY(-2px);
}

.artist-card:hover::before { opacity: 1; }

.artist-photo {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--border-hover);
  margin-bottom: 14px;
  filter: grayscale(30%);
  transition: all 0.3s;
}

.artist-card:hover .artist-photo {
  filter: grayscale(0%);
  border-color: var(--pink);
  box-shadow: 0 0 15px var(--pink-glow);
}

.artist-photo-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid var(--border);
  margin-bottom: 14px;
  background: var(--pink-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  transition: all 0.3s;
}

.artist-card:hover .artist-photo-placeholder {
  border-color: var(--pink);
  box-shadow: 0 0 15px var(--pink-glow);
}

.artist-name {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.artist-traits {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.artist-traits li {
  font-size: 13px;
  color: var(--text-dim);
  padding-left: 16px;
  position: relative;
}

.artist-traits li::before {
  content: '›';
  position: absolute;
  left: 0;
  color: var(--pink);
  font-weight: bold;
}

/* Environment layer special styling */
.env-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.env-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
  font-size: 14px;
  color: var(--text-dim);
  line-height: 1.5;
  transition: all 0.3s;
  font-style: italic;
}

.env-item:hover {
  border-color: var(--border-hover);
  color: var(--text);
}

/* ── CREATOR EQUITY ── */
.equity {
  background: linear-gradient(180deg, #080808 0%, var(--bg) 100%);
}

.equity-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 48px;
}

.equity-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.3s;
}

.equity-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
}

.equity-card .big-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 36px;
  font-weight: 700;
  color: var(--pink);
  text-shadow: 0 0 20px var(--pink-glow);
  margin-bottom: 8px;
}

.equity-card h4 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}

.equity-card p {
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.5;
}

/* ── PRODUCTS ── */
.products-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 48px;
}

.product-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.product-card:hover {
  border-color: var(--border-hover);
}

.product-card.featured {
  border-color: var(--pink);
  background: linear-gradient(135deg, var(--pink-dim) 0%, var(--bg-card) 50%);
}

.product-card .product-badge {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--pink);
  background: var(--pink-dim);
  padding: 4px 12px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 16px;
}

.product-card h3 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.product-card .price {
  font-family: 'JetBrains Mono', monospace;
  font-size: 28px;
  font-weight: 700;
  color: var(--pink);
  margin-bottom: 4px;
}

.product-card .price-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.product-card .margin-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--gold);
  letter-spacing: 0.1em;
  margin-bottom: 16px;
}

.product-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-features li {
  font-size: 14px;
  color: var(--text-dim);
  padding-left: 20px;
  position: relative;
}

.product-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--pink);
  font-weight: bold;
}

/* ── GENRES ── */
.genres {
  background: #080808;
}

.genre-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 32px;
  justify-content: center;
}

.genre-tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
  border: 1px solid var(--border);
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s;
}

.genre-tag:hover {
  border-color: var(--pink);
  color: var(--pink);
  background: var(--pink-dim);
}

/* ── SOCIAL PROOF ── */
.proof {
  text-align: center;
}

.proof-quote {
  max-width: 700px;
  margin: 40px auto;
  font-size: 22px;
  font-style: italic;
  color: var(--text);
  line-height: 1.7;
  position: relative;
}

.proof-quote::before {
  content: '"';
  font-family: Georgia, serif;
  font-size: 80px;
  color: var(--pink);
  opacity: 0.3;
  position: absolute;
  top: -30px;
  left: -20px;
}

.proof-attribution {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--pink);
  margin-top: 16px;
}

.proof-attr-sub {
  font-size: 13px;
  color: var(--text-muted);
}

/* ── FINAL CTA ── */
.final-cta {
  text-align: center;
  padding: 120px 40px;
  position: relative;
}

.final-cta::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--pink-glow) 0%, transparent 60%);
  opacity: 0.1;
  pointer-events: none;
}

.final-cta h2 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.final-cta h2 .pink {
  color: var(--pink);
  text-shadow: 0 0 40px var(--pink-glow);
}

.final-cta p {
  font-size: 18px;
  color: var(--text-dim);
  margin-bottom: 40px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* ── FOOTER ── */
footer {
  border-top: 1px solid var(--border);
  padding: 40px;
  text-align: center;
}

.footer-logo {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.2em;
  color: var(--pink);
  margin-bottom: 12px;
  text-shadow: 0 0 15px var(--pink-glow);
}

.footer-links {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.footer-links a {
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover { color: var(--pink); }

.footer-copy {
  font-size: 12px;
  color: var(--text-muted);
}

.footer-universe {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--text-muted);
  margin-top: 8px;
  opacity: 0.5;
}

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  nav { padding: 0 20px; }
  .nav-links { display: none; }
  section { padding: 80px 20px; }
  .hero { padding: 160px 20px 80px; }

  .problem-grid,
  .equity-grid { grid-template-columns: repeat(2, 1fr); }

  .soulfire-grid,
  .dna-layout,
  .products-grid { grid-template-columns: 1fr; }

  .tech-grid { grid-template-columns: 1fr 1fr; }

  .hero-stats { gap: 24px; }
}

@media (max-width: 600px) {
  .problem-grid,
  .equity-grid,
  .tech-grid { grid-template-columns: 1fr; }

  .hero-stats { flex-direction: column; gap: 16px; }

  .artist-grid { grid-template-columns: 1fr; }
}
`;

const LANDING_HTML = `

<!-- ═══ STATUS BAR ═══ -->
<div class="status-bar">
  <div class="status-bar-inner">
    <span class="status-item"><span class="dot"></span>[SOULFIRE ENGINE: LIVE]</span>
    <span class="status-item"><span class="dot"></span>[DNA TAGGING: ACTIVE]</span>
    <span class="status-item"><span class="dot"></span>[MICRO-ROYALTIES: LIVE]</span>
    <span class="status-item"><span class="dot"></span>[LYRICA 3 PRO // SONANCE]</span>
    <span class="status-item"><span class="dot"></span>[SL UNIVERSAL: STREAMING]</span>
    <span class="status-item"><span class="dot"></span>[CREATOR EQUITY: 70/30]</span>
    <span class="status-item"><span class="dot"></span>[100% IP OWNERSHIP]</span>
    <span class="status-item"><span class="dot"></span>[INFERENCE: $0.0125/SONG]</span>
    <!-- duplicate for seamless scroll -->
    <span class="status-item"><span class="dot"></span>[SOULFIRE ENGINE: LIVE]</span>
    <span class="status-item"><span class="dot"></span>[DNA TAGGING: ACTIVE]</span>
    <span class="status-item"><span class="dot"></span>[MICRO-ROYALTIES: LIVE]</span>
    <span class="status-item"><span class="dot"></span>[LYRICA 3 PRO // SONANCE]</span>
    <span class="status-item"><span class="dot"></span>[SL UNIVERSAL: STREAMING]</span>
    <span class="status-item"><span class="dot"></span>[CREATOR EQUITY: 70/30]</span>
    <span class="status-item"><span class="dot"></span>[100% IP OWNERSHIP]</span>
    <span class="status-item"><span class="dot"></span>[INFERENCE: $0.0125/SONG]</span>
  </div>
</div>

<!-- ═══ NAV ═══ -->
<nav>
  <a href="#" class="nav-logo">LYRICA 3 PRO</a>
  <ul class="nav-links">
    <li><a href="#soulfire">Soulfire</a></li>
    <li><a href="#dna">DNA Tagging</a></li>
    <li><a href="#lineage">Artist DNA</a></li>
    <li><a href="#equity">Creator Equity</a></li>
    <li><a href="#products">Products</a></li>
  </ul>
  <a href="#start" class="nav-cta">Get Started</a>
</nav>

<!-- ═══ HERO ═══ -->
<section class="hero">
  <div class="container">
    <div class="hero-badge">SLA113 // Universe 1 — LYRICA3</div>
    <h1>The First <span class="pink">Creator-Owned</span><br>AI Music Platform</h1>
    <p class="hero-sub">100% micro-royalties. Digital birth certificates for every track. Your sound, your IP, your money — powered by the Soulfire Engine.</p>

    <div class="hero-stats">
      <div class="hero-stat">
        <div class="num">100%</div>
        <div class="label">Creator IP Ownership</div>
      </div>
      <div class="hero-stat">
        <div class="num">$0.012</div>
        <div class="label">Per Song Inference</div>
      </div>
      <div class="hero-stat">
        <div class="num">70/30</div>
        <div class="label">Creator Split</div>
      </div>
      <div class="hero-stat">
        <div class="num">20+</div>
        <div class="label">Genre Engines</div>
      </div>
    </div>

    <div class="hero-ctas">
      <a href="#start" class="btn-primary">Start Creating</a>
      <a href="#soulfire" class="btn-secondary">See the Engine</a>
    </div>
  </div>
</section>

<hr class="divider">

<!-- ═══ PROBLEM ═══ -->
<section class="problem">
  <div class="container">
    <div class="section-label">The $3 Billion Problem</div>
    <h2 class="section-title">AI Music Made a Promise.<br>Then Broke It.</h2>
    <p class="section-sub">Creators generate billions in value. Platforms keep it all. No ownership. No royalties. No proof you made it.</p>

    <div class="problem-grid">
      <div class="problem-card">
        <div class="icon">🔒</div>
        <h3>Zero IP Ownership</h3>
        <p>Every major AI music platform claims rights to your output. You create — they own. The terms of service say it in the fine print.</p>
      </div>
      <div class="problem-card">
        <div class="icon">💸</div>
        <h3>No Royalty Trail</h3>
        <p>When your track gets remixed, sampled, or goes viral — you get nothing. No tracking. No payment. No record it was ever yours.</p>
      </div>
      <div class="problem-card">
        <div class="icon">🎭</div>
        <h3>Cultural Erasure</h3>
        <p>AI models trained on everything, reflecting nothing. No Chicano soul. No corrido cadence. No souldies warmth. Just generic, rootless output.</p>
      </div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- ═══ SOULFIRE ENGINE ═══ -->
<section class="soulfire" id="soulfire">
  <div class="container">
    <div class="section-label">The Engine</div>
    <h2 class="section-title">Soulfire Engine</h2>
    <p class="section-sub">Hybrid neural-symbolic architecture. Not just generation — emotional intelligence. Every track carries feeling, not just frequency.</p>

    <div class="soulfire-grid">
      <div class="soulfire-visual">
        <div class="spectrum-bar">
          <div class="bar"></div><div class="bar"></div><div class="bar"></div>
          <div class="bar"></div><div class="bar"></div><div class="bar"></div>
          <div class="bar"></div><div class="bar"></div><div class="bar"></div>
          <div class="bar"></div><div class="bar"></div><div class="bar"></div>
        </div>
        <div class="spectrum-label">Emotional Spectrum // 0–100%</div>
        <div class="spectrum-range">
          <span>0% — raw pain</span>
          <span>100% — pure joy</span>
        </div>
      </div>

      <div class="soulfire-features">
        <div class="sf-feature">
          <div class="sf-icon">🧠</div>
          <div>
            <h4>Hybrid Neural-Symbolic</h4>
            <p>Combines deep learning with rule-based cultural logic. The model doesn't just generate — it understands emotional context, genre rules, and lineage.</p>
          </div>
        </div>
        <div class="sf-feature">
          <div class="sf-icon">🎚️</div>
          <div>
            <h4>7-Stage Pipeline</h4>
            <p>AURA → ASE → EFL → ECHO → EFAD → PFA → Empire. Each stage refines the output through emotional, cultural, and sonic filters.</p>
          </div>
        </div>
        <div class="sf-feature">
          <div class="sf-icon">⚡</div>
          <div>
            <h4>Sub-25ms Generation</h4>
            <p>Production-grade speed. 100% local inference. No cloud dependency. $0.0125 per song. 18,935+ lines of production code.</p>
          </div>
        </div>
        <div class="sf-feature">
          <div class="sf-icon">🌍</div>
          <div>
            <h4>Cultural Dataset Moat</h4>
            <p>Trained on Chicano Soul, R&B, Souldies, corridos, oldies — the sounds that raised us. Not scraped from the internet. Curated from the culture.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- ═══ DNA TAGGING ═══ -->
<section class="dna" id="dna">
  <div class="container">
    <div class="section-label">Digital Birth Certificates</div>
    <h2 class="section-title">DNA Tagging</h2>
    <p class="section-sub">Every track gets a cryptographic watermark — SHA-256 verified, blockchain-anchored. Your proof of creation. Forever.</p>

    <div class="dna-layout">
      <div class="dna-card">
        <div class="tag">How It Works</div>
        <h3>Every Song Gets a Birth Certificate</h3>
        <p>The moment you create a track, our DNA Tagger stamps it with a unique cryptographic fingerprint. Creator ID, timestamp, parent lineage, track hash — all recorded on-chain.</p>

        <div class="dna-code">
          <span class="comment">// DNA Tag Schema</span><br>
          {<br>
          &nbsp;&nbsp;<span class="key">"asset_id"</span>: <span class="val">"uuid-v4"</span>,<br>
          &nbsp;&nbsp;<span class="key">"creator_id"</span>: <span class="val">"your-wallet"</span>,<br>
          &nbsp;&nbsp;<span class="key">"parent_asset_id"</span>: <span class="val">"null | origin-track"</span>,<br>
          &nbsp;&nbsp;<span class="key">"track_hash"</span>: <span class="val">"SHA-256"</span>,<br>
          &nbsp;&nbsp;<span class="key">"created_at"</span>: <span class="val">"2026-05-19T..."</span>,<br>
          &nbsp;&nbsp;<span class="key">"royalty_rule"</span>: <span class="val">"exponential_decay"</span><br>
          }
        </div>
      </div>

      <div class="dna-card">
        <div class="tag">Remix Economics</div>
        <h3>Every Remix Pays the Original</h3>
        <p>When someone remixes your track, the DNA tag traces back to you. $0.025 per remix, auto-paid. No disputes. No middlemen. Just math.</p>
        <br>
        <p style="color: var(--text)"><strong>Three royalty models:</strong></p>
        <ul style="list-style: none; margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
          <li style="font-size: 14px; color: var(--text-dim); padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: var(--pink);">›</span> <strong>Original Only</strong> — 100% to the creator</li>
          <li style="font-size: 14px; color: var(--text-dim); padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: var(--pink);">›</span> <strong>Linear Equal Split</strong> — 50/50 with remixer</li>
          <li style="font-size: 14px; color: var(--text-dim); padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: var(--pink);">›</span> <strong>Exponential Decay</strong> — 0.5^depth per generation</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- ═══ ARTIST DNA STACK ═══ -->
<section class="dna-stack" id="lineage">
  <div class="container">
    <div class="section-label">Suno Surpass — Artist DNA Stack</div>
    <h2 class="section-title">Not Imitation — Lineage.</h2>
    <p class="section-sub">The influence map our model pulls from. SGV / East LA Chicano roots. Mexican regional icons. Souldies royalty. The sounds that raised us.</p>

    <!-- Layer I -->
    <div class="layer-section">
      <div class="layer-header">
        <span class="layer-num">Layer I</span>
        <h3>Mexican &amp; Regional Icons</h3>
        <p>The Roots Layer</p>
      </div>
      <div class="artist-grid">
        <div class="artist-card">
          <img class="artist-photo" src="/artists/ana_gabriel.jpg" alt="Ana Gabriel">
          <div class="artist-name">Ana Gabriel</div>
          <ul class="artist-traits">
            <li>Power ballads</li>
            <li>Emotional grit</li>
            <li>Feminine strength with pain-in-the-throat delivery</li>
          </ul>
        </div>
        <div class="artist-card">
          <img class="artist-photo" src="/artists/ramon_ayala.jpg" alt="Ramón Ayala">
          <div class="artist-name">Ramón Ayala</div>
          <ul class="artist-traits">
            <li>Accordion soul</li>
            <li>Norteño storytelling</li>
            <li>Bar-room heartbreak</li>
          </ul>
        </div>
        <div class="artist-card">
          <img class="artist-photo" src="/artists/vicente_fernandez.jpg" alt="Vicente Fernández">
          <div class="artist-name">Vicente Fernández</div>
          <ul class="artist-traits">
            <li>Ranchera royalty</li>
            <li>Vocal bravado + vulnerability</li>
            <li>The sound of fathers, uncles, and Sunday mornings</li>
          </ul>
        </div>
        <div class="artist-card">
          <img class="artist-photo" src="/artists/chalino_sanchez.jpg" alt="Chalino Sánchez">
          <div class="artist-name">Chalino Sánchez</div>
          <ul class="artist-traits">
            <li>Corrido outlaw energy</li>
            <li>Raw, unpolished truth</li>
            <li>Street-level storytelling</li>
          </ul>
        </div>
        <div class="artist-card">
          <img class="artist-photo" src="/artists/fuerza_regida.jpeg" alt="Fuerza Regida">
          <div class="artist-name">Fuerza Regida</div>
          <ul class="artist-traits">
            <li>Modern corrido tumbado cadence</li>
            <li>Youth energy</li>
            <li>Melodic street poetry</li>
          </ul>
        </div>
        <div class="artist-card">
          <div class="artist-photo-placeholder">🎤</div>
          <div class="artist-name">Xavi</div>
          <ul class="artist-traits">
            <li>Soft-light emotional delivery</li>
            <li>New-gen corrido romanticism</li>
            <li>Crossover vulnerability</li>
          </ul>
        </div>
        <div class="artist-card">
          <div class="artist-photo-placeholder">🎶</div>
          <div class="artist-name">Herencia de Patrones</div>
          <ul class="artist-traits">
            <li>Group energy + swagger</li>
            <li>Corrido tumbado pioneers</li>
            <li>Street-level bravado</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Layer II -->
    <div class="layer-section">
      <div class="layer-header">
        <span class="layer-num">Layer II</span>
        <h3>Chicano Rap Lineage</h3>
        <p>The Street Layer</p>
      </div>
      <div class="artist-grid">
        <div class="artist-card">
          <img class="artist-photo" src="/artists/shadyboy_ybe.jpg" alt="ShadyBoy">
          <div class="artist-name">ShadyBoy</div>
          <ul class="artist-traits">
            <li>Melodic pain</li>
            <li>Barrio romance</li>
            <li>SGV emotional realism</li>
          </ul>
        </div>
        <div class="artist-card">
          <img class="artist-photo" src="/artists/trippy_g.jpg" alt="Trippy G">
          <div class="artist-name">Trippy G</div>
          <ul class="artist-traits">
            <li>Trippy melodic flow</li>
            <li>SGV street soul</li>
            <li>Chicano bounce + attitude</li>
          </ul>
        </div>
        <div class="artist-card">
          <div class="artist-photo-placeholder">🎙️</div>
          <div class="artist-name">Kid Vicious</div>
          <ul class="artist-traits">
            <li>Raw barrio energy</li>
            <li>Unapologetic cadence</li>
            <li>Street-level authenticity</li>
          </ul>
        </div>
        <div class="artist-card">
          <img class="artist-photo" src="/artists/shadyboy_ybe.jpg" alt="Lil YBE">
          <div class="artist-name">Lil YBE</div>
          <ul class="artist-traits">
            <li>Young-Chicano cadence</li>
            <li>Street vulnerability</li>
            <li>Modern bounce with heart</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Layer III -->
    <div class="layer-section">
      <div class="layer-header">
        <span class="layer-num">Layer III</span>
        <h3>Souldies / Oldies Royalty</h3>
        <p>The Soul Layer</p>
      </div>
      <div class="artist-grid">
        <div class="artist-card">
          <img class="artist-photo" src="/artists/keith_sweat.jpg" alt="Keith Sweat">
          <div class="artist-name">Keith Sweat</div>
          <ul class="artist-traits">
            <li>Begging-soul</li>
            <li>Smooth male vulnerability</li>
          </ul>
        </div>
        <div class="artist-card">
          <div class="artist-photo-placeholder">🎵</div>
          <div class="artist-name">Barbara Mason</div>
          <ul class="artist-traits">
            <li>Chicano-adopted heartbreak</li>
            <li>Soft, pleading tone</li>
          </ul>
        </div>
        <div class="artist-card">
          <img class="artist-photo" src="/artists/brenton_wood.png" alt="Brenton Wood">
          <div class="artist-name">Brenton Wood</div>
          <ul class="artist-traits">
            <li>Feel-good soul</li>
            <li>Warm, nostalgic melodies</li>
          </ul>
        </div>
        <div class="artist-card">
          <img class="artist-photo" src="/artists/teena_marie.jpg" alt="Teena Marie">
          <div class="artist-name">Teena Marie</div>
          <ul class="artist-traits">
            <li>High-register power</li>
            <li>Street-soul elegance</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Layer IV -->
    <div class="layer-section">
      <div class="layer-header">
        <span class="layer-num">Layer IV</span>
        <h3>Whittier Narrows Carnival</h3>
        <p>The Environment Layer</p>
      </div>
      <!-- Carnival vibe image -->
      <div style="margin: 30px 0; display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">
        <img src="/artists/carnival_vibe.jpg" alt="Chrome lowrider at night carnival with neon pink ferris wheel" style="width: 100%; max-width: 800px; border-radius: 12px; border: 1px solid rgba(255,20,147,0.3); box-shadow: 0 0 40px rgba(255,20,147,0.15);">
      </div>
      <!-- Whittier Blvd reference photos -->
      <div style="margin: 20px 0 30px; display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;">
        <img src="/artists/whittier_blvd_1.jpg" alt="Lowriders on Whittier Blvd with Mexican flags" style="width: 48%; max-width: 380px; border-radius: 8px; border: 1px solid rgba(255,20,147,0.2);">
        <img src="/artists/whittier_blvd_2.jpg" alt="Lowrider three-wheeling under Whittier Blvd arch at dusk" style="width: 48%; max-width: 380px; border-radius: 8px; border: 1px solid rgba(255,20,147,0.2);">
      </div>
      <div class="env-grid">
        <div class="env-item">Ferris wheel lights reflecting on chrome</div>
        <div class="env-item">Funnel cake smoke drifting through warm night air</div>
        <div class="env-item">Lowriders cruising slow</div>
        <div class="env-item">Families, teens, homies, oldies blasting</div>
        <div class="env-item">That mix of joy + melancholy only SGV nights have</div>
      </div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- ═══ CREATOR EQUITY ═══ -->
<section class="equity" id="equity">
  <div class="container">
    <div class="section-label">Creator Economics</div>
    <h2 class="section-title">Your Music. Your Money.</h2>
    <p class="section-sub">We don't take your IP. We don't hide the splits. Every dollar is tracked, every creator is paid.</p>

    <div class="equity-grid">
      <div class="equity-card">
        <div class="big-num">100%</div>
        <h4>IP Ownership</h4>
        <p>You own every track you create. Full rights. No exceptions. No fine-print reversals.</p>
      </div>
      <div class="equity-card">
        <div class="big-num">70/30</div>
        <h4>Creator Split</h4>
        <p>You keep 70%. We keep 30%. Transparent. Simple. The way it should be.</p>
      </div>
      <div class="equity-card">
        <div class="big-num">$0.025</div>
        <h4>Per Remix</h4>
        <p>Auto-paid to the original creator. DNA-traced. No disputes. No middlemen.</p>
      </div>
      <div class="equity-card">
        <div class="big-num">∞</div>
        <h4>Proof of Creation</h4>
        <p>SHA-256 digital birth certificate. On-chain. Permanent. Your legacy in code.</p>
      </div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- ═══ PRODUCTS ═══ -->
<section class="products" id="products">
  <div class="container">
    <div class="section-label">Product Surfaces</div>
    <h2 class="section-title">Four Ways In</h2>
    <p class="section-sub">Professional studio. Universal streaming. Community bot. Social card. Choose your surface.</p>

    <div class="products-grid">
      <div class="product-card featured">
        <div class="product-badge">Flagship</div>
        <h3>Sonance Pro</h3>
        <div class="price">$99–$299/mo</div>
        <div class="price-sub">Professional AI music studio</div>
        <div class="margin-tag">90% GROSS MARGIN</div>
        <ul class="product-features">
          <li>Full Soulfire Engine access</li>
          <li>DNA Tagging on every track</li>
          <li>Unlimited generation</li>
          <li>Mastering + export pipeline</li>
          <li>Remix economics enabled</li>
          <li>Commercial license included</li>
        </ul>
      </div>

      <div class="product-card">
        <div class="product-badge">Streaming</div>
        <h3>SL Universal</h3>
        <div class="price">$4.99/mo</div>
        <div class="price-sub">Pulse Stream — AI-curated listening</div>
        <div class="margin-tag">86% GROSS MARGIN</div>
        <ul class="product-features">
          <li>Stream AI-generated music</li>
          <li>Cultural playlists (Chicano Soul, Corridos, Souldies)</li>
          <li>Creator discovery feed</li>
          <li>Royalty-verified tracks only</li>
        </ul>
      </div>

      <div class="product-card">
        <div class="product-badge">Community</div>
        <h3>Discord Bot</h3>
        <div class="price">$4.99–$19.99/mo</div>
        <div class="price-sub">Generate in your server</div>
        <div class="margin-tag">98% GROSS MARGIN</div>
        <ul class="product-features">
          <li>Generate tracks from Discord</li>
          <li>/lyrica command suite</li>
          <li>Server-wide creation history</li>
          <li>DNA tagging included</li>
        </ul>
      </div>

      <div class="product-card">
        <div class="product-badge">Social</div>
        <h3>TikTok Card</h3>
        <div class="price">Free</div>
        <div class="price-sub">Shareable creator identity</div>
        <div class="margin-tag">VIRAL GROWTH ENGINE</div>
        <ul class="product-features">
          <li>Branded creator card for TikTok</li>
          <li>Links to your DNA-tagged catalog</li>
          <li>Auto-generated from your profile</li>
          <li>Share → discover → convert</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- ═══ GENRES ═══ -->
<section class="genres">
  <div class="container" style="text-align: center;">
    <div class="section-label">Genre Engines</div>
    <h2 class="section-title">20+ Genres. One Soul.</h2>
    <p class="section-sub" style="margin-left: auto; margin-right: auto;">Every genre engine is built on the Soulfire architecture. Cultural specificity. Emotional intelligence. Not generic prompts.</p>

    <div class="genre-tags">
      <span class="genre-tag">Chicano Soul</span>
      <span class="genre-tag">Corrido Tumbado</span>
      <span class="genre-tag">Souldies</span>
      <span class="genre-tag">R&B</span>
      <span class="genre-tag">Trap</span>
      <span class="genre-tag">Drill</span>
      <span class="genre-tag">Afrobeats</span>
      <span class="genre-tag">Reggaetón</span>
      <span class="genre-tag">K-Pop</span>
      <span class="genre-tag">Amapiano</span>
      <span class="genre-tag">Norteño</span>
      <span class="genre-tag">Ranchera</span>
      <span class="genre-tag">Banda</span>
      <span class="genre-tag">Lo-Fi</span>
      <span class="genre-tag">Gospel</span>
      <span class="genre-tag">Jazz Fusion</span>
      <span class="genre-tag">Cumbia</span>
      <span class="genre-tag">Bachata</span>
      <span class="genre-tag">Oldies</span>
      <span class="genre-tag">Funk</span>
    </div>
  </div>
</section>

<hr class="divider">

<!-- ═══ SOCIAL PROOF ═══ -->
<section class="proof">
  <div class="container">
    <div class="section-label">Built From the Culture</div>

    <div class="proof-quote">
      This ain't just another AI music app. This is something real — from the neighborhood, for the culture. I tried it myself. It knows the sound.
    </div>
    <div class="proof-attribution">ShadyBoy</div>
    <div class="proof-attr-sub">Chicano Rapper · El Monte, CA · Fgang Savage</div>
  </div>
</section>

<hr class="divider">

<!-- ═══ FINAL CTA ═══ -->
<section class="final-cta" id="start">
  <div class="container">
    <h2>Own Your <span class="pink">Sound</span>.</h2>
    <p>Join the first AI music platform that pays creators, protects IP, and respects the culture.</p>
    <div class="hero-ctas">
      <a href="https://lyrica3.com" class="btn-primary">Start Creating on Sonance Pro</a>
      <a href="https://sluniversal.lyrica3.com" class="btn-secondary">Stream on SL Universal</a>
    </div>
  </div>
</section>

<!-- ═══ FOOTER ═══ -->
<footer>
  <div class="footer-logo">LYRICA 3 PRO</div>
  <div class="footer-links">
    <a href="https://lyrica3.com">Sonance Pro</a>
    <a href="https://sluniversal.lyrica3.com">SL Universal</a>
    <a href="https://empire1.cloud">Empire One</a>
    <a href="https://southernlifestyle.org">Southern Lyfestyle</a>
  </div>
  <div class="footer-copy">© 2026 Lyrica 3 Pro. All rights reserved. Built by Empire One.</div>
  <div class="footer-universe">SLA113 // UNIVERSE 1 — LYRICA3</div>
</footer>

`;

type LandingProps = {
  onEnterStudio?: () => void;
};

export default function LyricaPublicLanding({ onEnterStudio }: LandingProps = {}) {
  useEffect(() => {
    // Inject Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=Alex+Brush&display=swap';
    document.head.appendChild(link);
    
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    // Wire up CTA buttons to enter the studio instead of reloading the page
    if (!onEnterStudio) return;

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      // Intercept links that point to lyrica3.com (same-site) or #start
      if (
        href === 'https://lyrica3.com' ||
        href === 'https://lyrica3.com/' ||
        href === '#start'
      ) {
        e.preventDefault();
        onEnterStudio();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onEnterStudio]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: LANDING_STYLES }} />
      <div dangerouslySetInnerHTML={{ __html: LANDING_HTML }} />
    </>
  );
}
