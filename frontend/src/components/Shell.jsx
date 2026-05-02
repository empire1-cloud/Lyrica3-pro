import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Radio, Sliders, Flame, LogOut, CircleUser, Menu, X, Globe } from "lucide-react";

const navItems = [
  { to: "/deck",      label: "Stem Deck",        icon: Sliders },
  { to: "/feed",      label: "Flip-It Feed",     icon: Radio },
  { to: "/universal", label: "Universal Stream", icon: Globe },
  { to: "/ignite",    label: "S2 Mutation",      icon: Flame },
];

export default function Shell({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const Rail = (
    <>
      <div className="px-5 pt-6 pb-6 border-b border-[#1c1c22]">
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
            onClick={() => setOpen(false)}
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
    </>
  );

  return (
    <div className="min-h-screen flex relative z-[2]">
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#060607]/90 backdrop-blur border-b border-[#1c1c22] flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="tube-glow w-2.5 h-2.5 rounded-full"/>
          <span className="font-display text-[15px] text-[#f3ece1] tracking-tight">
            LYRICA<span className="text-[#f5a524]"> 3</span> PRO
          </span>
        </div>
        <button onClick={() => setOpen(true)} data-testid="mobile-menu-btn"
                className="text-[#f5a524] p-1.5 rounded border border-[#22222a]">
          <Menu size={18}/>
        </button>
      </div>

      {/* Desktop rail */}
      <aside className="hidden lg:flex w-[232px] shrink-0 border-r border-[#1c1c22] bg-[#060607]/80 backdrop-blur-sm flex-col scanlines" data-testid="side-nav">
        {Rail}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"/>
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-[260px] z-50 bg-[#060607] border-r border-[#1c1c22] flex flex-col scanlines" data-testid="mobile-drawer">
            <button onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 text-[#6b6257] hover:text-[#ff5eac]">
              <X size={18}/>
            </button>
            {Rail}
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 pt-[56px] lg:pt-0">{children}</main>
    </div>
  );
}
