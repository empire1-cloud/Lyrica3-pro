import React from 'react';
import { SlidersHorizontal, Volume2, Mic2, Drum, AudioWaveform } from 'lucide-react';

export default function SSLVConsole() {
  return (
    <div className="w-full max-w-4xl mx-auto bg-obsidian-950 border border-white/5 rounded-3xl p-8 text-white shadow-2xl">
      <div className="flex justify-between items-center border-b border-white/5 pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-purple-400 tracking-tighter flex items-center gap-2 premium-gradient-text">
            <SlidersHorizontal size={24} /> SSL-V NEURAL MIXER
          </h2>
          <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest">
            Resonance-X Codec • 48kHz / 24-Bit Phase-Aligned Stems
          </p>
        </div>
        <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-8 rounded-xl text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          EXPORT TO DAW (.ZIP)
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Channel 1: Vocal */}
        <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
          <Mic2 size={24} className="text-purple-400 mb-2" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8">Aether-Voice</h3>
          <div className="w-2 h-48 bg-black/40 rounded-full relative mb-8 shadow-inner">
            <div className="absolute bottom-0 w-full h-[85%] bg-gradient-to-t from-purple-900 to-purple-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.3)]"></div>
            {/* Fader Knob */}
            <div className="absolute bottom-[85%] -left-2 w-6 h-3 bg-slate-200 rounded shadow-lg transform translate-y-1/2 cursor-pointer border border-white/20"></div>
          </div>
          <div className="flex gap-2 w-full">
            <button className="flex-1 bg-purple-500/20 text-purple-400 text-[10px] font-bold py-1.5 rounded-lg border border-purple-500/20">S</button>
            <button className="flex-1 bg-white/5 text-slate-500 text-[10px] font-bold py-1.5 rounded-lg border border-white/5 hover:bg-red-500/20 hover:text-red-500 transition-colors">M</button>
          </div>
        </div>

        {/* Channel 2: Bass */}
        <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
          <AudioWaveform size={24} className="text-purple-300 mb-2" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8">Sub / 808</h3>
          <div className="w-2 h-48 bg-black/40 rounded-full relative mb-8 shadow-inner">
            <div className="absolute bottom-0 w-full h-[95%] bg-gradient-to-t from-purple-800 to-purple-300 rounded-full shadow-[0_0_10px_rgba(192,132,252,0.3)]"></div>
            <div className="absolute bottom-[95%] -left-2 w-6 h-3 bg-slate-200 rounded shadow-lg transform translate-y-1/2 cursor-pointer border border-white/20"></div>
          </div>
          <div className="flex gap-2 w-full">
            <button className="flex-1 bg-white/5 text-slate-500 text-[10px] font-bold py-1.5 rounded-lg border border-white/5 hover:bg-purple-500/20 hover:text-purple-400 transition-colors">S</button>
            <button className="flex-1 bg-white/5 text-slate-500 text-[10px] font-bold py-1.5 rounded-lg border border-white/5 hover:bg-red-500/20 hover:text-red-500 transition-colors">M</button>
          </div>
        </div>

        {/* Channel 3: Drums */}
        <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
          <Drum size={24} className="text-fuchsia-400 mb-2" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8">Late-Pocket</h3>
          <div className="w-2 h-48 bg-black/40 rounded-full relative mb-8 shadow-inner">
            <div className="absolute bottom-0 w-full h-[75%] bg-gradient-to-t from-fuchsia-900 to-fuchsia-400 rounded-full shadow-[0_0_10px_rgba(232,121,249,0.3)]"></div>
            <div className="absolute bottom-[75%] -left-2 w-6 h-3 bg-slate-200 rounded shadow-lg transform translate-y-1/2 cursor-pointer border border-white/20"></div>
          </div>
          <div className="flex gap-2 w-full">
            <button className="flex-1 bg-white/5 text-slate-500 text-[10px] font-bold py-1.5 rounded-lg border border-white/5 hover:bg-purple-500/20 hover:text-purple-400 transition-colors">S</button>
            <button className="flex-1 bg-white/5 text-slate-500 text-[10px] font-bold py-1.5 rounded-lg border border-white/5 hover:bg-red-500/20 hover:text-red-500 transition-colors">M</button>
          </div>
        </div>

        {/* Channel 4: Melody */}
        <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-6 flex flex-col items-center">
          <Volume2 size={24} className="text-pink-400 mb-2" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8">Texture</h3>
          <div className="w-2 h-48 bg-black/40 rounded-full relative mb-8 shadow-inner">
            <div className="absolute bottom-0 w-full h-[60%] bg-gradient-to-t from-pink-900 to-pink-400 rounded-full shadow-[0_0_10px_rgba(244,114,182,0.3)]"></div>
            <div className="absolute bottom-[60%] -left-2 w-6 h-3 bg-slate-200 rounded shadow-lg transform translate-y-1/2 cursor-pointer border border-white/20"></div>
          </div>
          <div className="flex gap-2 w-full">
            <button className="flex-1 bg-white/5 text-slate-500 text-[10px] font-bold py-1.5 rounded-lg border border-white/5 hover:bg-purple-500/20 hover:text-purple-400 transition-colors">S</button>
            <button className="flex-1 bg-white/5 text-slate-500 text-[10px] font-bold py-1.5 rounded-lg border border-white/5 hover:bg-red-500/20 hover:text-red-500 transition-colors">M</button>
          </div>
        </div>
      </div>
    </div>
  );
}
