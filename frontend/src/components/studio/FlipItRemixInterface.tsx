import React, { useState } from 'react';
import { Layers, Zap, ArrowRight, Coins, Fingerprint, Activity } from 'lucide-react';

interface ParentTrack {
  title: string;
  dnaTag: string;
  creatorId: string;
  royaltyRate: number;
}

interface FlipItRemixInterfaceProps {
  parentTrack?: ParentTrack;
}

export default function FlipItRemixInterface({ 
  parentTrack = { 
    title: "Sangre on the 808s", 
    dnaTag: "trk_alpha_9f8b7c6x5",
    creatorId: "usr_pro_001",
    royaltyRate: 0.05
  } 
}: FlipItRemixInterfaceProps) {
  const [targetGenre, setTargetGenre] = useState('Rio Drift Phonk');
  const [stemRetention, setStemRetention] = useState('vocals_only');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState<any>(null);

  const handleFlip = async () => {
    setIsFlipping(true);
    setFlipResult(null);
    
    try {
      // Simulates the POST /v1/empire/flip_asset API call firing the Kafka event
      const response = await fetch('/v1/empire/flip_asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentDnaTag: parentTrack.dnaTag,
          targetGenre: targetGenre,
          stemRetention: stemRetention,
          creatorId: parentTrack.creatorId,
          royaltyRate: parentTrack.royaltyRate
        })
      });
      
      const data = await response.json();
      setFlipResult(data);
    } catch (error) {
      console.error("Flip failed:", error);
    } finally {
      setIsFlipping(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-neutral-950 border border-neutral-800 rounded-2xl p-6 text-white shadow-[0_0_40px_rgba(0,0,0,0.8)] font-sans">
      
      {/* Original Track Info */}
      <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Parent Asset</p>
            <h3 className="text-lg font-black truncate">{parentTrack.title}</h3>
            <p className="text-xs text-blue-400 font-mono mt-1 flex items-center gap-1">
              <Fingerprint size={12}/> {parentTrack.dnaTag}
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2 text-center">
            <Coins className="text-amber-400 mx-auto mb-1" size={16} />
            <p className="text-[10px] text-amber-400 font-mono font-bold">${parentTrack.royaltyRate.toFixed(2)} Fee</p>
          </div>
        </div>
      </div>

      {/* S2 Mutation Controls */}
      <div className="space-y-5 mb-8">
        <div>
          <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Layers size={14} className="text-fuchsia-500"/> Retain Stems
          </label>
          <select 
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-sm font-bold focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none appearance-none cursor-pointer text-white"
            value={stemRetention}
            onChange={(e) => setStemRetention(e.target.value)}
          >
            <option value="vocals_only">Keep Vocals (Replace Beat)</option>
            <option value="beat_only">Keep Beat (Replace Vocals)</option>
            <option value="melody_only">Keep Melody (Replace Drums/Vocals)</option>
          </select>
        </div>

        <div className="flex justify-center text-neutral-600">
          <ArrowRight size={20} />
        </div>

        <div>
          <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Zap size={14} className="text-emerald-500"/> S2 Mutation Genre
          </label>
          <select 
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-sm font-bold focus:ring-emerald-500 focus:border-emerald-500 outline-none appearance-none cursor-pointer text-white"
            value={targetGenre}
            onChange={(e) => setTargetGenre(e.target.value)}
          >
            <option value="Rio Drift Phonk">Rio Drift Phonk (Cowbells & Sub)</option>
            <option value="Chicano Soul">Chicano Soul (Warm Horns)</option>
            <option value="UK Drill">UK Drill (Sliding 808s)</option>
            <option value="Acoustic Corrido">Acoustic Corrido (Requinto)</option>
          </select>
        </div>
      </div>

      {/* The FLIP IT Button */}
      <button 
        onClick={handleFlip}
        disabled={isFlipping}
        className="w-full relative group overflow-hidden rounded-xl font-black text-lg transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-emerald-600 group-hover:scale-105 transition-transform duration-300"></div>
        <div className="relative bg-black/20 backdrop-blur-sm w-full py-4 flex justify-center items-center gap-3 text-white">
          {isFlipping ? (
            <>
              <Activity className="animate-spin" size={24} />
              RENDERING 4-STEM MUTATION...
            </>
          ) : (
            <>
              <Zap size={24} fill="currentColor" />
              FLIP THIS TRACK
            </>
          )}
        </div>
      </button>

      {/* CockroachDB / Pulse-Stream Ledger Feedback */}
      {isFlipping && (
        <div className="mt-4 text-center animate-pulse">
          <p className="text-[10px] text-emerald-400 font-mono">
            EMPIRE SYNAPSE EVENT: Routing ${parentTrack.royaltyRate} to {parentTrack.creatorId}...
          </p>
          <p className="text-[10px] text-blue-400 font-mono mt-1">
            COCKROACHDB: Minting child DNA Tag...
          </p>
        </div>
      )}

      {flipResult && (
        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-bottom-2">
          <p className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2">
            <Fingerprint size={14}/> CHILD DNA MINTED
          </p>
          <p className="text-[10px] font-mono text-emerald-300/70 break-all">
            {flipResult.child_dna_tag}
          </p>
          <div className="mt-3 pt-3 border-t border-emerald-500/20 flex justify-between items-center">
            <span className="text-[10px] text-emerald-400/50 uppercase font-bold">Status</span>
            <span className="text-[10px] bg-emerald-500 text-black px-2 py-0.5 rounded font-black">SECURED</span>
          </div>
        </div>
      )}
    </div>
  );
}
