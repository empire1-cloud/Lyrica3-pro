import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders, Radio, Activity, Flame, Wallet, Users, Disc3, ChevronDown
} from 'lucide-react';
import PricingPage from './PricingPage';
import LyricaPublicLanding from './LyricaPublicLanding';
import ErrorBoundary from './components/ErrorBoundary';
import OnboardingGuide from './components/OnboardingGuide';
import App6Reference from './components/App6_reference';
import SonanceStudio from './pages/SonanceStudio';

// Lazy-load heavy pages
const FlipFeed       = lazy(() => import('./pages/FlipFeed'));
const StemDeck       = lazy(() => import('./pages/StemDeck'));
const DuetEngine     = lazy(() => import('./pages/DuetEngine'));
const VICSProtocol   = lazy(() => import('./pages/VICSProtocol'));
const SLUniversalApp = lazy(() => import('./pages/SLUniversalApp'));

// ─── Constants ───────────────────────────────────────────────────────────────
const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://lyrica3-backend-e2q5oemapa-uw.a.run.app';

type AppMode = 'sonance' | 'universal' | 'orchestrator' | 'feed' | 'deck' | 'duet' | 'vics' | 'plans';

type WalletData = {
  handle: string; wallet: string; balance_usd: number;
  lifetime_streams: number; lifetime_flips: number; active_tracks: number;
};

