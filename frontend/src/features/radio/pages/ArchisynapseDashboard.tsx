import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, Activity, Music, Users, Clock, DollarSign, TrendingUp, Mic2 } from 'lucide-react';
import { cn } from '../../../components/ui/utils';
import { getRoyaltyEvents, generateEventSummary, type RoyaltyEvent } from '../engines/RoyaltyEventEngine';

const EVENT_ICONS: Record<string, React.ElementType> = {
  track_played: Music,
  transition_performed: Activity,
  listener_input_submitted: Users,
  remix_seed_created: TrendingUp,
  user_lyrics_used: Mic2,
  royalty_event_pending: DollarSign,
  creator_spotlight: TrendingUp,
  dj_action: Mic2,
};

const EVENT_COLORS: Record<string, string> = {
  track_played: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  transition_performed: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  listener_input_submitted: "text-pink-400 bg-pink-500/10 border-pink-500/20",
  remix_seed_created: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
  user_lyrics_used: "text-green-400 bg-green-500/10 border-green-500/20",
  royalty_event_pending: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
  creator_spotlight: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
  dj_action: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

export function ArchisynapseDashboard() {
  const [events, setEvents] = useState<RoyaltyEvent[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setEvents(getRoyaltyEvents());
  }, [refreshKey]);

  const filtered = filter === "all"
    ? events
    : events.filter(e => e.type === filter);

  const eventTypes = Array.from(new Set(events.map(e => e.type)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Archisynapse Ledger</h2>
            <p className="text-[10px] font-mono text-white/30">Royalty & event log</p>
          </div>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-mono hover:bg-white/10 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Session Summary</p>
        <p className="text-xs text-white/60 mt-1">{generateEventSummary()}</p>
        <div className="flex items-center gap-4 mt-3 text-[8px] font-mono text-white/20">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {events.length} events</span>
          <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {eventTypes.length} types</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-2.5 py-1 rounded text-[8px] font-mono uppercase tracking-wider border transition-all",
            filter === "all"
              ? "bg-white/10 border-white/20 text-white"
              : "bg-white/5 border-white/10 text-white/40 hover:text-white"
          )}
        >
          All
        </button>
        {eventTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={cn(
              "px-2.5 py-1 rounded text-[8px] font-mono uppercase tracking-wider border transition-all",
              filter === type
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            )}
          >
            {type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Event Feed */}
      <div className="space-y-1.5 max-h-[600px] overflow-y-auto custom-scrollbar">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/20">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-[10px] font-mono uppercase tracking-widest">No events yet</p>
            <p className="text-[8px] font-mono text-white/10 mt-1">Events appear when you use the Party DJ room</p>
          </div>
        )}
        {filtered.map(event => {
          const Icon = EVENT_ICONS[event.type] || Activity;
          const colors = EVENT_COLORS[event.type] || "text-white/40 bg-white/5 border-white/10";
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn("flex items-start gap-3 p-3 rounded-xl border", colors.replace("text-", "border-").split(" ")[0])}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", colors)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-white/80">{event.description}</p>
                <div className="flex items-center gap-2 mt-1 text-[8px] font-mono text-white/20">
                  <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                  {event.stationId && <span>• {event.stationId}</span>}
                  <span>• {event.status}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}
