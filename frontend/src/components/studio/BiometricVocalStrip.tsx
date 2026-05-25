import React, { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Mic2, Sliders, RadioReceiver, Fingerprint, RefreshCw } from 'lucide-react';

interface BiometricVocalStripProps {
  audioUrl: string;
  vulnerabilityLevel?: number;
  creatorId?: string;
  dnaTag?: string;
}

export default function BiometricVocalStrip({ 
  audioUrl, 
  vulnerabilityLevel = 0.85,
  creatorId = "EMP1_ALPHA_99",
  dnaTag = "trk_alpha_9f8a7b6c5d"
}: BiometricVocalStripProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const playerRef = useRef<Tone.Player | null>(null);

  useEffect(() => {
    // 1. VICS Cryptographic Handshake (Mocked for UI)
    const verifySoulfireDNA = async () => {
      console.log(`[VICS] Verifying DNA Tag: ${dnaTag} for Creator: ${creatorId}`);
      // Simulate ledger verification latency
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsVerified(true);
    };

    // 2. Initialize Tone.js Architecture (PTM & EPD)
    const setupAudio = async () => {
      await Tone.start();

      // Proximity Effect (Close-mic intimate feel)
      const proximityEQ = new Tone.EQ3({
        low: 4 * vulnerabilityLevel, 
        mid: -1.5, // Bruised subtext scooping
        high: 2,
        lowFrequency: 250
      });

      // Vocal Fry / Crackle (Biometric grit)
      const vocalFry = new Tone.Distortion({
        distortion: 0.15 * vulnerabilityLevel,
        oversample: '2x'
      });

      // Analog Tape Saturation (Warmth)
      const tapeSaturation = new Tone.Chebyshev({
        order: 51,
        oversample: 'none'
      });

      // Room Air (Isolation booth)
      const roomAir = new Tone.Reverb({
        decay: 1.2,
        preDelay: 0.01,
        wet: 0.15
      });

      // Master output with strict Soulfire LUFS limiting
      const masterLimiter = new Tone.Limiter(-0.5);

      playerRef.current = new Tone.Player(audioUrl).chain(
        proximityEQ,
        vocalFry,
        tapeSaturation,
        roomAir,
        masterLimiter,
        Tone.Destination
      );

      await playerRef.current.load(audioUrl);
      setIsLoaded(true);
    };

    if (audioUrl) {
      verifySoulfireDNA().then(setupAudio);
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [audioUrl, vulnerabilityLevel, dnaTag, creatorId]);

  const togglePlayback = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.stop();
    } else {
      playerRef.current.start();
    }
    setIsPlaying(!isPlaying);
  };

  const triggerFlipIt = async () => {
    // Triggers Empire 1 Ledger remix routing
    console.log(`[EMPIRE 1 LEDGER] Initiating 'Flip' for DNA Tag: ${dnaTag}. Micro-royalties routed to ${creatorId}.`);
    
    try {
      const response = await fetch('/v1/empire/flip_asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentDnaTag: dnaTag,
          targetGenre: "Rio Drift Phonk", // Default flip genre
          stemRetention: "vocals_only",
          creatorId: creatorId,
          royaltyRate: 0.05
        })
      });
      
      const data = await response.json();
      if (data.status === 'SUCCESS') {
        alert(`Track Flipped Successfully!\nChild DNA: ${data.child_dna_tag}\nRoyalty of $${data.royalty_routing.amount} routed to ${data.royalty_routing.recipient}.`);
      }
    } catch (error) {
      console.error("Flip failed:", error);
      alert("Remix routing failed. Check VICS connection.");
    }
  };

  return (
    <div className="bg-obsidian-900 border border-white/5 rounded-xl p-6 text-white w-full max-w-md shadow-2xl relative overflow-hidden glass-card">
      {/* Cryptographic Watermark Overlay */}
      <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
         <Fingerprint size={120} />
      </div>

      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-3 relative z-10">
        <h3 className="text-lg font-black flex items-center gap-2 text-blue-500 tracking-tight">
          <Mic2 size={20} /> AETHER-VOICE (EPD)
        </h3>
        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-mono border border-blue-500/20">
          SSL-V CONSOLE
        </span>
      </div>

      <div className="space-y-4 font-mono text-xs text-slate-400 mb-6 relative z-10">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2"><Fingerprint size={14}/> VICS DNA Ledger</span>
          <span className={isVerified ? "text-blue-400" : "text-amber-400"}>
            {isVerified ? "VERIFIED" : "SYNCING..."}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2"><RadioReceiver size={14}/> Proximity Effect</span>
          <span className="text-blue-400">ACTIVE (+{Math.round(4 * vulnerabilityLevel)}dB)</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2"><Sliders size={14}/> Vocal Fry Saturation</span>
          <span className="text-amber-400">ACTIVE ({(0.15 * vulnerabilityLevel).toFixed(2)} THD)</span>
        </div>
      </div>

      <div className="flex gap-2 relative z-10">
        <button 
          onClick={togglePlayback}
          disabled={!isLoaded || !isVerified}
          className={`flex-1 py-4 rounded-lg font-black text-sm transition-all flex justify-center items-center gap-2 
            ${(isLoaded && isVerified)
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
              : 'bg-obsidian-950 text-slate-600 cursor-not-allowed border border-white/5'}`}
        >
          {isLoaded && isVerified ? (isPlaying ? 'STOP SOULFIRE' : 'AUDITION BIOMETRIC') : 'LOADING NEURAL BUFFER...'}
        </button>

        {/* The Empire 1 "Flip It" Button */}
        <button 
          onClick={triggerFlipIt}
          disabled={!isLoaded || !isVerified}
          className={`px-4 rounded-lg font-black transition-all flex justify-center items-center 
            ${(isLoaded && isVerified)
              ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
              : 'bg-obsidian-950 text-slate-600 cursor-not-allowed border border-white/5'}`}
          title="Remix & Route Micro-Royalties"
        >
          <RefreshCw size={18} />
        </button>
      </div>
    </div>
  );
}
