import React, { useState } from "react";
import { useAuth } from "../lib/auth";
import { Navigate, useNavigate } from "react-router-dom";
import { Flame } from "lucide-react";

export default function Login() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/deck" replace/>;

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      if (mode === "login") await login(handle, password);
      else                   await register(handle, password);
      nav("/deck");
    } catch (e) {
      setErr(e?.response?.data?.detail || "Access denied.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-[2]">
      <div className="absolute top-[14%] left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-[#F5C542]/10 blur-[120px] pointer-events-none"/>
      <div className="absolute bottom-[8%] right-[10%] w-[420px] h-[420px] rounded-full bg-[#FF2EBE]/10 blur-[120px] pointer-events-none"/>

      <div className="panel rounded-[6px] p-10 w-full max-w-md relative" data-testid="login-card">
        <div className="flex items-center gap-3 mb-2">
          <div className="tube-glow w-4 h-4 rounded-full animate-breathe"/>
          <span className="etched text-[#e8c789]">Empire 1 · Access</span>
        </div>
        <h1 className="font-display text-[36px] text-[#F5F7FA] leading-none tracking-tight mt-2">
          LYRICA <span className="text-[#F5C542]">3</span> PRO
        </h1>
        <p className="font-serif italic text-[13px] text-[#9CA3B0] mt-2">
          The Future of Music isn't AI. It's Creator-Owned AI.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <div className="etched text-[#C8CCD8] mb-2">Sovereign Handle</div>
            <input value={handle} onChange={e=>setHandle(e.target.value.toLowerCase())}
              placeholder="lyrica.prime" required minLength={3}
              data-testid="login-handle-input"
              className="w-full bg-[#0E0F17] border border-[#0E0F17] focus:border-[#F5C542] rounded-[3px] px-3 py-3 text-[#F5F7FA] font-mono text-[13px] outline-none"/>
          </div>
          <div>
            <div className="etched text-[#C8CCD8] mb-2">Passphrase</div>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••" required minLength={6}
              data-testid="login-password-input"
              className="w-full bg-[#0E0F17] border border-[#0E0F17] focus:border-[#F5C542] rounded-[3px] px-3 py-3 text-[#F5F7FA] font-mono text-[13px] outline-none"/>
          </div>

          {err && <div className="text-[12px] text-[#FF2EBE] font-mono" data-testid="login-error">{err}</div>}

          <button type="submit" disabled={loading}
            data-testid="login-submit-btn"
            className="w-full py-3.5 rounded-[3px] border-2 border-[#FF2EBE]
                       bg-gradient-to-b from-[#F5C542] to-[#8B6914]
                       text-[#05060D] uppercase tracking-[0.28em] text-[12px] font-bold
                       animate-amber hover:brightness-110 disabled:opacity-60">
            <Flame size={14} className="inline mr-2 -translate-y-[1px]"/>
            {loading ? "Authenticating…" : mode === "login" ? "Enter Empire 1" : "Mint Sovereign Account"}
          </button>

          <button type="button" onClick={()=>setMode(mode === "login" ? "register" : "login")}
            data-testid="login-mode-toggle"
            className="w-full text-center text-[11px] font-mono text-[#9CA3B0] uppercase tracking-[0.2em] hover:text-[#F5C542]">
            {mode === "login" ? "No account? Mint one →" : "Already sovereign? Sign in →"}
          </button>
        </form>
      </div>
    </div>
  );
}
