import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Radio, Plus, X, Music, Globe, Download, Copy, Check, Users, Headphones } from 'lucide-react';
import { cn } from '../../../components/ui/utils';
import { getPresets, getUserStations, saveUserStation, removeUserStation, type StationPreset, type UserStation } from '../config/externalStations';
import { ExternalStationCard } from '../components/ExternalStationCard';
import { SLMediaExportPanel } from '../components/SLMediaExportPanel';

type Station = StationPreset | (UserStation & { needsVerifiedStreamUrl?: boolean; sourceType?: string; homepage?: string });

interface RadioDirectoryPageProps {
  onPlayStation: (station: Station) => void;
  onStopStation: () => void;
  currentPlayingId?: string;
}

export function RadioDirectoryPage({ onPlayStation, onStopStation, currentPlayingId }: RadioDirectoryPageProps) {
  const [presets] = useState<StationPreset[]>(getPresets);
  const [userStations, setUserStations] = useState<UserStation[]>(getUserStations);
  const [showAddStation, setShowAddStation] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [newStation, setNewStation] = useState({ name: "", streamUrl: "", genre: "", provider: "" });

  const handlePlay = (station: Station) => {
    onPlayStation(station);
  };

  const handleStop = () => {
    onStopStation();
  };

  const handleAddStation = () => {
    if (!newStation.name.trim() || !newStation.streamUrl.trim()) return;
    const station: UserStation = {
      id: `user_${Date.now()}`,
      name: newStation.name.trim(),
      genre: newStation.genre.split(",").map(g => g.trim()).filter(Boolean),
      streamUrl: newStation.streamUrl.trim(),
      provider: newStation.provider.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    saveUserStation(station);
    setUserStations(getUserStations());
    setNewStation({ name: "", streamUrl: "", genre: "", provider: "" });
    setShowAddStation(false);
  };

  const handleRemoveStation = (id: string) => {
    removeUserStation(id);
    setUserStations(getUserStations());
  };

  const handleStreamUrlUpdate = (id: string, url: string) => {
    const preset = presets.find(p => p.id === id);
    if (preset) {
      preset.streamUrl = url;
      preset.enabled = true;
      preset.needsVerifiedStreamUrl = false;
      setUserStations([...userStations]);
    }
  };

  const allStations: Station[] = [...presets, ...userStations];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase">Station Directory</h2>
          <p className="text-[10px] font-mono text-white/30 mt-1">
            Real radio streams, Lyrica stations, and virtual world media
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportPanel(!showExportPanel)}
            className={cn(
              "px-3 py-2 rounded-xl text-[9px] font-bold tracking-widest uppercase border transition-all flex items-center gap-1.5",
              showExportPanel
                ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-500"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
            )}
          >
            <Download className="w-3 h-3" />
            SL Export
          </button>
          <button
            onClick={() => setShowAddStation(true)}
            className="px-3 py-2 bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-xl text-[9px] font-bold tracking-widest uppercase text-fuchsia-500 hover:bg-fuchsia-500/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            Add Station
          </button>
        </div>
      </div>

      {/* SL Export Panel */}
      <AnimatePresence>
        {showExportPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-2xl overflow-hidden">
              <SLMediaExportPanel stations={allStations} onClose={() => setShowExportPanel(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Station Modal */}
      <AnimatePresence>
        {showAddStation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-5 bg-[#0d0d0d] border border-white/10 rounded-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-widest uppercase text-white/60">Add External Station</h3>
              <button onClick={() => setShowAddStation(false)} className="text-white/30 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <label className="text-[8px] font-mono text-white/30 uppercase tracking-wider">Station Name</label>
                <input
                  type="text"
                  value={newStation.name}
                  onChange={(e) => setNewStation(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Kandy and Chrome Radio"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-[8px] font-mono text-white/30 uppercase tracking-wider">Raw Audio Stream URL</label>
                <input
                  type="text"
                  value={newStation.streamUrl}
                  onChange={(e) => setNewStation(prev => ({ ...prev, streamUrl: e.target.value }))}
                  placeholder="https://stream.example.com:8000/stream"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-mono text-white/30 uppercase tracking-wider">Genre (comma-separated)</label>
                <input
                  type="text"
                  value={newStation.genre}
                  onChange={(e) => setNewStation(prev => ({ ...prev, genre: e.target.value }))}
                  placeholder="Oldies, Soul, Funk"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[8px] font-mono text-white/30 uppercase tracking-wider">Provider</label>
                <input
                  type="text"
                  value={newStation.provider}
                  onChange={(e) => setNewStation(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="Zeno/FM, Shoutcast, etc."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddStation}
                disabled={!newStation.name.trim() || !newStation.streamUrl.trim()}
                className="px-4 py-2 bg-fuchsia-500 text-black rounded-xl text-[9px] font-bold tracking-widest uppercase hover:bg-fuchsia-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Add Station
              </button>
              <button
                onClick={() => setShowAddStation(false)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-bold tracking-widest uppercase hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allStations.map((station) => {
          const id = (station as any).id || station.name;
          return (
            <ExternalStationCard
              key={id}
              station={station}
              isPlaying={currentPlayingId === id}
              onPlay={handlePlay}
              onStop={handleStop}
              onStreamUrlUpdate={handleStreamUrlUpdate}
              showExport
            />
          );
        })}
      </div>

      {/* Empty state */}
      {allStations.length === 0 && (
        <div className="text-center py-24">
          <Radio className="w-12 h-12 mx-auto mb-4 text-white/10" />
          <h3 className="text-lg font-bold text-white/40">No Stations Yet</h3>
          <p className="text-[10px] font-mono text-white/20 mt-2">
            Add a station or enable presets to start listening
          </p>
        </div>
      )}
    </div>
  );
}
