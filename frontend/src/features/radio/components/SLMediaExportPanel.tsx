import React, { useState } from 'react';
import { Copy, Check, Download, ExternalLink, Radio } from 'lucide-react';
import { cn } from '../../../components/ui/utils';
import { exportSlFormat, type StationPreset, type UserStation } from '../config/externalStations';

type Station = StationPreset | (UserStation & { needsVerifiedStreamUrl?: boolean; sourceType?: string });

interface SLMediaExportPanelProps {
  stations: Station[];
  onClose?: () => void;
}

export function SLMediaExportPanel({ stations, onClose }: SLMediaExportPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const playable = stations.filter(s => s.streamUrl && s.streamUrl.length > 0);

  const handleCopy = async (name: string, url: string, id: string) => {
    await navigator.clipboard.writeText(exportSlFormat(name, url));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateParcelUrls = () => {
    const lines = playable.map(s => {
      const encodedUrl = encodeURIComponent(s.streamUrl);
      const encodedName = encodeURIComponent(s.name);
      return `secondlife:///app/parcel/media/url/${encodedUrl}/name/${encodedName}`;
    });
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedId("all");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadFile = () => {
    const lines = playable.map(s => exportSlFormat(s.name, s.streamUrl));
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sl_universal_stations.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (playable.length === 0) {
    return (
      <div className="p-6 text-center">
        <Radio className="w-8 h-8 mx-auto mb-2 text-white/20" />
        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
          No playable stations yet
        </p>
        <p className="text-[8px] font-mono text-white/20 mt-1">
          Add stream URLs to stations to enable export
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">SL Media Export</h3>
        <div className="flex gap-2">
          <button
            onClick={generateParcelUrls}
            className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-mono hover:bg-white/10 transition-colors flex items-center gap-1"
          >
            {copiedId === "all" ? (
              <><Check className="w-2.5 h-2.5 text-green-400" /> Copied All</>
            ) : (
              <><Copy className="w-2.5 h-2.5" /> Copy Parcel URLs</>
            )}
          </button>
          <button
            onClick={downloadFile}
            className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-mono hover:bg-white/10 transition-colors flex items-center gap-1"
          >
            <Download className="w-2.5 h-2.5" /> .txt
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {playable.map((station) => {
          const id = (station as any).id || station.name;
          return (
            <div key={id} className="p-3 bg-black/40 border border-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold">{station.name}</span>
                <button
                  onClick={() => handleCopy(station.name, station.streamUrl, id)}
                  className="flex items-center gap-1 text-[8px] font-mono text-white/30 hover:text-white/60 transition-colors"
                >
                  {copiedId === id ? (
                    <><Check className="w-2.5 h-2.5 text-green-400" /> Copied</>
                  ) : (
                    <><Copy className="w-2.5 h-2.5" /> Copy</>
                  )}
                </button>
              </div>
              <code className="block text-[7px] font-mono text-white/20 break-all bg-black/30 p-1.5 rounded">
                {exportSlFormat(station.name, station.streamUrl)}
              </code>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
        <p className="text-[8px] font-mono text-blue-400/60">
          <strong className="uppercase">SL Parcel Usage:</strong> Copy a line above, then paste it into your parcel's media URL field, or use a script to set {`llSetParcelMusicURL`}.
        </p>
      </div>
    </div>
  );
}