function authHeaders() {
  const token = localStorage.getItem('e1_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

// ─── LoginGate ───────────────────────────────────────────────────────────────
function LoginGate({ children }: { children: React.ReactNode }) {
  const [token, setToken]       = useState<string | null>(() => localStorage.getItem('e1_token'));
  const [handle, setHandle]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [isRegister, setIsReg]  = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const r = await fetch(`${BACKEND}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, password }),
      });
      const data = await r.json();
      if (data.token) { localStorage.setItem('e1_token', data.token); setToken(data.token); }
      else setError(data.detail || 'Invalid credentials');
    } catch { setError('Connection error — try again'); }
    setLoading(false);
  };

  if (token) return <>{children}</>;

  return (
    <div style={{ minHeight: '100vh', background: '#05060D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-monospace, monospace' }}>
      <div style={{ width: 360, background: '#05060D', border: '1px solid #1a1a1a', borderRadius: 16, padding: 40 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#FF2EBE', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 8 }}>Lyrica 3 Pro</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>EMPIRE 1</div>
          <div style={{ fontSize: 10, color: '#444', marginTop: 4, letterSpacing: '0.2em' }}>SOVEREIGN STUDIO ACCESS</div>
        </div>
        <form onSubmit={login}>
          <div style={{ marginBottom: 12 }}>
            <input type="text" placeholder="Handle" value={handle} onChange={e => setHandle(e.target.value)} required
              style={{ width: '100%', background: '#000', border: '1px solid #222', color: '#fff', padding: '12px 14px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', background: '#000', border: '1px solid #222', color: '#fff', padding: '12px 14px', borderRadius: 8, fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
          </div>
          {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 14, textAlign: 'center' }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: '#FF2EBE', color: '#000', border: 'none', borderRadius: 8, padding: '13px 0', fontWeight: 900, fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Authenticating...' : (isRegister ? 'Create Account' : 'Enter Studio')}
          </button>
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#666' }}>
            {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
            <button type="button" onClick={() => { setIsReg(!isRegister); setError(''); }}
              style={{ background: 'none', border: 'none', color: '#FF2EBE', cursor: 'pointer', textDecoration: 'underline' }}>
              {isRegister ? 'Login' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── WalletWidget ─────────────────────────────────────────────────────────────
function WalletWidget() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [open, setOpen]     = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('e1_token');
    if (!token) return;
    fetch(`${BACKEND}/api/wallet`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setWallet(d))
      .catch(() => {});
  }, []);

  if (!wallet) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-pink-500/40 px-3 py-1.5 rounded-lg text-xs transition-colors"
      >
        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-emerald-400 font-mono font-bold">${wallet.balance_usd.toFixed(2)}</span>
        <ChevronDown className={`w-3 h-3 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            className="absolute right-0 top-full mt-2 w-64 bg-neutral-950 border border-neutral-800 rounded-xl p-4 shadow-2xl z-50"
          >
            <div className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Creator Wallet</div>
            <div className="font-mono text-[10px] text-neutral-400 mb-1 truncate">{wallet.wallet}</div>
            <div className="text-2xl font-black text-white mb-3">${wallet.balance_usd.toFixed(4)}</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Streams', val: wallet.lifetime_streams.toLocaleString() },
                { label: 'Flips', val: wallet.lifetime_flips },
                { label: 'Tracks', val: wallet.active_tracks },
              ].map(({ label, val }) => (
                <div key={label} className="bg-neutral-900 rounded-lg p-2">
                  <div className="text-white font-bold text-sm">{val}</div>
                  <div className="text-neutral-500 text-[10px] uppercase">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Nav + App Shell ────────────────────────────────────────────────────
const NAV_TABS: { id: AppMode; label: string; icon: React.ComponentType<any>; color: string }[] = [
  { id: 'sonance',      label: 'Studio',      icon: Sliders,  color: 'text-pink-400' },
  { id: 'universal',    label: 'Universal',   icon: Radio,    color: 'text-rose-400' },
  { id: 'orchestrator', label: 'Orchestrator',icon: Activity, color: 'text-blue-400' },
  { id: 'feed',         label: 'Feed',        icon: Flame,    color: 'text-orange-400' },
  { id: 'deck',         label: 'Stem Deck',   icon: Disc3,    color: 'text-purple-400' },
  { id: 'duet',         label: 'Duet',        icon: Users,    color: 'text-cyan-400' },
  { id: 'vics',         label: 'VICS',        icon: Activity, color: 'text-emerald-400' },
  { id: 'plans',        label: 'Plans',       icon: Wallet,   color: 'text-amber-400' },
];

function MainApp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mode, setMode] = useState<AppMode>('sonance');
  const [showOnboard, setShowOnboard] = useState(() => !localStorage.getItem('e1_onboarded'));

  const handleMode = (m: AppMode) => {
    setMode(m);
    // URL-mapped modes get real routes
    if (m === 'feed')  navigate('/feed');
    else if (m === 'deck')  navigate('/deck');
    else if (m === 'duet')  navigate('/duet');
    else if (m === 'vics')  navigate('/vics');
    else navigate('/');
  };

  // Sync mode from URL on load
  useEffect(() => {
    const p = location.pathname;
    if (p.startsWith('/feed'))  setMode('feed');
    else if (p.startsWith('/deck'))  setMode('deck');
    else if (p.startsWith('/duet'))  setMode('duet');
    else if (p.startsWith('/vics'))  setMode('vics');
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">

      {/* Onboarding Guide */}
      {showOnboard && <OnboardingGuide onDismiss={() => { localStorage.setItem('e1_onboarded', '1'); setShowOnboard(false); }} />}

      {/* Top Navigation */}
      <nav className="border-b border-neutral-800/50 bg-neutral-950/90 backdrop-blur-md z-40 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="font-black tracking-widest text-sm bg-clip-text text-transparent bg-gradient-to-r from-pink-200 to-rose-200 hidden sm:block">
              LYRICA 3 PRO
            </span>
          </div>

          {/* Mode Tabs */}
          <div className="flex bg-neutral-900/50 p-0.5 rounded-xl border border-neutral-800/50 overflow-x-auto hide-scrollbar flex-1 max-w-2xl">
            {NAV_TABS.map(tab => {
              const Icon = tab.icon;
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleMode(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    active ? `bg-neutral-800 ${tab.color} shadow-sm` : 'text-neutral-500 hover:text-neutral-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Wallet */}
          <div className="shrink-0">
            <WalletWidget />
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1">
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-neutral-500 text-sm">Loading...</div>}>
          <Routes>
            <Route path="/feed"  element={<FlipFeed />} />
            <Route path="/deck"  element={<StemDeck />} />
            <Route path="/duet"  element={<DuetEngine />} />
            <Route path="/vics"  element={<VICSProtocol />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/*" element={
              <AnimatePresence mode="wait">
                {mode === 'sonance' && (
                  <motion.div key="sonance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SonanceStudio />
                  </motion.div>
                )}
                {mode === 'universal' && (
                  <motion.div key="universal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SLUniversalApp />
                  </motion.div>
                )}
                {mode === 'orchestrator' && (
                  <motion.div key="orchestrator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <App6Reference />
                  </motion.div>
                )}
                {mode === 'plans' && (
                  <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <PricingPage />
                  </motion.div>
                )}
              </AnimatePresence>
            } />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

// ─── Root Export ──────────────────────────────────────────────────────────────
export default function App() {
  const [showStudio, setShowStudio] = useState(false);
  const location = useLocation();

  // Public pricing page — no login required
  if (location.pathname === '/pricing') {
    return <ErrorBoundary><PricingPage /></ErrorBoundary>;
  }

  if (showStudio) {
    return (
      <ErrorBoundary>
        <LoginGate>
          <MainApp />
        </LoginGate>
      </ErrorBoundary>
    );
  }

  // Lyrica 3 Pro public landing — Viktor's design, ported to React
  return (
    <ErrorBoundary>
      <div className="relative">
        <LyricaPublicLanding onEnterStudio={() => setShowStudio(true)} />
      </div>
    </ErrorBoundary>
  );
}
