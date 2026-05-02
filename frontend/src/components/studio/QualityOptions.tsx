import { useState } from 'react';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';

export default function QualityOptions({ 
  sampleRate, 
  setSampleRate, 
  bitDepth, 
  setBitDepth 
}: { 
  sampleRate?: string; 
  setSampleRate?: (val: any) => void; 
  bitDepth?: string; 
  setBitDepth?: (val: any) => void; 
}) {
  const [expanded, setExpanded] = useState(false);
  const [pitchAlgo, setPitchAlgo] = useState(1); // Default to Natural Auto-Tune

  const pitchAlgos = [
    'Melodyne-style Direct Tuning',
    'Natural Auto-Tune',
    'Manual Fine-Tuning'
  ];

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between bg-black/20 hover:bg-black/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings2 className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-indigo-200">Quality & Advanced Options</span>
          <span className="bg-indigo-500/20 text-indigo-300 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border border-indigo-500/30">PRO</span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-neutral-500" /> : <ChevronDown className="w-5 h-5 text-neutral-500" />}
      </button>

      {expanded && (
        <div className="p-6 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-indigo-300 mb-2 uppercase tracking-widest">Audio Quality (Export)</h4>
              
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Sample Rate</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['44.1kHz', '48kHz', '96kHz'].map((rate) => (
                      <button 
                        key={rate}
                        onClick={() => setSampleRate?.(rate)}
                        className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${sampleRate === rate ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}
                      >
                        {rate}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Bit Depth</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['16-bit', '24-bit', '32-bit float'].map((depth) => (
                      <button 
                        key={depth}
                        onClick={() => setBitDepth?.(depth)}
                        className={`py-2 text-[10px] font-bold rounded-xl border transition-all ${bitDepth === depth ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}
                      >
                        {depth.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-indigo-300 mb-2">Vocal Realism</h4>
              <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:border-indigo-500 outline-none">
                <option>Draft (Fast, for ideas)</option>
                <option>Studio (Best for release)</option>
                <option>Ultra Live (Max realism, slowest)</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <h4 className="font-semibold text-sm text-indigo-300">Pitch Correction Algorithm</h4>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  {pitchAlgos[pitchAlgo]}
                </span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="2" 
                step="1" 
                value={pitchAlgo}
                onChange={(e) => setPitchAlgo(parseInt(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mb-2" 
              />
              <div className="flex justify-between text-[9px] text-neutral-500 font-bold uppercase tracking-tighter px-1">
                <span>Direct</span>
                <span>Natural</span>
                <span>Manual</span>
              </div>
            </div>
          </section>
          <section className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-semibold text-sm text-indigo-300">Creativity / Conservatism</label>
                <span className="text-xs text-neutral-500">0.75</span>
              </div>
              <input type="range" min="0" max="1" step="0.05" defaultValue="0.75" className="w-full accent-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-sm text-indigo-300 mb-2 block">Rhyme Density</label>
                <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:border-indigo-500 outline-none">
                  <option>Normal</option>
                  <option>Loose</option>
                  <option>Dense</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-sm text-indigo-300 mb-2 block">Slang Intensity</label>
                <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:border-indigo-500 outline-none">
                  <option>Light</option>
                  <option>Natural</option>
                  <option>Heavy</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
