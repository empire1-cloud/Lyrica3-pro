import React from "react";

const LANDING_STYLES = `
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

.lyrica-landing-root {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', -apple-system, sans-serif;
  line-height: 1.6;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  width: 100%;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', -apple-system, sans-serif;
  line-height: 1.6;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

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

.hero {
  padding: 200px 40px 120px;
  text-align: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(5,5,5,0.92) 0%, rgba(5,5,5,1) 100%);
}

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
  .hero-stats { gap: 24px; }
}

@media (max-width: 600px) {
  .problem-grid,
  .equity-grid { grid-template-columns: 1fr; }
  .hero-stats { flex-direction: column; gap: 16px; }
  .artist-grid { grid-template-columns: 1fr; }
}
`;

const STATUS_ITEMS = [
  "SOULFIRE ENGINE: LIVE",
  "DNA TAGGING: ACTIVE",
  "MICRO-ROYALTIES: LIVE",
  "LYRICA 3 PRO // SONANCE",
  "SL UNIVERSAL: STREAMING",
  "CREATOR EQUITY: 70/30",
  "100% IP OWNERSHIP",
  "INFERENCE: $0.0125/SONG",
];

type LandingProps = {
  onEnterStudio?: () => void;
};

/* Artist photo URLs — hosted on Viktor's preview server.
   Replace with local hosted versions before production deploy. */
const IMG_BASE = "https://preview-lyrica3-landing-8342a3be.viktor.space";

const ARTISTS_LAYER1 = [
  { name: "Ana Gabriel", img: "ana_gabriel.jpg", traits: ["Power ballads", "Emotional grit", "Feminine strength with pain-in-the-throat delivery"] },
  { name: "Ramón Ayala", img: "ramon_ayala.jpg", traits: ["Accordion soul", "Norteño storytelling", "Bar-room heartbreak"] },
  { name: "Vicente Fernández", img: "vicente_fernandez.jpg", traits: ["Ranchera royalty", "Vocal bravado + vulnerability", "The sound of fathers, uncles, and Sunday mornings"] },
  { name: "Chalino Sánchez", img: "chalino_sanchez.jpg", traits: ["Corrido outlaw energy", "Raw, unpolished truth", "Street-level storytelling"] },
  { name: "Fuerza Regida", img: "fuerza_regida.jpeg", traits: ["Modern corrido tumbado cadence", "Youth energy", "Melodic street poetry"] },
  { name: "Xavi", icon: "🎤", traits: ["Soft-light emotional delivery", "New-gen corrido romanticism", "Crossover vulnerability"] },
  { name: "Herencia de Patrones", icon: "🎶", traits: ["Group energy + swagger", "Corrido tumbado pioneers", "Street-level bravado"] },
];

const ARTISTS_LAYER2 = [
  { name: "ShadyBoy", img: "shadyboy_ybe.jpg", traits: ["Melodic pain", "Barrio romance", "SGV emotional realism"] },
  { name: "Trippy G", img: "trippy_g.jpg", traits: ["Trippy melodic flow", "SGV street soul", "Chicano bounce + attitude"] },
  { name: "Kid Vicious", icon: "🎙️", traits: ["Raw barrio energy", "Unapologetic cadence", "Street-level authenticity"] },
  { name: "Lil YBE", img: "shadyboy_ybe.jpg", traits: ["Young-Chicano cadence", "Street vulnerability", "Modern bounce with heart"] },
];

const ARTISTS_LAYER3 = [
  { name: "Keith Sweat", img: "keith_sweat.jpg", traits: ["Begging-soul", "Smooth male vulnerability"] },
  { name: "Barbara Mason", icon: "🎵", traits: ["Chicano-adopted heartbreak", "Soft, pleading tone"] },
  { name: "Brenton Wood", img: "brenton_wood.png", traits: ["Feel-good soul", "Warm, nostalgic melodies"] },
  { name: "Teena Marie", img: "teena_marie.jpg", traits: ["High-register power", "Street-soul elegance"] },
];

const ENV_VIGNETTES = [
  "Ferris wheel lights reflecting on chrome",
  "Funnel cake smoke drifting through warm night air",
  "Lowriders cruising slow",
  "Families, teens, homies, oldies blasting",
  "That mix of joy + melancholy only SGV nights have",
];

