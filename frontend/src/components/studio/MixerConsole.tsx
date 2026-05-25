import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

const MacroKnob = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
  <div className="flex flex-col items-center mx-2">
    <input
      type="range"
      min={0}
      max={100}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      aria-label={label}
      className="accent-blue-400 h-24 w-4 cursor-pointer"
      style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
    />
    <span className="text-[10px] text-slate-500 mt-3 font-mono uppercase tracking-[0.2em]">{label}</span>
  </div>
);

const BusMini = ({ name, color, active, onClick }: any) => (
  <button
    className={`rounded-2xl w-32 py-4 mb-2 flex flex-col items-center transition-all border ${active ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "bg-black/40 border-white/5 hover:bg-black/60"}`}
    style={{ borderLeft: `4px solid ${color}` }}
    onClick={onClick}
  >
    <div className="text-[10px] font-black mb-3 uppercase tracking-widest" style={{ color }}>{name}</div>
    <div className="w-16 h-1 bg-black/40 rounded-full mb-3 overflow-hidden shadow-inner">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: "70%", backgroundColor: color }} />
    </div>
    <div className={`text-[8px] uppercase tracking-[0.3em] font-black ${active ? 'text-blue-400' : 'text-slate-600'}`}>
      {active ? 'Active' : 'Standby'}
    </div>
  </button>
);

const MixerBus = ({ name, color }: any) => {
  const [tone, setTone] = useState(52);
  const [space, setSpace] = useState(38);
  const [loud, setLoud] = useState(82);
  const [pan, setPan] = useState(50);
  const [mute, setMute] = useState(false);
  const [solo, setSolo] = useState(false);

  return (
    <div className="p-8 bg-black/40 rounded-3xl shadow-2xl max-w-md mx-auto my-4 border border-white/5 border-l-4 transition-all" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-10">
        <span className="font-bold text-white text-lg tracking-tight">{name}</span>
        <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button 
            className={`rounded-lg px-4 py-2 text-[10px] font-black tracking-widest transition-all ${mute ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-slate-500 hover:text-white'}`} 
            onClick={()=>setMute(!mute)}
          >
            MUTE
          </button>
          <button 
            className={`rounded-lg px-4 py-2 text-[10px] font-black tracking-widest transition-all ${solo ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-500 hover:text-white'}`} 
            onClick={()=>setSolo(!solo)}
          >
            SOLO
          </button>
        </div>
      </div>
      <div className="flex gap-4 justify-between px-2">
        <MacroKnob label="Tone" value={tone} onChange={setTone} />
        <MacroKnob label="Space" value={space} onChange={setSpace} />
        <MacroKnob label="Loud" value={loud} onChange={setLoud} />
        <MacroKnob label="Pan" value={pan} onChange={setPan} />
      </div>
    </div>
  );
};

const MasterStrip = () => {
  const [out, setOut] = useState(100);
  return (
    <div className="p-6 mt-10 bg-blue-500/5 border border-blue-500/10 rounded-3xl shadow-lg flex items-center justify-between max-w-3xl mx-auto backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <SlidersHorizontal className="w-5 h-5 text-blue-400" />
        </div>
        <span className="font-bold text-lg text-white tracking-tight">Master Bus</span>
      </div>
      <div className="flex items-center flex-1 max-w-md mx-8">
        <input 
          type="range" 
          min={0} max={100} 
          value={out} 
          onChange={e=>setOut(Number(e.target.value))} 
          className="w-full accent-blue-500 h-1.5 bg-obsidian-800 rounded-full appearance-none cursor-pointer" 
        />
      </div>
      <span className="text-blue-400 font-mono bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20 w-20 text-center text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.1)]">
        {out}%
      </span>
    </div>
  );
};

export default function MixerConsole() {
  const [activeBus, setActiveBus] = useState("Vocal/Lead");
  const busList = [
    { name: "Vocal/Lead", color: "#60a5fa" },
    { name: "Harmony/Pad", color: "#818cf8" },
    { name: "Rhythm/Bass", color: "#38bdf8" },
    { name: "Percussion", color: "#c084fc" }
  ];

  return (
    <div className="w-full p-6 md:p-10 glass-card">
      <div className="flex items-center gap-4 mb-10">
        <h2 className="text-2xl font-bold text-white tracking-tight">SSL-V Console</h2>
        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8px] font-black tracking-[0.2em] px-3 py-1 rounded-full">PRO VERSION</span>
      </div>
      
      <div className="flex gap-4 mb-10 flex-wrap justify-center">
        {busList.map(bus =>
          <BusMini key={bus.name} {...bus} active={activeBus === bus.name} onClick={()=>setActiveBus(bus.name)} />
        )}
      </div>
      
      <div className="min-h-[350px]">
        {busList.map(bus => 
          activeBus === bus.name ? <MixerBus key={bus.name} {...bus} /> : null
        )}
      </div>
      
      <MasterStrip />
    </div>
  );
}
