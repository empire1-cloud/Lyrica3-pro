import React, { useState, useEffect } from 'react';
import { HeartPulse, Activity, Zap, PlayCircle, Lock } from 'lucide-react';

export default function BiometricCoPerformance() {
  const [bpm, setBpm] = useState(72);
  const [isRecording, setIsRecording] = useState(false);
  const [vocalFry, setVocalFry] = useState(0.2);
  const [breathIntensity, setBreathIntensity] = useState(0.4);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        // Simulate heart rate fluctuations
        setBpm(prev => {
          const newBpm = prev + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3);
          return Math.max(60, Math.min(180, newBpm));
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    // RAFN logic: Heart rate spikes trigger emotional intensity
    if (bpm > 100) {
      setVocalFry(0.8);
      setBreathIntensity(0.9);
    } else if (bpm > 85) {
      setVocalFry(0.6);
      setBreathIntensity(0.7);
    } else {
      setVocalFry(0.2);
      setBreathIntensity(0.4);
    }
  }, [bpm]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#0a0a14] border border-[#2d2d6b] rounded-xl p-8 text-white shadow-2xl font-sans mt-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 border-b border-[#2d2d6b] pb-4">
        <div>
          <h2 className="text-3xl font-black flex items-center gap-3 text-red-500 tracking-tighter">
            <HeartPulse size={28} /> BIOMETRIC CO-PERFORMANCE (BECPM)
          </h2>
          <p className="text-sm text-[#888] mt-1 font-mono uppercase tracking-widest">Real-time Adaptive Fusion Network (RAFN) • Active</p>
        </div>
        <div className="flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-full text-xs font-bold font-mono">
          <Lock size={14} /> VICS PRIVACY ENGAGED
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        
        {/* Heart Rate Monitor Simulator */}
        <div className="bg-[#050505] border border-[#2d2d6b] rounded-lg p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <div className={`absolute inset-0 bg-red-500/5 transition-opacity duration-500 ${isRecording ? 'opacity-100' : 'opacity-0'}`} />
          
          <Activity size={64} className={`${isRecording ? 'text-red-500 animate-pulse' : 'text-[#444]'} mb-6`} />
          
          <div className="text-center z-10">
            <h1 className={`text-6xl font-black font-mono tracking-tighter ${isRecording ? 'text-white' : 'text-[#666]'}`}>
              {isRecording ? bpm : '--'} <span className="text-2xl text-red-500">BPM</span>
            </h1>
            <p className="text-xs text-[#888] uppercase tracking-widest mt-2">Live Heart Rate Input</p>
          </div>

          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={`mt-8 w-full py-3 font-bold tracking-widest text-sm transition-all border ${
              isRecording 
                ? 'bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30' 
                : 'bg-[#1a1a4e] border-[#2d2d6b] text-[#eee] hover:border-blue-500'
            }`}
          >
            {isRecording ? 'END CO-PERFORMANCE' : 'LINK APPLE WATCH / WEBCAM'}
          </button>
        </div>

        {/* EPD Output Parameters */}
        <div className="bg-[#13132b] border border-[#2d2d6b] rounded-lg p-6">
          <h3 className="text-lg font-bold text-[#eee] flex items-center gap-2 mb-6">
            <Zap size={18} className="text-yellow-500" /> Live EPD Translation Matrix
          </h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase text-[#888] font-bold font-mono">Vocal Fry Saturation</span>
                <span className="text-xs text-yellow-500 font-mono">{(vocalFry * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-[#050505] rounded-full overflow-hidden border border-[#2d2d6b]">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-300 ease-out"
                  style={{ width: `${vocalFry * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs uppercase text-[#888] font-bold font-mono">Adaptive Inhale Intensity</span>
                <span className="text-xs text-blue-500 font-mono">{(breathIntensity * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-[#050505] rounded-full overflow-hidden border border-[#2d2d6b]">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${breathIntensity * 100}%` }}
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-[#2d2d6b]">
              <p className="text-[10px] text-[#aaa] font-mono leading-relaxed bg-[#050505] p-3 border border-[#2d2d6b]">
                <strong className="text-red-500">RAFN LOGIC:</strong> As your simulated heart rate increases, the Emotive Performance Director (EPD) automatically drives physical exhaustion and desperation into the AI vocalist's rendering pipeline.
              </p>
            </div>

            <button disabled={!isRecording} className="w-full bg-[#1a1a4e] border border-blue-500 text-blue-500 hover:bg-[#2d2d6b] disabled:opacity-50 disabled:border-[#2d2d6b] disabled:text-[#666] font-bold py-3 text-sm tracking-widest transition-all flex justify-center items-center gap-2">
               <PlayCircle size={18} /> INJECT LIVE BIOMETRICS TO MIX
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}