import { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, Download, PlayCircle } from 'lucide-react';

const sfxList = [
  {
    name: "The Vault Lock",
    description: "Sudden thunder crack, sharp transient followed by long rumble.",
    amps: { Material: "Dynamic", Mass: "Auto", Environment: "Adaptive" }
  },
  {
    name: "Energy Hit",
    description: "Howling wind through a narrow mountain pass.",
    amps: { Frequency: "Auto", Envelope: "Adaptive", Material: "Dynamic" }
  }
];

export default function LeyModeler() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  return (
    <div className="glass-card p-6 md:p-8 h-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Zap className="w-6 h-6 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Ley Modeler (SFX)</h2>
      </div>

      <div className="space-y-4">
        {sfxList.map((sfx, idx) => (
          <div key={sfx.name} className="bg-black/30 rounded-2xl border border-white/5 p-5 border-l-4 border-l-blue-500 transition-all hover:bg-black/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="w-10 h-10 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                  <PlayCircle className="w-6 h-6" />
                </button>
                <div>
                  <span className="font-bold text-blue-400 block tracking-tight">{sfx.name}</span>
                  <span className="text-slate-500 text-xs leading-relaxed">{sfx.description}</span>
                </div>
              </div>
              <button 
                onClick={() => setExpandedCard(expandedCard === idx ? null : idx)} 
                className="text-[10px] text-blue-300 font-bold uppercase tracking-widest flex items-center gap-1 hover:text-blue-200 shrink-0 ml-4 transition-colors"
              >
                AMPs {expandedCard === idx ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            
            {expandedCard === idx && (
              <div className="mt-5 pt-5 border-t border-white/5 text-sm">
                <div className="font-bold mb-3 text-blue-300 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                  Acoustic Modeling Parameters 
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-2 py-0.5 text-[8px] font-black tracking-tighter">PRO Feature</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(sfx.amps).map(([k,v]) => (
                    <div key={k} className="bg-black/40 rounded-xl p-2.5 border border-white/5">
                      <span className="block text-slate-500 text-[9px] uppercase tracking-widest mb-1">{k}</span>
                      <span className="text-blue-200 font-bold text-xs">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="mt-8 w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 text-sm font-bold rounded-2xl tracking-widest uppercase transition-all shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)]">
        <Download className="w-5 h-5" />
        Download SFX Pack (.ZIP)
      </button>
    </div>
  );
}
