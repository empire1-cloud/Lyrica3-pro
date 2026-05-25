import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Repeat, Heart, MessageCircle, Share2, Play, Pause, Disc3, Sparkles, Fingerprint, Coins, ChevronUp, ChevronDown, Zap, ShieldCheck, Plus, Music } from 'lucide-react';

export default function SLUniversal() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [mutationLevel, setMutationLevel] = useState(0);
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
    }
    setIsPlaying(!isPlaying);
  };

  // Auto-reset mint success
  useEffect(() => {
    if (mintSuccess) {
      const timer = setTimeout(() => {
        setMintSuccess(false);
        setIsFlipping(false);
        setMutationLevel(0);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [mintSuccess]);

  const handleMint = () => {
    setIsMinting(true);
    setTimeout(() => {
      setIsMinting(false);
      setMintSuccess(true);
    }, 1500);
  };

  const getMutationText = () => {
    if (mutationLevel < 20) return "UK Drill 808 / Urban Paranoia";
    if (mutationLevel < 50) return "Stripping Drill hi-hats... Pitching down vocals";
    if (mutationLevel < 80) return "Injecting 70BPM Acoustic Guitars...";
    return "Acoustic Mariachi / Desert Mourning";
  };

  const getVocalPreservationText = () => {
    if (mutationLevel < 30) return "Raw Studio Vocal";
    if (mutationLevel < 70) return "Adding Tape Saturation";
    return "Tape Degraded Warmth (Stutters Removed)";
  };

  return (
    <div className="h-[calc(100vh-120px)] flex items-center justify-center pb-10">
      {/* Mobile-sized container for the feed */}
      <div className="w-full max-w-[420px] h-[840px] max-h-full bg-obsidian-950 rounded-[4rem] border-[12px] border-obsidian-900 overflow-hidden relative shadow-[0_0_100px_rgba(168,85,247,0.15)] ring-1 ring-white/5">
        
        {/* Background Visuals */}
        <audio 
          ref={audioRef}
          src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" 
          loop
          className="hidden"
        />
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 transition-opacity duration-1000 ${mutationLevel > 50 ? 'opacity-0' : 'opacity-100'}`}>
            {/* Original Vibe: Dark, Drill, Urban */}
            <div className="absolute inset-0 bg-gradient-to-b from-obsidian-900 to-obsidian-950" />
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-velvet-purple/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className={`absolute inset-0 transition-opacity duration-1000 ${mutationLevel > 50 ? 'opacity-100' : 'opacity-0'}`}>
            {/* Mutated Vibe: Desert, Acoustic, Warm */}
            <div className="absolute inset-0 bg-gradient-to-b from-velvet-purple/30 to-obsidian-950" />
            <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-500/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-slate-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          {/* Grid overlay */}
          <div className="architectural-grid absolute inset-0 opacity-[0.05] pointer-events-none" />
        </div>

        {/* Top UI */}
        <div className="absolute top-0 inset-x-0 p-8 z-20 flex justify-between items-center bg-gradient-to-b from-obsidian-950/80 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-velvet-purple/20 rounded-lg border border-velvet-purple/30">
              <Radio className="w-4 h-4 text-velvet-purple" />
            </div>
            <span className="font-bold tracking-[0.3em] text-[9px] text-white uppercase">SL Universal</span>
          </div>
          <div className="flex gap-6 text-white/40 text-[10px] font-bold tracking-[0.2em] uppercase">
            <span className="text-white border-b-2 border-velvet-purple pb-1">Following</span>
            <span>For You</span>
          </div>
        </div>

        {/* Main Content Area (Click to play/pause) */}
        <div 
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={() => !isFlipping && togglePlay()}
        >
          <AnimatePresence>
            {!isPlaying && !isFlipping && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-24 h-24 bg-white/5 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                  <Play className="w-10 h-10 text-white ml-2 fill-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar Actions */}
        <div className="absolute right-6 bottom-36 z-20 flex flex-col items-center gap-8">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-full bg-obsidian-900 border-2 border-velvet-purple/50 overflow-hidden relative shadow-lg shadow-velvet-purple/20">
              <img src="https://picsum.photos/seed/terra/100/100" alt="Creator" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-velvet-purple rounded-full p-1 border border-obsidian-950">
                <Plus className="w-2 h-2 text-white" />
              </div>
            </div>
          </motion.div>
          
          <div className="flex flex-col items-center gap-2">
            <button className="w-14 h-14 rounded-[1.5rem] bg-white/5 backdrop-blur-xl flex items-center justify-center text-white hover:bg-pink-500/20 hover:text-pink-400 transition-all border border-white/5">
              <Heart className="w-7 h-7" />
            </button>
            <span className="text-[10px] font-bold text-white/60 tracking-widest">1.2M</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button className="w-14 h-14 rounded-[1.5rem] bg-white/5 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/10 transition-all border border-white/5">
              <MessageCircle className="w-7 h-7" />
            </button>
            <span className="text-[10px] font-bold text-white/60 tracking-widest">84K</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFlipping(true)}
              className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-velvet-purple to-fuchsia-600 flex items-center justify-center text-white shadow-xl shadow-velvet-purple/30 relative group"
            >
              <div className="absolute inset-0 rounded-[2rem] bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Repeat className="w-8 h-8" />
            </motion.button>
            <span className="text-[9px] font-bold text-velvet-purple tracking-[0.2em] uppercase">Flip It</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button className="w-14 h-14 rounded-[1.5rem] bg-white/5 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/10 transition-all border border-white/5">
              <Share2 className="w-7 h-7" />
            </button>
            <span className="text-[10px] font-bold text-white/60 tracking-widest uppercase">Share</span>
          </div>

          <div className={`w-14 h-14 rounded-full border-4 border-obsidian-900 flex items-center justify-center overflow-hidden shadow-2xl ${isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''}`}>
            <img src="https://picsum.photos/seed/album/100/100" alt="Album Art" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-0 inset-x-0 p-8 pt-16 z-10 bg-gradient-to-t from-obsidian-950 via-obsidian-950/90 to-transparent pointer-events-none">
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold italic text-white tracking-tight">@terra_vics</h2>
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                <Music className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-lg text-slate-300 font-serif italic">Obsidian Lace (Original Mix)</h3>
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5 bg-velvet-purple/10 border border-velvet-purple/20 rounded-xl w-fit">
              <Fingerprint className="w-3.5 h-3.5 text-velvet-purple" />
              <span className="text-[9px] font-mono text-velvet-purple font-bold tracking-widest uppercase">trk_s2_terra_drill_404x</span>
            </div>
            
            {/* Scroll indicator */}
            <div className="flex flex-col items-center justify-center mt-8 opacity-30">
              <ChevronUp className="w-4 h-4 text-white animate-bounce" />
              <span className="text-[8px] text-white uppercase tracking-[0.4em] font-bold">Swipe</span>
            </div>
          </div>
        </div>

        {/* Flip Overlay (Mutation Engine) */}
        <AnimatePresence>
          {isFlipping && (
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              className="absolute inset-0 z-30 bg-obsidian-950/90 backdrop-blur-3xl flex flex-col"
            >
              <div className="p-8 pb-6 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-velvet-purple/10 rounded-xl border border-velvet-purple/20">
                    <Sparkles className="w-5 h-5 text-velvet-purple" />
                  </div>
                  <span className="text-lg font-serif font-bold italic text-white tracking-tight">S2 Serendipity Engine</span>
                </div>
                <button 
                  onClick={() => setIsFlipping(false)}
                  className="micro-label !text-slate-500 hover:!text-white transition-colors"
                >
                  Cancel
                </button>
              </div>

              <div className="flex-1 p-10 flex flex-col justify-center space-y-12">
                <div className="text-center space-y-4">
                  <h3 className="text-3xl font-serif font-bold italic text-white tracking-tight">Aesthetic Disruption</h3>
                  <p className="text-slate-500 font-serif italic">Slide to mutate the DNA of "Obsidian Lace"</p>
                </div>

                {/* Visualizer / Status */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 h-64 flex flex-col justify-center items-center text-center relative overflow-hidden shadow-inner">
                  <div className="architectural-grid absolute inset-0 opacity-[0.03] pointer-events-none" />
                  <div className="absolute inset-0 opacity-10">
                    <div className={`absolute inset-0 bg-gradient-to-r from-velvet-purple to-fuchsia-500 transition-opacity duration-1000 ${mutationLevel > 50 ? 'opacity-0' : 'opacity-100'}`} />
                    <div className={`absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-velvet-purple transition-opacity duration-1000 ${mutationLevel > 50 ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  
                  <div className="relative z-10 space-y-8 w-full">
                    <div className="space-y-3">
                      <div className="flex justify-between micro-label !text-slate-600">
                        <span>MSGO Primitive</span>
                        <span className="text-white">{getMutationText()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-velvet-purple shadow-[0_0_15px_rgba(168,85,247,0.5)]" 
                          animate={{ width: `${mutationLevel}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between micro-label !text-slate-600">
                        <span>EPD Vocal State</span>
                        <span className="text-velvet-purple">{getVocalPreservationText()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]" 
                          animate={{ width: `${Math.max(10, mutationLevel)}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slider */}
                <div className="space-y-8">
                  <div className="relative h-12 flex items-center">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={mutationLevel}
                      onChange={(e) => setMutationLevel(parseInt(e.target.value))}
                      className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-velvet-purple"
                    />
                  </div>
                  <div className="flex justify-between micro-label !text-slate-600">
                    <span>Original</span>
                    <span>Total Mutation</span>
                  </div>
                </div>

                {/* Mint Button */}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMint}
                  disabled={isMinting || mutationLevel < 10}
                  className="w-full py-6 rounded-[2rem] font-bold flex items-center justify-center gap-4 transition-all bg-white text-black hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-white/10 uppercase tracking-[0.2em] text-xs"
                >
                  {isMinting ? (
                    <span className="animate-pulse flex items-center gap-3">
                      <Disc3 className="w-5 h-5 animate-spin" />
                      Synthesizing...
                    </span>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-black" />
                      Mint Derivative
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cryptographic Confirmation Toast */}
        <AnimatePresence>
          {mintSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="absolute bottom-10 inset-x-6 z-40"
            >
              <div className="bg-emerald-950/80 border border-emerald-500/30 backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl shadow-emerald-500/20 flex items-start gap-5">
                <div className="p-3 bg-emerald-500/20 rounded-2xl shrink-0 border border-emerald-500/30">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-emerald-400 font-serif font-bold italic text-lg">Derivative Minted</h4>
                  <p className="text-emerald-200/60 text-[10px] leading-relaxed font-mono uppercase tracking-wider">
                    DNA Tag: trk_s2_mutant_881z<br/>
                    Royalties automatically routed via Barrio Vault (0xABC...991).
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
