import React from 'react';
import { motion } from 'motion/react';
import { Radio, Music, Flame } from 'lucide-react';
import { cn } from '../../../components/ui/utils';
import { STATION_PACKS, type StationPack } from '../config/stationPacks';
import { DJ_PERSONAS, type DjPersona } from '../config/djPersonas';

interface StationSelectorProps {
  selectedStationId?: string;
  onSelect: (station: StationPack) => void;
}

export function StationSelector({ selectedStationId, onSelect }: StationSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {STATION_PACKS.map((station) => {
        const dj = DJ_PERSONAS.find(d => d.id === station.djId);
        const isSelected = selectedStationId === station.id;

        return (
          <motion.button
            key={station.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(station)}
            className={cn(
              "relative p-3 rounded-xl border text-left transition-all duration-200",
              isSelected
                ? `bg-gradient-to-br ${station.color}/20 border-${station.color.split(" ")[0].replace("from-", "")}/30 shadow-lg`
                : "bg-white/[0.04] border-white/10 hover:bg-white/[0.07] hover:border-white/20"
            )}
          >
            {/* Playing indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-0.5">
                {[1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={{ height: [4, 10 + i * 3, 4] }}
                    transition={{ duration: 0.5 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
                    className={cn(
                      "w-0.5 rounded-full",
                      station.color.split(" ")[0].replace("from-", "bg-")
                    )}
                  />
                ))}
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shrink-0",
                station.color
              )}>
                <Radio className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold tracking-tight">{station.name}</h3>
                <p className="text-[8px] font-mono text-white/30 mt-0.5 line-clamp-1">
                  {station.description}
                </p>
                {dj && (
                  <p className="text-[9px] font-bold text-white/40 mt-1 flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5" />
                    {dj.name}
                  </p>
                )}
              </div>
            </div>

            {/* Genre tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {station.genre.slice(0, 3).map(g => (
                <span key={g} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[6px] font-mono uppercase tracking-wider text-white/30">
                  {g}
                </span>
              ))}
              {station.genre.length > 3 && (
                <span className="text-[6px] font-mono text-white/20">+{station.genre.length - 3}</span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
