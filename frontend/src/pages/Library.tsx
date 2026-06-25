import React from 'react';
import { Search, Filter, Play, Heart, Download } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { motion } from 'motion/react';
import { cn } from '../components/ui/Button';

const CATEGORIES = ["All", "Cinematic", "Hip-Hop", "Synthwave", "Corridos", "Lo-Fi", "Electronic"];
const PRESETS = [
  { id: 1, name: "Neon Tears", genre: "Synthwave", vibe: "Melancholic", color: "magenta", likes: "1.2k" },
  { id: 2, name: "Grit & Glory", genre: "Hip-Hop", vibe: "Aggressive", color: "cyan", likes: "856" },
  { id: 3, name: "Desert Winds", genre: "Cinematic", vibe: "Epic", color: "purple", likes: "2.4k" },
  { id: 4, name: "Midnight Cruise", genre: "Synthwave", vibe: "Chill", color: "cyan", likes: "3.1k" },
  { id: 5, name: "Barrio Bounce", genre: "Hip-Hop", vibe: "Upbeat", color: "purple", likes: "942" },
  { id: 6, name: "Cyber Samurai", genre: "Electronic", vibe: "Intense", color: "magenta", likes: "1.8k" },
  { id: 7, name: "Rainy Cafe", genre: "Lo-Fi", vibe: "Cozy", color: "cyan", likes: "4.2k" },
  { id: 8, name: "Trompetas del Alma", genre: "Corridos", vibe: "Emotional", color: "purple", likes: "1.5k" },
];

export function Library() {
  const [activeCategory, setActiveCategory] = React.useState("All");

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto space-y-8">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-['Sedgwick_Ave_Display'] mb-2 text-fuchsia-400">
            Soulfire Vault
          </h1>
          <p className="text-zinc-400 font-medium text-sm">Browse creator assets, provenance, and ready-to-distribute sessions.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="w-full h-10 pl-10 pr-4 rounded-full bg-zinc-900 border border-zinc-800 text-sm focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all placeholder:text-zinc-600"
            />
          </div>
          <Button variant="secondary" className="gap-2 shrink-0">
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 gap-2 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <Chip 
            key={cat} 
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className="whitespace-nowrap"
          >
            {cat}
          </Chip>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {PRESETS.filter(p => activeCategory === 'All' || p.genre === activeCategory).map((preset, i) => {
          const colorMap = {
            cyan: 'from-cyan-500/20 to-zinc-900 group-hover:border-cyan-500/50',
            magenta: 'from-fuchsia-500/20 to-zinc-900 group-hover:border-fuchsia-500/50',
            purple: 'from-purple-500/20 to-zinc-900 group-hover:border-purple-500/50',
          };
          
          return (
            <motion.div
              key={preset.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={cn(
                "group cursor-pointer overflow-hidden p-0 h-full flex flex-col transition-all duration-300 bg-gradient-to-br border-zinc-800/80 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]",
                colorMap[preset.color as keyof typeof colorMap]
              )}>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                      <Play className={cn(
                        "w-5 h-5 ml-1",
                        preset.color === 'cyan' && "text-cyan-400",
                        preset.color === 'magenta' && "text-fuchsia-400",
                        preset.color === 'purple' && "text-purple-400"
                      )} />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-['Sedgwick_Ave_Display'] text-2xl text-white mb-2">{preset.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded bg-zinc-950/50 text-zinc-300 border border-zinc-800/50">
                        {preset.genre}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded bg-zinc-950/50 text-zinc-300 border border-zinc-800/50">
                        {preset.vibe}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-12 border-t border-zinc-800/50 bg-zinc-950/50 flex items-center justify-between px-6 backdrop-blur-md">
                  <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium">
                    <Heart className="w-3 h-3" /> {preset.likes}
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 hover:text-white">
                    Open <Download className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
