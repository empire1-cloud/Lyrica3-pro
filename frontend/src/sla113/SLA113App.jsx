import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SLA113Page from './SLA113Page';
import axios from 'axios';

const TITLE_IMAGE =
  'https://customer-assets.emergentagent.com/job_3653cf8a-8710-488d-846f-2f0428b714dd/artifacts/v9jg01gi_titleScreen.jpg';

const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://lyrica3.com';
const SLA113_TOKEN_KEY = 'sla113_op_token';

// ─── Title Screen (exact replica) ────────────────────────────────
function TitleScreen({ onComplete }) {
  const [phase, setPhase] = useState('enter');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 3500;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('exit'), 3500);
    const t3 = setTimeout(() => onComplete(), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      data-testid="title-screen"
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden transition-opacity duration-700 ${phase === 'exit' ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#8B0000]/8 rounded-full blur-[80px]" />
      </div>
      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }} />

      {/* Medallion */}
      <div className={`relative transition-all duration-1000 ${phase === 'enter' ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}>
        <div className="absolute -inset-4 rounded-full bg-[#D4AF37]/10 blur-xl animate-pulse" />
        <img
          src={TITLE_IMAGE}
          alt="Southern Lifestyle"
          data-testid="title-medallion"
          className="w-72 h-72 md:w-80 md:h-80 object-cover rounded-full relative z-10 drop-shadow-[0_0_40px_rgba(212,175,55,0.3)] border-2 border-[#D4AF37]/20"
          style={{ filter: 'contrast(1.05) brightness(1.02)' }}
        />
      </div>

      {/* Text */}
      <div className={`mt-8 text-center transition-all duration-700 delay-300 ${phase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <h1 className="text-[#D4AF37] text-[11px] font-bold tracking-[12px] uppercase font-mono">SLA-113</h1>
        <p className="text-zinc-600 text-[8px] tracking-[6px] uppercase mt-2 font-mono">Operator OS // Sovereign Architecture</p>
      </div>

      {/* Progress bar */}
      <div className={`mt-10 w-64 transition-all duration-500 delay-500 ${phase === 'enter' ? 'opacity-0' : 'opacity-100'}`}>
        <div className="h-[2px] bg-zinc-900 w-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] transition-none" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[7px] text-zinc-700 tracking-[3px] uppercase font-mono">Initializing</span>
          <span className="text-[7px] text-[#D4AF37]/50 font-mono">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className={`absolute bottom-6 text-center transition-all duration-500 delay-700 ${phase === 'enter' ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-zinc-800 text-[7px] tracking-[4px] uppercase font-mono">El Monte // SGV // Since Day One</p>
      </div>
    </div>
  );
}

// ─── Login Gate ───────────────────────────────────────────────────
function SLA113Login({ onAuth }) {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND}/api/auth/login`, { handle, password });
      const { token, role } = res.data;
      if (!token) { setError('NO TOKEN RETURNED'); setLoading(false); return; }
      if (role && role !== 'admin' && role !== 'owner') {
        setError('ACCESS DENIED — ADMIN ONLY');
        setLoading(false);
        return;
      }
      localStorage.setItem(SLA113_TOKEN_KEY, token);
      localStorage.setItem('sla113_handle', handle);
      onAuth({ token, handle, role: role || 'admin' });
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'AUTH FAILED';
      setError(msg.toUpperCase());
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-[#050505] flex flex-col items-center justify-center font-mono">
      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 4px)' }} />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-[#D4AF37] text-[10px] tracking-[8px] uppercase font-bold mb-2">SLA-113</div>
          <div className="text-zinc-700 text-[8px] tracking-[4px] uppercase">OPERATOR ACCESS REQUIRED</div>
          <div className="mt-4 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <div className="text-zinc-700 text-[8px] tracking-[3px] uppercase mb-2">HANDLE</div>
            <input
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="operator_handle"
              className="w-full bg-black border border-zinc-900 text-zinc-200 px-4 py-3 text-[11px] tracking-wider outline-none focus:border-[#D4AF37]/50 transition-colors"
              autoComplete="username"
            />
          </div>
          <div>
            <div className="text-zinc-700 text-[8px] tracking-[3px] uppercase mb-2">PASSPHRASE</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-black border border-zinc-900 text-zinc-200 px-4 py-3 text-[11px] tracking-wider outline-none focus:border-[#D4AF37]/50 transition-colors"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="border border-red-900/50 bg-red-950/20 px-4 py-2 text-red-500 text-[9px] tracking-widest">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 border border-[#D4AF37]/40 bg-[#D4AF37]/5 text-[#D4AF37] text-[9px] tracking-[4px] uppercase font-bold px-4 py-4 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/70 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '[ AUTHENTICATING... ]' : '[ ENTER EMPIRE ]'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center">
          <div className="text-zinc-800 text-[7px] tracking-[4px] uppercase">El Monte // SGV // Since Day One</div>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────
export default function SLA113App() {
  const [showTitle, setShowTitle] = useState(true);
  const [authed, setAuthed] = useState(null); // null = checking, false = need login, object = authed

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem(SLA113_TOKEN_KEY);
    const handle = localStorage.getItem('sla113_handle');
    if (token && handle) {
      // Verify token is still valid
      axios.get(`${BACKEND}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          const role = res.data?.role;
          if (role === 'admin' || role === 'owner') {
            setAuthed({ token, handle, role });
          } else {
            localStorage.removeItem(SLA113_TOKEN_KEY);
            setAuthed(false);
          }
        })
        .catch(() => {
          localStorage.removeItem(SLA113_TOKEN_KEY);
          setAuthed(false);
        });
    } else {
      setAuthed(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(SLA113_TOKEN_KEY);
    localStorage.removeItem('sla113_handle');
    setAuthed(false);
  }, []);

  return (
    <div id="sla113-root">
      {showTitle && <TitleScreen onComplete={() => setShowTitle(false)} />}

      {/* While title is showing OR auth is loading, show nothing underneath */}
      {!showTitle && authed === null && (
        <div className="fixed inset-0 bg-[#050505] z-[9990] flex items-center justify-center">
          <div className="text-[#D4AF37]/30 text-[8px] tracking-[4px] uppercase font-mono animate-pulse">Verifying...</div>
        </div>
      )}

      {!showTitle && authed === false && (
        <SLA113Login onAuth={setAuthed} />
      )}

      {!showTitle && authed && authed.token && (
        <Routes>
          <Route path="/sla113" element={<SLA113Page user={authed} onLogout={handleLogout} />} />
          <Route path="/sla113/*" element={<SLA113Page user={authed} onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/sla113" replace />} />
        </Routes>
      )}
    </div>
  );
}