function ArtistCard({ artist }: { artist: any }) {
  return (
    <div className="artist-card">
      {artist.img ? (
        <img className="artist-photo" src={`${IMG_BASE}/artists/${artist.img}`} alt={artist.name} />
      ) : (
        <div className="artist-photo-placeholder">{artist.icon || "🎵"}</div>
      )}
      <div className="artist-name">{artist.name}</div>
      <ul className="artist-traits">
        {artist.traits.map((t: string, i: number) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export default function LyricaPublicLanding({ onEnterStudio }: LandingProps) {
  return (
    <div className="lyrica-landing-root">
      <style>{LANDING_STYLES}</style>

      {/* STATUS BAR */}
      <div className="status-bar">
        <div className="status-bar-inner">
          {[...STATUS_ITEMS, ...STATUS_ITEMS].map((item, i) => (
            <span className="status-item" key={i}><span className="dot"></span>[{item}]</span>
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav>
        <a href="#" className="nav-logo">LYRICA 3 PRO</a>
        <ul className="nav-links">
          <li><a href="#soulfire">Soulfire</a></li>
          <li><a href="#dna">DNA Tagging</a></li>
          <li><a href="#lineage">Artist DNA</a></li>
          <li><a href="#equity">Creator Equity</a></li>
          <li><a href="#products">Products</a></li>
        </ul>
        <button className="nav-cta" onClick={onEnterStudio}>Get Started</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">SLA113 // Universe 1 — LYRICA3</div>
          <h1>The First <span className="pink">Creator-Owned</span><br />AI Music Platform</h1>
          <p className="hero-sub">100% micro-royalties. Digital birth certificates for every track. Your sound, your IP, your money — powered by the Soulfire Engine.</p>
          <div className="hero-stats">
            <div className="hero-stat"><div className="num">100%</div><div className="label">Creator IP Ownership</div></div>
            <div className="hero-stat"><div className="num">$0.012</div><div className="label">Per Song Inference</div></div>
            <div className="hero-stat"><div className="num">70/30</div><div className="label">Creator Split</div></div>
            <div className="hero-stat"><div className="num">20+</div><div className="label">Genre Engines</div></div>
          </div>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={onEnterStudio}>Start Creating</button>
            <a href="#soulfire" className="btn-secondary">See the Engine</a>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* PROBLEM */}
      <section className="problem">
        <div className="container">
          <div className="section-label">The $3 Billion Problem</div>
          <h2 className="section-title">AI Music Made a Promise.<br />Then Broke It.</h2>
          <p className="section-sub">Creators generate billions in value. Platforms keep it all. No ownership. No royalties. No proof you made it.</p>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="icon">🔒</div>
              <h3>Zero IP Ownership</h3>
              <p>Every major AI music platform claims rights to your output. You create — they own. The terms of service say it in the fine print.</p>
            </div>
            <div className="problem-card">
              <div className="icon">💸</div>
              <h3>No Royalty Trail</h3>
              <p>When your track gets remixed, sampled, or goes viral — you get nothing. No tracking. No payment. No record it was ever yours.</p>
            </div>
            <div className="problem-card">
              <div className="icon">🎭</div>
              <h3>Cultural Erasure</h3>
              <p>AI models trained on everything, reflecting nothing. No Chicano soul. No corrido cadence. No souldies warmth. Just generic, rootless output.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* SOULFIRE ENGINE */}
      <section className="soulfire" id="soulfire">
        <div className="container">
          <div className="section-label">The Engine</div>
          <h2 className="section-title">Soulfire Engine</h2>
          <p className="section-sub">Hybrid neural-symbolic architecture. Not just generation — emotional intelligence. Every track carries feeling, not just frequency.</p>
          <div className="soulfire-grid">
            <div className="soulfire-visual">
              <div className="spectrum-bar">
                {Array.from({ length: 12 }).map((_, i) => <div className="bar" key={i} />)}
              </div>
              <div className="spectrum-label">Emotional Spectrum // 0–100%</div>
              <div className="spectrum-range"><span>0% — raw pain</span><span>100% — pure joy</span></div>
            </div>
            <div className="soulfire-features">
              {[
                { icon: "🧠", title: "Hybrid Neural-Symbolic", desc: "Combines deep learning with rule-based cultural logic. The model doesn't just generate — it understands emotional context, genre rules, and lineage." },
                { icon: "🎚️", title: "7-Stage Pipeline", desc: "AURA → ASE → EFL → ECHO → EFAD → PFA → Empire. Each stage refines the output through emotional, cultural, and sonic filters." },
                { icon: "⚡", title: "Sub-25ms Generation", desc: "Production-grade speed. 100% local inference. No cloud dependency. $0.0125 per song. 18,935+ lines of production code." },
                { icon: "🌍", title: "Cultural Dataset Moat", desc: "Trained on Chicano Soul, R&B, Souldies, corridos, oldies — the sounds that raised us. Not scraped from the internet. Curated from the culture." },
              ].map((f, i) => (
                <div className="sf-feature" key={i}>
                  <div className="sf-icon">{f.icon}</div>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* DNA TAGGING */}
      <section className="dna" id="dna">
        <div className="container">
          <div className="section-label">Digital Birth Certificates</div>
          <h2 className="section-title">DNA Tagging</h2>
          <p className="section-sub">Every track gets a cryptographic watermark — SHA-256 verified, blockchain-anchored. Your proof of creation. Forever.</p>
          <div className="dna-layout">
            <div className="dna-card">
              <div className="tag">How It Works</div>
              <h3>Every Song Gets a Birth Certificate</h3>
              <p>The moment you create a track, our DNA Tagger stamps it with a unique cryptographic fingerprint. Creator ID, timestamp, parent lineage, track hash — all recorded on-chain.</p>
              <div className="dna-code">
                <span className="comment">// DNA Tag Schema</span><br />
                {'{'}<br />
                &nbsp;&nbsp;<span className="key">"asset_id"</span>: <span className="val">"uuid-v4"</span>,<br />
                &nbsp;&nbsp;<span className="key">"creator_id"</span>: <span className="val">"your-wallet"</span>,<br />
                &nbsp;&nbsp;<span className="key">"parent_asset_id"</span>: <span className="val">"null | origin-track"</span>,<br />
                &nbsp;&nbsp;<span className="key">"track_hash"</span>: <span className="val">"SHA-256"</span>,<br />
                &nbsp;&nbsp;<span className="key">"created_at"</span>: <span className="val">"2026-05-19T..."</span>,<br />
                &nbsp;&nbsp;<span className="key">"royalty_rule"</span>: <span className="val">"exponential_decay"</span><br />
                {'}'}
              </div>
            </div>
            <div className="dna-card">
              <div className="tag">Remix Economics</div>
              <h3>Every Remix Pays the Original</h3>
              <p>When someone remixes your track, the DNA tag traces back to you. $0.025 per remix, auto-paid. No disputes. No middlemen. Just math.</p>
              <br />
              <p style={{ color: "var(--text)" }}><strong>Three royalty models:</strong></p>
              <ul style={{ listStyle: "none", marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                <li style={{ fontSize: 14, color: "var(--text-dim)", paddingLeft: 20, position: "relative" as const }}>
                  <span style={{ position: "absolute", left: 0, color: "var(--pink)" }}>›</span> <strong>Original Only</strong> — 100% to the creator
                </li>
                <li style={{ fontSize: 14, color: "var(--text-dim)", paddingLeft: 20, position: "relative" as const }}>
                  <span style={{ position: "absolute", left: 0, color: "var(--pink)" }}>›</span> <strong>Linear Equal Split</strong> — 50/50 with remixer
                </li>
                <li style={{ fontSize: 14, color: "var(--text-dim)", paddingLeft: 20, position: "relative" as const }}>
                  <span style={{ position: "absolute", left: 0, color: "var(--pink)" }}>›</span> <strong>Exponential Decay</strong> — 0.5^depth per generation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* ARTIST DNA STACK */}
      <section className="dna-stack" id="lineage">
        <div className="container">
          <div className="section-label">Suno Surpass — Artist DNA Stack</div>
          <h2 className="section-title">Not Imitation — Lineage.</h2>
          <p className="section-sub">The influence map our model pulls from. SGV / East LA Chicano roots. Mexican regional icons. Souldies royalty. The sounds that raised us.</p>

          {/* Layer I */}
          <div className="layer-section">
            <div className="layer-header">
              <span className="layer-num">Layer I</span>
              <h3>Mexican &amp; Regional Icons</h3>
              <p>The Roots Layer</p>
            </div>
            <div className="artist-grid">
              {ARTISTS_LAYER1.map((a, i) => <ArtistCard artist={a} key={i} />)}
            </div>
          </div>

          {/* Layer II */}
          <div className="layer-section">
            <div className="layer-header">
              <span className="layer-num">Layer II</span>
              <h3>Chicano Rap Lineage</h3>
              <p>The Street Layer</p>
            </div>
            <div className="artist-grid">
              {ARTISTS_LAYER2.map((a, i) => <ArtistCard artist={a} key={i} />)}
            </div>
          </div>

          {/* Layer III */}
          <div className="layer-section">
            <div className="layer-header">
              <span className="layer-num">Layer III</span>
              <h3>Souldies / Oldies Royalty</h3>
              <p>The Soul Layer</p>
            </div>
            <div className="artist-grid">
              {ARTISTS_LAYER3.map((a, i) => <ArtistCard artist={a} key={i} />)}
            </div>
          </div>

          {/* Layer IV */}
          <div className="layer-section">
            <div className="layer-header">
              <span className="layer-num">Layer IV</span>
              <h3>Whittier Narrows Carnival</h3>
              <p>The Environment Layer</p>
            </div>
            <div style={{ margin: "30px 0", display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
              <img src={`${IMG_BASE}/artists/carnival_vibe.jpg`} alt="Chrome lowrider at night carnival with neon pink ferris wheel"
                style={{ width: "100%", maxWidth: 800, borderRadius: 12, border: "1px solid rgba(255,20,147,0.3)", boxShadow: "0 0 40px rgba(255,20,147,0.15)" }} />
            </div>
            <div style={{ margin: "20px 0 30px", display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
              <img src={`${IMG_BASE}/artists/whittier_blvd_1.jpg`} alt="Lowriders on Whittier Blvd with Mexican flags"
                style={{ width: "48%", maxWidth: 380, borderRadius: 8, border: "1px solid rgba(255,20,147,0.2)" }} />
              <img src={`${IMG_BASE}/artists/whittier_blvd_2.jpg`} alt="Lowrider three-wheeling under Whittier Blvd arch at dusk"
                style={{ width: "48%", maxWidth: 380, borderRadius: 8, border: "1px solid rgba(255,20,147,0.2)" }} />
            </div>
            <div className="env-grid">
              {ENV_VIGNETTES.map((v, i) => (
                <div className="env-item" key={i}>{v}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* CREATOR EQUITY */}
      <section className="equity" id="equity">
        <div className="container">
          <div className="section-label">Creator Economics</div>
          <h2 className="section-title">Your Music. Your Money.</h2>
          <p className="section-sub">We don't take your IP. We don't hide the splits. Every dollar is tracked, every creator is paid.</p>
          <div className="equity-grid">
            <div className="equity-card">
              <div className="big-num">100%</div>
              <h4>IP Ownership</h4>
              <p>You own every track you create. Full rights. No exceptions. No fine-print reversals.</p>
            </div>
            <div className="equity-card">
              <div className="big-num">70/30</div>
              <h4>Creator Split</h4>
              <p>You keep 70%. We keep 30%. Transparent. Simple. The way it should be.</p>
            </div>
            <div className="equity-card">
              <div className="big-num">$0.025</div>
              <h4>Per Remix</h4>
              <p>Auto-paid to the original creator. DNA-traced. No disputes. No middlemen.</p>
            </div>
            <div className="equity-card">
              <div className="big-num">∞</div>
              <h4>Proof of Creation</h4>
              <p>SHA-256 digital birth certificate. On-chain. Permanent. Your legacy in code.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* PRODUCTS */}
      <section className="products" id="products">
        <div className="container">
          <div className="section-label">Product Surfaces</div>
          <h2 className="section-title">Four Ways In</h2>
          <p className="section-sub">Professional studio. Universal streaming. Community bot. Social card. Choose your surface.</p>
          <div className="products-grid">
            <div className="product-card featured">
              <div className="product-badge">Flagship</div>
              <h3>Sonance Pro</h3>
              <div className="price">$99–$299/mo</div>
              <div className="price-sub">Professional AI music studio</div>
              <div className="margin-tag">90% GROSS MARGIN</div>
              <ul className="product-features">
                <li>Full Soulfire Engine access</li>
                <li>DNA Tagging on every track</li>
                <li>Unlimited generation</li>
                <li>Mastering + export pipeline</li>
                <li>Remix economics enabled</li>
                <li>Commercial license included</li>
              </ul>
            </div>
            <div className="product-card">
              <div className="product-badge">Streaming</div>
              <h3>SL Universal</h3>
              <div className="price">$4.99/mo</div>
              <div className="price-sub">Pulse Stream — AI-curated listening</div>
              <div className="margin-tag">86% GROSS MARGIN</div>
              <ul className="product-features">
                <li>Stream AI-generated music</li>
                <li>Cultural playlists (Chicano Soul, Corridos, Souldies)</li>
                <li>Creator discovery feed</li>
                <li>Royalty-verified tracks only</li>
              </ul>
            </div>
            <div className="product-card">
              <div className="product-badge">Community</div>
              <h3>Discord Bot</h3>
              <div className="price">$4.99–$19.99/mo</div>
              <div className="price-sub">Generate in your server</div>
              <div className="margin-tag">98% GROSS MARGIN</div>
              <ul className="product-features">
                <li>Generate tracks from Discord</li>
                <li>/lyrica command suite</li>
                <li>Server-wide creation history</li>
                <li>DNA tagging included</li>
              </ul>
            </div>
            <div className="product-card">
              <div className="product-badge">Social</div>
              <h3>TikTok Card</h3>
              <div className="price">Free</div>
              <div className="price-sub">Shareable creator identity</div>
              <div className="margin-tag">VIRAL GROWTH ENGINE</div>
              <ul className="product-features">
                <li>Branded creator card for TikTok</li>
                <li>Links to your DNA-tagged catalog</li>
                <li>Auto-generated from your profile</li>
                <li>Share → discover → convert</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* GENRES */}
      <section className="genres">
        <div className="container" style={{ textAlign: "center" }}>
          <div className="section-label">Genre Engines</div>
          <h2 className="section-title">20+ Genres. One Soul.</h2>
          <p className="section-sub" style={{ marginLeft: "auto", marginRight: "auto" }}>Every genre engine is built on the Soulfire architecture. Cultural specificity. Emotional intelligence. Not generic prompts.</p>
          <div className="genre-tags">
            {["Chicano Soul","Corrido Tumbado","Souldies","R&B","Trap","Drill","Afrobeats","Reggaetón","K-Pop","Amapiano","Norteño","Ranchera","Banda","Lo-Fi","Gospel","Jazz Fusion","Cumbia","Bachata","Oldies","Funk"].map((g, i) => (
              <span className="genre-tag" key={i}>{g}</span>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* SOCIAL PROOF */}
      <section className="proof">
        <div className="container" style={{ textAlign: "center" }}>
          <div className="section-label">Built From the Culture</div>
          <div className="proof-quote">
            This ain't just another AI music app. This is something real — from the neighborhood, for the culture. I tried it myself. It knows the sound.
          </div>
          <div className="proof-attribution">ShadyBoy</div>
          <div className="proof-attr-sub">Chicano Rapper · El Monte, CA · Fgang Savage</div>
        </div>
      </section>

      <hr className="divider" />

      {/* FINAL CTA */}
      <section className="final-cta" id="start">
        <div className="container">
          <h2>Own Your <span className="pink">Sound</span>.</h2>
          <p>Join the first AI music platform that pays creators, protects IP, and respects the culture.</p>
          <div className="hero-ctas">
            <button className="btn-primary" onClick={onEnterStudio}>Start Creating on Sonance Pro</button>
            <a href="https://sluniversal.lyrica3.com" className="btn-secondary">Stream on SL Universal</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">LYRICA 3 PRO</div>
        <div className="footer-links">
          <a href="https://lyrica3.com">Sonance Pro</a>
          <a href="https://sluniversal.lyrica3.com">SL Universal</a>
          <a href="https://empire1.cloud">Empire One</a>
          <a href="https://southernlifestyle.org">Southern Lyfestyle</a>
        </div>
        <div className="footer-copy">© 2026 Lyrica 3 Pro. All rights reserved. Built by Empire One.</div>
        <div className="footer-universe">SLA113 // UNIVERSE 1 — LYRICA3</div>
      </footer>
    </div>
  );
}
