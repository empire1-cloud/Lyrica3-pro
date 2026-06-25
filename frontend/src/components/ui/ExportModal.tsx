import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, HardDrive, Music, Settings2 } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-50 p-4"
          >
            <Card className="bg-zinc-950 border-zinc-800 shadow-2xl shadow-cyan-900/20 p-0 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Download className="w-5 h-5 text-cyan-400" /> Export Project
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">L.A. NightDrive - 2:45</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-6 bg-zinc-900/30">
                
                {/* Format Options */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 block">Format</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-cyan-500 bg-cyan-500/10 text-cyan-400">
                      <Music className="w-6 h-6" />
                      <span className="text-xs font-bold">WAV</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300">
                      <Music className="w-6 h-6" />
                      <span className="text-xs font-bold">MP3</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300">
                      <HardDrive className="w-6 h-6" />
                      <span className="text-xs font-bold">STEMS</span>
                    </button>
                  </div>
                </div>

                {/* Quality Settings */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Quality Settings
                  </label>
                  <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-cyan-500 text-zinc-200">
                    <option>24-bit / 48kHz (Studio Quality)</option>
                    <option>16-bit / 44.1kHz (CD Quality)</option>
                    <option>32-bit Float</option>
                  </select>
                </div>

                {/* Metadata */}
                <div>
                   <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3 block">Metadata</label>
                   <div className="space-y-3">
                     <input type="text" placeholder="Track Title" defaultValue="L.A. NightDrive" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-cyan-500" />
                     <input type="text" placeholder="Artist" defaultValue="Lyrica 3 Engine" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-cyan-500" />
                   </div>
                </div>

              </div>

              <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button variant="primary" glowColor="cyan" className="flex-1">Export Now</Button>
              </div>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
