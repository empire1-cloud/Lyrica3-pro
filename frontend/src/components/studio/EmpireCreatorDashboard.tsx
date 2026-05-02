import React from 'react';
import { Activity, Coins, Globe, Fingerprint, Network } from 'lucide-react';

export default function EmpireCreatorDashboard() {
  return (
    <div className="bg-obsidian-950 min-h-screen p-8 text-slate-200 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-white/5 pb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold italic tracking-tighter text-white flex items-center gap-4 premium-gradient-text">
              <Network size={40} className="text-purple-400" /> EMPIRE 1 LEDGER
            </h1>
            <p className="text-sm text-slate-500 mt-3 font-mono uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              Live Synapse Broker • Global DNA Tracking
            </p>
          </div>
          <div className="md:text-right bg-purple-500/5 border border-purple-500/10 p-6 rounded-[2rem] backdrop-blur-xl">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mb-2">Total Vault Balance</p>
            <p className="text-5xl font-serif font-bold italic text-white">$42,891.<span className="text-purple-400/50">55</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Stat 1 */}
          <div className="bg-obsidian-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
            <Activity className="text-purple-400 mb-4" size={24} />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">24H Synapse Flips</p>
            <p className="text-3xl font-black mt-1 text-white">14,203</p>
            <p className="text-xs text-purple-400 font-mono mt-2">+12% vs yesterday</p>
          </div>
          {/* Stat 2 */}
          <div className="bg-obsidian-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-400"></div>
            <Coins className="text-purple-300 mb-4" size={24} />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">24H Micro-Royalties</p>
            <p className="text-3xl font-black mt-1 text-white">$710.15</p>
            <p className="text-xs text-slate-500 font-mono mt-2">Avg $0.05 per flip</p>
          </div>
          {/* Stat 3 */}
          <div className="bg-obsidian-900/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-fuchsia-500"></div>
            <Globe className="text-fuchsia-400 mb-4" size={24} />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Active DNA Vectors</p>
            <p className="text-3xl font-black mt-1 text-white">3</p>
            <p className="text-xs text-slate-500 font-mono mt-2">Tracks circulating on SL Universal</p>
          </div>
        </div>

        {/* Live Synapse Event Stream */}
        <h2 className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-4">Live Pulse-Stream Events</h2>
        <div className="bg-black/40 border border-white/5 rounded-3xl p-4 space-y-3 font-mono text-xs backdrop-blur-md">
          <div className="flex justify-between items-center p-4 bg-obsidian-900/30 rounded-2xl border border-white/5">
            <span className="text-purple-400 flex items-center gap-2"><Fingerprint size={14}/> trk_alpha_9f8b...</span>
            <span className="text-slate-400">Flipped to <strong className="text-white">Rio Drift Phonk</strong> in London, UK</span>
            <span className="text-purple-400 font-bold">+$0.05</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-obsidian-900/30 rounded-2xl border border-white/5">
            <span className="text-fuchsia-400 flex items-center gap-2"><Fingerprint size={14}/> trk_vocal_77x...</span>
            <span className="text-slate-400">Voice DNA applied to <strong className="text-white">Acoustic Corrido</strong> in LA, USA</span>
            <span className="text-purple-400 font-bold">+$0.12</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-obsidian-900/30 rounded-2xl border border-white/5 animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <span className="text-purple-400 flex items-center gap-2"><Fingerprint size={14}/> trk_alpha_9f8b...</span>
            <span className="text-slate-400">Flipped to <strong className="text-white">UK Drill</strong> in Lagos, NG</span>
            <span className="text-purple-400 font-bold">+$0.05</span>
          </div>
        </div>
      </div>
    </div>
  );
}
