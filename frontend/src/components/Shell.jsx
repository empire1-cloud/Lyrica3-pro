import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Radio, Sliders, Flame, LogOut, CircleUser } from "lucide-react";

const navItems = [
  { to: "/deck",     label: "Stem Deck",        icon: Sliders },
  { to: "/feed",     label: "Flip-It Feed",     icon: Radio },
  { to: "/ignite",   label: "S2 Mutation",      icon: Flame },
];

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex relative z-[2]">
      {/* vertical rail */}
      <aside className="w-[232px] shrink-0 border-r border-[#1c1c22] bg-[#060607]/80 backdrop-blur-sm flex flex-col scanlines" data-testid="side-nav">
        <div className="px-5 pt-6 pb-8 border-b border-[#1c1c22]">
          <div className="flex items-center gap-2">
            <div className="tube-glow w-3 h-3 rounded-full" />
            <span className="etched text-[#e8c789]">Empire 1</span>
          </div>
          <h1 className="font-display text-[22px] text-[#f3ece1] leading-none mt-3 tracking-tight">
            LYRICA<span className="text-[#f5a524]"> 3</span> PRO
          </h1>
          <div className="font-serif italic text-[11px] text-[#8a8278] mt-2 leading-snug">
            Sonance Pro · Sovereign Studio
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              data-testid={`nav-${to.slice(1)}`}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-[3px] border text-[12px] tracking-[0.14em] uppercase transition-all
                 ${isActive
                   ? "bg-[#f5a524]/10 border-[#f5a524]/40 text-[#ffd88a] shadow-[inset_0_0_18px_rgba(245,165,36,0.18)]"
                   : "border-transparent text-[#9c9486] hover:text-[#f3ece1] hover:bg-[#15151a]"}`
              }>
              <Icon size={14} strokeWidth={1.6}/>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-[#1c1c22]">
          {user ? (
            <div className="flex items-center gap-3">
              <CircleUser size={28} className="text-[#f5a524]" strokeWidth={1.4}/>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-[#f3ece1] truncate" data-testid="nav-user-handle">{user.handle}</div>
                <div className="text-[10px] text-[#6b6257] font-mono truncate">{user.wallet}</div>
              </div>
              <button
                data-testid="logout-btn"
                onClick={() => { logout(); nav("/login"); }}
                className="text-[#6b6257] hover:text-[#ff5eac] transition">
                <LogOut size={15}/>
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      {/* main */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
