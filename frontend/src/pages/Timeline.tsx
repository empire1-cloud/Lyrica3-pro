import React, { useState } from 'react';
import { Play, Square, Repeat, Download, Scissors, Copy, MoreVertical } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ExportModal } from '../components/ui/ExportModal';
import { motion } from 'motion/react';
import { cn } from '../components/ui/Button';

const TRACKS = [
  { id: 1, name: "Vocals (Main)", color: "cyan" },
  { id: 2, name: "Synth Lead", color: "magenta" },
  { id: 3, name: "808 Bass", color: "purple" },
  { id: 4, name: "Drum Break", color: "cyan" },
];

const CLIPS = [
  { trackId: 1, start: 10, width: 30, label: "Verse 1" },
  { trackId: 1, start: 45, width: 20, label: "Chorus" },
  { trackId: 2, start: 0, width: 80, label: "Arp Loop" },
  { trackId: 3, start: 10, width: 55, label: "Sub Pattern A" },
  { trackId: 4, start: 10, width: 70, label: "Breakbeat" },
];

export function Timeline() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPos, setPlayheadPos] = useState(15);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlayheadPos(p => (p >= 100 ? 0 : p + 0.5));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="h-full flex flex-col p-6 md:p-10 max-w-[1600px] mx-auto overflow-hidden min-h-screen">
      
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-['Sedgwick_Ave_Display'] flex items-center gap-3">
            L.A. NightDrive <span className="text-sm font-sans font-medium px-2 py-1 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">120 BPM</span>
          </h1>
        </div>
        
        {/* Transport Controls */}
        <div className="flex items-center gap-2 bg-zinc-900/80 p-2 rounded-2xl border border-zinc-800 backdrop-blur-md">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <Repeat className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" onClick={() => setIsPlaying(false)}>
            <Square className="w-5 h-5" />
          </Button>
          <Button 
            variant="primary" 
            glowColor="magenta" 
            size="icon" 
            className="w-12 h-12 rounded-full mx-2"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
          </Button>
          <div className="w-px h-8 bg-zinc-800 mx-2" />
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <Scissors className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <Copy className="w-5 h-5" />
          </Button>
          <div className="w-px h-8 bg-zinc-800 mx-2" />
          <Button variant="secondary" className="gap-2" onClick={() => setIsExportModalOpen(true)}>
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {/* Timeline Area */}
      <Card className="flex-1 flex flex-col p-0 overflow-hidden bg-zinc-950 border-zinc-800">
        
        {/* Time Ruler */}
        <div className="h-8 border-b border-zinc-800 flex items-center relative pl-48 bg-zinc-900/50">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1 border-l border-zinc-800 h-full flex items-end pb-1 pl-1 text-[10px] text-zinc-600">
              0:0{i * 5}
            </div>
          ))}
          
          {/* Playhead Handle */}
          <motion.div 
            className="absolute top-0 bottom-0 w-3 -ml-1.5 cursor-ew-resize z-20 group"
            style={{ left: `calc(12rem + ${playheadPos}%)` }}
          >
            <div className="w-full h-full bg-cyan-500 opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-cyan-500" />
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]" />
          </motion.div>
        </div>

        {/* Tracks Area */}
        <div className="flex-1 overflow-auto relative">
          
          {/* Playhead Line down through tracks */}
          <motion.div 
            className="absolute top-0 bottom-0 w-[1px] bg-cyan-500/50 z-10 shadow-[0_0_10px_rgba(6,182,212,0.8)] pointer-events-none"
            style={{ left: `calc(12rem + ${playheadPos}%)` }}
          />

          {TRACKS.map((track) => (
            <div key={track.id} className="flex h-24 border-b border-zinc-800/50 group">
              
              {/* Track Header */}
              <div className="w-48 bg-zinc-900/80 border-r border-zinc-800 flex items-center px-4 sticky left-0 z-20 shrink-0">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-zinc-200">{track.name}</h4>
                  <div className="flex gap-2 mt-2">
                    <button className="w-6 h-6 rounded bg-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-700">M</button>
                    <button className="w-6 h-6 rounded bg-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-700">S</button>
                  </div>
                </div>
                <button className="text-zinc-600 hover:text-zinc-300">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              {/* Track Lane */}
              <div className="flex-1 relative bg-zinc-950/50 group-hover:bg-zinc-900/20 transition-colors">
                {/* Grid lines */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="absolute top-0 bottom-0 border-l border-zinc-800/30" style={{ left: `${i * 5}%` }} />
                ))}

                {/* Clips */}
                {CLIPS.filter(c => c.trackId === track.id).map((clip, i) => {
                  const colorMap = {
                    cyan: 'bg-cyan-500/20 border-cyan-500 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
                    magenta: 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-200 shadow-[0_0_15px_rgba(217,70,239,0.2)]',
                    purple: 'bg-purple-500/20 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
                  };
                  const colorClass = colorMap[track.color as keyof typeof colorMap];

                  return (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.01, zIndex: 10 }}
                      className={cn(
                        "absolute top-2 bottom-2 rounded-md border backdrop-blur-sm cursor-grab active:cursor-grabbing p-2 flex flex-col justify-between overflow-hidden group/clip",
                        colorClass
                      )}
                      style={{ left: `${clip.start}%`, width: `${clip.width}%` }}
                    >
                      <span className="text-xs font-medium truncate">{clip.label}</span>
                      
                      {/* Fake waveform in clip */}
                      <div className="flex items-center gap-[1px] h-6 opacity-60">
                         {Array.from({ length: Math.floor(clip.width) }).map((_, j) => (
                           <div 
                            key={j} 
                            className="flex-1 bg-current rounded-full" 
                            style={{ height: `${20 + Math.random() * 80}%` }} 
                           />
                         ))}
                      </div>

                      {/* Handles */}
                      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 hover:bg-white/20" />
                      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover/clip:opacity-100 hover:bg-white/20" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Filler area */}
          <div className="h-full bg-zinc-950/50" />
        </div>
      </Card>

      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </div>
  );
}
