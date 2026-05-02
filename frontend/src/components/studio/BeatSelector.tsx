import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, Flame, Sparkles, Activity, Fingerprint, Music } from 'lucide-react';

const popularBeats = [
  { id: 'rioDrift', name: 'Rio Drift Phonk', bpm: 130, dna: 'trk_msgo_rio_88x', trending: true, isNew: true },
  { id: 'ukDrill', name: 'UK Drill Slide', bpm: 140, dna: 'trk_msgo_drill_44x', trending: true, isNew: false },
  { id: 'corridosTumbado', name: 'Corrido Tumbado', bpm: 128, dna: 'trk_msgo_corr_99x', trending: true, isNew: false },
  { id: 'chicanoSoul', name: 'Chicano Souldies', bpm: 78, dna: 'trk_msgo_soul_22x', trending: false, isNew: false },
  { id: 'jerseyClub', name: 'Jersey Club Shuffle', bpm: 155, dna: 'trk_msgo_jrsy_11x', trending: true, isNew: false },
  { id: 'trap808', name: 'Trap 808 Rumble', bpm: 145, dna: 'trk_msgo_trap_55x', trending: false, isNew: true },
  { id: 'steppers', name: 'Steppers Drums', bpm: 124, dna: 'trk_msgo_step_33x', trending: false, isNew: true },
  { id: 'gfunk', name: 'West Coast G-Funk', bpm: 92, dna: 'trk_msgo_gfnk_66x', trending: false, isNew: false },
];

export default function BeatSelector() {
  const [selected, setSelected] = useState('rioDrift');

  const currentBeat = popularBeats.find(b => b.id === selected) || popularBeats[0];

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <Music className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">MSGO Beat Selector</h2>
            <p className="text-neutral-400 text-sm">Select a foundation for the Resonance-X Codec.</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-neutral-800">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Codec: Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {popularBeats.map(beat => (
          <button
            key={beat.id}
            onClick={() => setSelected(beat.id)}
            className={`relative p-4 rounded-2xl border text-left transition-all group
              ${selected === beat.id 
                ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.15)]' 
                : 'bg-black/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'}
            `}
          >
            <div className="flex justify-between items-start mb-3">
              <PlayCircle className={`w-6 h-6 ${selected === beat.id ? 'text-indigo-400' : 'text-neutral-600 group-hover:text-neutral-400'}`} />
              <div className="flex gap-1">
                {beat.trending && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                {beat.isNew && <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className={`font-bold text-sm ${selected === beat.id ? 'text-white' : 'text-neutral-300'}`}>{beat.name}</h3>
              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                <span>{beat.bpm} BPM</span>
                <span className="w-1 h-1 rounded-full bg-neutral-700" />
                <span className="truncate">{beat.dna}</span>
              </div>
            </div>

            {selected === beat.id && (
              <motion.div 
                layoutId="active-beat"
                className="absolute inset-0 border-2 border-indigo-500 rounded-2xl pointer-events-none"
              />
            )}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Active DNA Tag</span>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
              <Fingerprint className="w-3 h-3" />
              {currentBeat.dna}
            </div>
          </div>
          <div className="w-px h-8 bg-neutral-800" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Tempo Sync</span>
            <div className="text-xs font-mono text-white">{currentBeat.bpm} BPM</div>
          </div>
        </div>
        
        <button className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg transition-all uppercase tracking-widest shadow-lg shadow-indigo-500/20">
          Lock Base Primitive
        </button>
      </div>
    </div>
  );
}
