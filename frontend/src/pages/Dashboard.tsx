import React, { useState } from 'react';
import { Play, Sparkles, Activity, Clock, MoreHorizontal, Flame, SquarePlay, Search, ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';

const RECENT_SESSIONS = [
  { id: 1, name: "Midnight Cruise Beat", time: "2 hours ago", type: "Hip-Hop", duration: "3:42" },
  { id: 2, name: "Neon City Ambience", time: "Yesterday", type: "Synthwave", duration: "4:15" },
  { id: 3, name: "Acoustic Sunset", time: "3 days ago", type: "Indie Pop", duration: "2:50" },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [vibe, setVibe] = useState('');

  const submitVibe = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedVibe = vibe.trim();
    if (!trimmedVibe) return;

    window.localStorage.setItem('lyrica:lastVibePrompt', trimmedVibe);
    navigate(`/radio?vibe=${encodeURIComponent(trimmedVibe)}`);
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
      {/* Header & Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-['Sedgwick_Ave_Display'] mb-2">Welcome Back</h1>
          <p className="text-zinc-400 font-medium text-sm">Create something beautiful today.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800/50 rounded-full px-4 py-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-sm font-medium text-zinc-300">Soulfire Engine Active</span>
          </div>
          <Button variant="primary" glowColor="cyan" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Quick Generate
          </Button>
        </div>
      </div>

      <form onSubmit={submitVibe} className="relative mx-auto max-w-4xl group">
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-fuchsia-600 via-cyan-500 to-violet-600 opacity-25 blur transition duration-700 group-focus-within:opacity-60 group-hover:opacity-45" />
        <div className="relative flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-black/40 p-3 shadow-2xl shadow-fuchsia-950/20 backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full sm:p-2">
          <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
            <Search className="h-5 w-5 shrink-0 text-white/35" />
            <input
              value={vibe}
              onChange={(event) => setVibe(event.target.value)}
              placeholder="I need a song for a late-night drive in the rain..."
              className="min-h-12 w-full bg-transparent text-base text-white outline-none placeholder:text-white/25"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-95"
          >
            Feel It
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Banner */}
        <Card className="md:col-span-8 p-0 overflow-hidden relative group h-[300px] flex flex-col justify-end">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop"
            alt="Abstract Waves"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60"
          />
          <div className="relative z-20 p-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 text-xs font-medium backdrop-blur-md">
              <Activity className="w-3 h-3" />
              New in Lyrica 3
            </div>
            <h2 className="text-3xl font-bold max-w-md">The Evolution of Emotional AI Performance</h2>
            <Button variant="secondary" className="gap-2 w-max bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10">
              <Play className="w-4 h-4" /> Watch Demo
            </Button>
          </div>
        </Card>

        {/* Featured Preset */}
        <Card className="md:col-span-4 glowOnHover bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 flex flex-col">
          <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Hot Preset
          </h3>
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4 py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-[2px]">
              <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-cyan-400 ml-1" />
              </div>
            </div>
            <div>
              <h4 className="font-['Sedgwick_Ave_Display'] text-2xl">L.A. NightDrive</h4>
              <p className="text-zinc-500 text-sm mt-1">Dark Synth • High Energy</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full border-t border-zinc-800/50 rounded-none rounded-b-2xl py-4 h-auto">
            Load Preset
          </Button>
        </Card>
      </div>

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium">Recent Sessions</h3>
          <Button variant="ghost" size="sm" className="text-xs">View All</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RECENT_SESSIONS.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="hover:border-zinc-700 hover:bg-zinc-900/80 cursor-pointer group flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                    <SquarePlay className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <h4 className="font-medium text-zinc-100 group-hover:text-cyan-400 transition-colors">{session.name}</h4>
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500 font-medium">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.time}</span>
                    <span>•</span>
                    <span>{session.type}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
