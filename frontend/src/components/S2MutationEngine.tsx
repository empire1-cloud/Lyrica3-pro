import React, { useState } from 'react';
import { Dna, MoveRight, Zap, AudioLines } from 'lucide-react';

export default function S2MutationEngine() {
  const [baseGenre, setBaseGenre] = useState('Drill');
  const [mutationGenre, setMutationGenre] = useState('Chicano Soul');
  
  const handleExecute = async () => {
    // In a real implementation, this would trigger an API call
    console.log(`Executing Metamorphic Blend: ${baseGenre} + ${mutationGenre}`);
    alert(`Triggering S2 Serendipity Synthesizer:\nBase: ${baseGenre}\nMutation: ${mutationGenre}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#0a0a14] border border-[#2d2d6b] rounded-xl p-8 text-white shadow-2xl font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-[#2d2d6b] pb-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 text-[#ff1493] tracking-tighter">
            <Dna size={28} /> S2 SERENDIPITY SYNTHESIZER
          </h2>
          <p className="text-sm text-[#888] mt-1 font-mono uppercase tracking-widest">Metamorphic Blending Engine • Lyrica 3 Pro</p>
        </div>
        <div className="bg-[#ff1493]/10 text-[#ff1493] border border-[#ff1493]/20 px-4 py-2 rounded-full text-xs font-bold font-mono animate-pulse">
          STATUS: AGENTS READY
        </div>
      </div>

      {/* Cross-Pollinator Core */}
      <div className="flex items-center justify-between gap-6 mb-10">
        
        {/* Base Genre Card */}
        <div className="flex-1 bg-[#13132b] border border-[#2d2d6b] rounded-lg p-6 relative overflow-hidden group hover:border-blue-500 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <label className="text-xs text-[#888] font-bold uppercase mb-2 block">Base Primitive (Groove & Tempo)</label>
          <select 
            className="w-full bg-transparent text-2xl font-black text-white focus:outline-none appearance-none cursor-pointer"
            value={baseGenre}
            onChange={(e) => setBaseGenre(e.target.value)}
          >
            <option value="Drill">🅳 Drill</option>
            <option value="Afrobeat">🅰️ Afrobeat</option>
            <option value="Trap">🆃 Trap</option>
            <option value="Corridos">🅲 Corridos</option>
            <option value="K-Pop">🅺 K-Pop</option>
            <option value="House">🅷 House</option>
          </select>
          <p className="text-xs font-mono text-blue-400 mt-4 flex items-center gap-2">
             <AudioLines size={14}/> Active Agent: Late-Pocket Groove Sculptor
          </p>
        </div>

        {/* Mutation Arrow */}
        <div className="flex flex-col items-center justify-center text-[#666]">
          <MoveRight size={32} className="text-[#ff1493]" />
          <span className="text-[10px] font-mono mt-2 tracking-widest text-[#888]">FUSE</span>
        </div>

        {/* Mutation Genre Card */}
        <div className="flex-1 bg-[#13132b] border border-[#2d2d6b] rounded-lg p-6 relative overflow-hidden group hover:border-[#ff1493] transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#ff1493]"></div>
          <label className="text-xs text-[#888] font-bold uppercase mb-2 block">Mutation Primitive (Melody & Texture)</label>
          <select 
            className="w-full bg-transparent text-2xl font-black text-white focus:outline-none appearance-none cursor-pointer"
            value={mutationGenre}
            onChange={(e) => setMutationGenre(e.target.value)}
          >
            <option value="Chicano Soul">🅲 Chicano Soul</option>
            <option value="Doo-Wop">🅳 Doo-Wop</option>
            <option value="Metal">🅼 Metal</option>
            <option value="Mariachi">🅼 Mariachi</option>
            <option value="Gospel">🅶 Gospel</option>
            <option value="Synthwave">🆂 Synthwave</option>
          </select>
          <p className="text-xs font-mono text-[#ff1493] mt-4 flex items-center gap-2">
             <AudioLines size={14}/> Active Agent: Harmonic Emotion Cartographer
          </p>
        </div>

      </div>

      {/* Action Button */}
      <button onClick={handleExecute} className="w-full bg-[#1a1a4e] border border-[#ff1493] hover:bg-[#2d2d6b] text-white font-black text-lg py-5 rounded-lg shadow-[0_0_30px_rgba(255,20,147,0.2)] transition-all flex justify-center items-center gap-3 transform hover:scale-[1.01]">
        <Zap size={24} className="text-[#ff1493]" fill="currentColor" />
        EXECUTE METAMORPHIC BLEND (48kHz STEMS)
      </button>

    </div>
  );
}