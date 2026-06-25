import React from 'react';
import { Layers, RefreshCw, DollarSign, ArrowUpRight, Music } from 'lucide-react';

interface RemixRecord {
  id: string;
  originalTrackId: string;
  originalTrackTitle: string;
  remixVibe: string;
  remixAuthorName: string;
  originalCreatorId: string;
  originalCreatorName: string;
  amount: number;
  timestamp: string;
}

interface RemixFeedPanelProps {
  remixFeed: RemixRecord[];
  loading: boolean;
  onRefresh: () => void;
}

export const RemixFeedPanel: React.FC<RemixFeedPanelProps> = ({
  remixFeed,
  loading,
  onRefresh,
}) => {
  // Sum up total royalties recorded on this client feed
  const totalRoyalties = remixFeed.reduce((sum, item) => sum + item.amount, 0);

  const formatTimestamp = (timeString: string) => {
    try {
      const date = new Date(timeString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6 backdrop-blur-xl relative overflow-hidden">
      {/* Background Glow Decors */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/5 rounded-full blur-[40px] pointer-events-none" />

      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-green-500/20 bg-green-500/5 rounded-xl text-green-500">
            <Layers className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-white">Social Stem Remix Feed</h4>
            <span className="text-[10px] font-mono text-white/40 block">Live micro-royalties assigned to your originals</span>
          </div>
        </div>

        {/* Refresh spinner button */}
        <button
          onClick={onRefresh}
          className="p-2 bg-white/5 border border-white/10 hover:border-white/20 text-white/50 hover:text-white rounded-lg transition-all cursor-pointer"
          title="Refresh Royalties Ledger"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-green-500' : ''}`} />
        </button>
      </div>

      {/* Royalty Total Indicator Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/20 to-teal-900/10 border border-emerald-500/20 flex items-center justify-between shadow-[0_4px_15px_rgba(16,185,129,0.05)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold tracking-widest uppercase text-white/40 block">Earned Royalties</span>
            <span className="text-lg font-mono font-bold text-white block">${totalRoyalties.toFixed(2)} USD</span>
          </div>
        </div>
        <div className="bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 text-[8px] font-mono font-bold text-emerald-400 flex items-center gap-1">
          <ArrowUpRight className="w-3 h-3" />
          <span>MICRO-LEDGER SYNCED</span>
        </div>
      </div>

      {/* Remix Ledger List */}
      <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
        {remixFeed.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
            <Music className="w-5 h-5 text-white/20 mx-auto mb-2 animate-bounce" />
            <p className="text-[10px] font-mono text-white/30">No flips or remix activity tracked yet.</p>
            <p className="text-[8px] text-white/20 mt-1 uppercase tracking-widest">Flip songs in your library to allocate royalties!</p>
          </div>
        ) : (
          remixFeed.map((record) => (
            <div
              key={record.id}
              className="p-3.5 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 flex-shrink-0">
                  <Music className="w-4 h-4 text-pink-500" />
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-white truncate max-w-[120px]">{record.originalTrackTitle}</span>
                    <span className="text-[8px] font-bold tracking-wider uppercase text-pink-400 bg-pink-500/10 px-1 py-0.5 rounded border border-pink-500/10">
                      Flapped
                    </span>
                  </div>
                  <p className="text-[10px] font-sans text-white/50 truncate max-w-[200px]">
                    By <span className="text-white/80 font-medium">{record.remixAuthorName}</span>: <span className="text-green-400/90 italic">"{record.remixVibe}"</span>
                  </p>
                </div>
              </div>

              {/* Royalty value and timestamp */}
              <div className="text-right flex-shrink-0 ml-2">
                <span className="text-xs font-mono font-bold text-emerald-400 block">
                  +${record.amount.toFixed(2)}
                </span>
                <span className="text-[8px] font-mono text-white/30 block capitalize">
                  {formatTimestamp(record.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
