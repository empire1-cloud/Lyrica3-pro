import { Waves, Download, PlayCircle } from 'lucide-react';

export default function AmbientMaster() {
  return (
    <div className="glass-card p-6 md:p-8 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Waves className="w-6 h-6 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Ambient Master</h2>
      </div>

      <div className="bg-black/30 rounded-2xl border border-white/5 p-6 border-l-4 border-l-blue-500 flex-1 transition-all hover:bg-black/40">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="font-bold text-blue-400 block mb-1 tracking-tight">Soundscape</span>
            <div className="text-slate-400 text-xs leading-relaxed">Distant chanting, dripping water, resonant stone acoustics.</div>
          </div>
          <button className="text-[10px] text-blue-300 hover:text-blue-200 font-bold uppercase tracking-widest shrink-0 ml-4 transition-colors">Loop Details</button>
        </div>
        
        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5 mb-6">
          <button className="text-blue-400 hover:text-blue-300 shrink-0 transition-all hover:scale-110">
            <PlayCircle className="w-8 h-8" />
          </button>
          <div className="h-1.5 flex-1 bg-obsidian-800 rounded-full overflow-hidden">
             <div className="w-1/3 h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
          </div>
          <span className="text-[10px] text-slate-500 font-mono shrink-0">01:24 / 05:00</span>
        </div>

        <div className="text-xs text-slate-400 bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl leading-relaxed">
          <span className="text-blue-400 font-bold uppercase text-[10px] tracking-widest mr-2">Loop Element:</span> A low, sustained Tibetan throat singing note.
        </div>
      </div>

      <button className="mt-8 w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 text-sm font-bold rounded-2xl tracking-widest uppercase transition-all shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)]">
        <Download className="w-5 h-5" />
        Download Ambient (.ZIP)
      </button>
    </div>
  );
}
