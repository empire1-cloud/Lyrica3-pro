import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, ExternalLink, AlertTriangle, CheckCircle, Radio, Copy, Check } from 'lucide-react';
import { cn } from '../../../components/ui/utils';
import type { StationPreset, UserStation } from '../config/externalStations';
import { exportSlFormat } from '../config/externalStations';
import { validateStreamUrl } from '../engines/StreamResolverEngine';

type Station = StationPreset | (UserStation & { needsVerifiedStreamUrl?: boolean; sourceType?: string; homepage?: string });

interface ExternalStationCardProps {
  station: Station;
  isPlaying: boolean;
  onPlay: (station: Station) => void;
  onStop: () => void;
  onStreamUrlUpdate?: (id: string, url: string) => void;
  showExport?: boolean;
}

export function ExternalStationCard({ station, isPlaying, onPlay, onStop, onStreamUrlUpdate, showExport }: ExternalStationCardProps) {
  const [testingUrl, setTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(station.streamUrl || "");

  const hasStreamUrl = station.streamUrl && station.streamUrl.length > 0;
  const needsUrl = "needsVerifiedStreamUrl" in station && station.needsVerifiedStreamUrl;

  const handleTestUrl = async () => {
    if (!urlInput.trim()) return;
    setTestingUrl(true);
    setTestResult(null);
    const result = await validateStreamUrl(urlInput);
    setTestResult({ valid: result.valid, error: result.error });
    setTestingUrl(false);
  };

  const handleSaveUrl = () => {
    if (onStreamUrlUpdate && urlInput.trim()) {
      onStreamUrlUpdate((station as any).id, urlInput.trim());
    }
    setEditingUrl(false);
  };

  const handleCopyExport = () => {
    const url = station.streamUrl || urlInput;
    if (url) {
      navigator.clipboard.writeText(exportSlFormat(station.name, url));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const genreTags = station.genre || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative p-5 rounded-2xl border transition-all duration-300",
        isPlaying
          ? "bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10 border-fuchsia-500/30 shadow-[0_0_30px_rgba(255,165,0,0.1)]"
          : "bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20"
      )}
    >
      {/* Playing indicator */}
      {isPlaying && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ height: [4, 12, 4] }}
                transition={{ duration: 0.6 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
                className="w-0.5 bg-fuchsia-500 rounded-full"
              />
            ))}
          </div>
          <span className="text-[8px] font-mono text-fuchsia-500 uppercase tracking-widest">Live</span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold tracking-tight">{station.name}</h3>
          {station.homepage && (
            <a
              href={station.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[8px] font-mono text-white/30 hover:text-white/60 transition-colors mt-0.5"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              Station info
            </a>
          )}
        </div>

        <button
          onClick={hasStreamUrl ? (isPlaying ? onStop : () => onPlay(station)) : undefined}
          disabled={!hasStreamUrl}
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center transition-all",
            isPlaying
              ? "bg-fuchsia-500 text-black shadow-lg shadow-fuchsia-500/30"
              : hasStreamUrl
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-white/5 text-white/20 cursor-not-allowed"
          )}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
      </div>

      {/* Genre tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {genreTags.map(g => (
          <span key={g} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-mono uppercase tracking-wider text-white/40">
            {g}
          </span>
        ))}
        {"sourceType" in station && station.sourceType && (
          <span className={cn(
            "px-2 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider",
            station.sourceType === "lyrica_generated" ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400" :
            station.sourceType === "ai_dj_room" ? "bg-purple-500/10 border border-purple-500/20 text-purple-400" :
            "bg-blue-500/10 border border-blue-500/20 text-blue-400"
          )}>
            {station.sourceType === "lyrica_generated" ? "Lyrica" :
             station.sourceType === "ai_dj_room" ? "AI DJ" :
             "External Stream"}
          </span>
        )}
      </div>

      {/* Stream URL section */}
      {needsUrl && !hasStreamUrl && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-1.5 text-[8px] font-mono text-yellow-400/80">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>Requires verified stream URL</span>
          </div>

          {editingUrl ? (
            <div className="space-y-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste raw audio stream URL..."
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-mono focus:outline-none focus:border-fuchsia-500/50 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleTestUrl}
                  disabled={testingUrl}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-mono hover:bg-white/10 transition-colors flex items-center gap-1"
                >
                  {testingUrl ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Radio className="w-3 h-3" />
                  )}
                  Test
                </button>
                <button
                  onClick={handleSaveUrl}
                  disabled={!urlInput.trim()}
                  className="px-3 py-1.5 bg-fuchsia-500/20 border border-fuchsia-500/30 rounded-lg text-[8px] font-mono text-fuchsia-500 hover:bg-fuchsia-500/30 transition-colors"
                >
                  Save URL
                </button>
                <button
                  onClick={() => { setEditingUrl(false); setUrlInput(station.streamUrl || ""); }}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-mono hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {testResult && (
                <div className={cn(
                  "flex items-center gap-1.5 text-[8px] font-mono",
                  testResult.valid ? "text-green-400" : "text-red-400"
                )}>
                  {testResult.valid ? (
                    <><CheckCircle className="w-2.5 h-2.5" /> Stream URL responds</>
                  ) : (
                    <><AlertTriangle className="w-2.5 h-2.5" /> {testResult.error || "URL not playable"}</>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setEditingUrl(true)}
              className="text-[8px] font-mono text-white/30 hover:text-white/60 transition-colors underline underline-offset-2"
            >
              + Add stream URL
            </button>
          )}
        </div>
      )}

      {/* Show current stream URL if set */}
      {hasStreamUrl && (
        <div className="text-[7px] font-mono text-white/20 truncate mb-2">
          {station.streamUrl}
        </div>
      )}

      {/* Notes */}
      {"notes" in station && station.notes && (
        <p className="text-[8px] font-mono text-white/20 leading-relaxed">{station.notes}</p>
      )}

      {/* SL Export */}
      {showExport && hasStreamUrl && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-mono text-white/20 uppercase tracking-wider">SL Export</span>
            <button
              onClick={handleCopyExport}
              className="flex items-center gap-1 text-[8px] font-mono text-white/30 hover:text-white/60 transition-colors"
            >
              {copied ? (
                <><Check className="w-2.5 h-2.5 text-green-400" /> Copied</>
              ) : (
                <><Copy className="w-2.5 h-2.5" /> Copy</>
              )}
            </button>
          </div>
          <code className="block mt-1 p-2 bg-black/50 border border-white/5 rounded text-[7px] font-mono text-white/20 break-all">
            {exportSlFormat(station.name, station.streamUrl)}
          </code>
        </div>
      )}
    </motion.div>
  );
}
