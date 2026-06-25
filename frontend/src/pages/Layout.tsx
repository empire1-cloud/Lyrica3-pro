import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { Home, SquarePlay, Library, Settings, Flame, Cpu, Waves, Music, Disc, Shield, LogOut } from 'lucide-react';
import { cn } from '../components/ui/Button';
import { clearAuthToken, getAuthToken } from '../lib/api';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/radio', label: 'SL Universal', icon: Waves },
  { path: '/music/make', label: 'Make Music', icon: Music },
  { path: '/music/tracks', label: 'My Tracks', icon: Shield },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/50 bg-zinc-950 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.4)]">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <span className="font-['Sedgwick_Ave_Display'] text-2xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 to-zinc-500">
            Lyrica 3
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium group",
                  isActive 
                    ? "bg-zinc-900 text-white" 
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" : "group-hover:text-zinc-300")} strokeWidth={1.5} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-800/50 space-y-1">
          <NavLink
            to="/settings"
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
              isActive
                ? "bg-zinc-900 text-white"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50"
            )}
          >
            {({ isActive }) => (
              <>
                <Settings className={cn("w-5 h-5", isActive ? "text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" : "group-hover:text-zinc-300")} strokeWidth={1.5} />
                Settings
              </>
            )}
          </NavLink>
          {getAuthToken() && (
            <button
              onClick={() => { clearAuthToken(); window.location.href = "/auth"; }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group w-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50"
            >
              <LogOut className="w-5 h-5 group-hover:text-zinc-300" strokeWidth={1.5} />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800/50 flex items-center justify-around px-4 z-50">
        {[ ...navItems, { path: '/settings', label: 'Settings', icon: Settings } ].map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 transition-all",
                isActive ? "text-fuchsia-400" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]")} strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
