import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Music, 
  Mic2, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Clock,
  Tag,
  History,
  Zap,
  Waves
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudioStore } from '../store/useStudioStore';
import { MusicAsset, VocalAsset, SfxAsset, AmbientAsset } from '../types';
import * as Tone from 'tone';

const AssetBrowser: React.FC = () => {
  const { musicAssets, vocalAssets, sfxAssets, ambientAssets } = useStudioStore();
  const [filter, setFilter] = useState<'all' | 'music' | 'vocal' | 'sfx' | 'ambient'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const playerRef = React.useRef<Tone.Player | null>(null);

  const allAssets = [
    ...musicAssets.map(a => ({ ...a, category: 'music' as const })),
    ...vocalAssets.map(a => ({ ...a, category: 'vocal' as const })),
    ...sfxAssets.map(a => ({ ...a, category: 'sfx' as const })),
    ...ambientAssets.map(a => ({ ...a, category: 'ambient' as const }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filteredAssets = allAssets.filter(asset => {
    const matchesFilter = filter === 'all' || asset.category === filter;
    let searchString = '';
    if (asset.category === 'music') searchString = (asset as MusicAsset).meta.genre;
    else if (asset.category === 'vocal') searchString = (asset as VocalAsset).meta.emotionProfile;
    else if (asset.category === 'sfx') searchString = (asset as SfxAsset).meta.material + ' ' + (asset as SfxAsset).meta.environment;
    else if (asset.category === 'ambient') searchString = (asset as AmbientAsset).meta.elements;
    
    const matchesSearch = searchString.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handlePlay = async (asset: any) => {
    if (isPlaying === asset.id) {
      playerRef.current?.stop();
      setIsPlaying(null);
      return;
    }

    await Tone.start();
    playerRef.current?.stop();
    playerRef.current?.dispose();

    let url = '';
    if (asset.category === 'music') url = (asset as MusicAsset).urls.fullMix || '';
    else if (asset.category === 'vocal') url = (asset as VocalAsset).urls.processed || (asset as VocalAsset).urls.dry || '';
    else if (asset.category === 'sfx') url = (asset as SfxAsset).urls.main || '';
    else if (asset.category === 'ambient') url = (asset as AmbientAsset).urls.main || '';

    if (url) {
      const player = new Tone.Player(url).toDestination();
      playerRef.current = player;
      player.start();
      setIsPlaying(asset.id);
      player.onstop = () => setIsPlaying(null);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Asset Library</h1>
          <p className="text-xs text-white/40 uppercase tracking-widest">Project History & Stems</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:border-accent outline-none transition-all w-64"
            />
          </div>
          
          <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1">
            {(['all', 'music', 'vocal', 'sfx', 'ambient'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  filter === f ? "bg-accent text-black" : "text-white/40 hover:text-white"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAssets.map((asset) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={asset.id}
              className="group bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all flex items-center gap-6"
            >
              <div 
                onClick={() => handlePlay(asset)}
                className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-all cursor-pointer shadow-lg shadow-black/20"
              >
                {isPlaying === asset.id ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
              </div>

              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {asset.category === 'music' && <Music size={14} className="text-accent" />}
                    {asset.category === 'vocal' && <Mic2 size={14} className="text-accent" />}
                    {asset.category === 'sfx' && <Zap size={14} className="text-accent" />}
                    {asset.category === 'ambient' && <Waves size={14} className="text-accent" />}
                    <h3 className="text-sm font-bold truncate">
                      {asset.category === 'music' && (asset as MusicAsset).meta.genre}
                      {asset.category === 'vocal' && (asset as VocalAsset).meta.emotionProfile}
                      {asset.category === 'sfx' && `${(asset as SfxAsset).meta.material} - ${(asset as SfxAsset).meta.environment}`}
                      {asset.category === 'ambient' && (asset as AmbientAsset).meta.elements}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-white/40 uppercase tracking-widest font-mono">
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(asset.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Tag size={10} /> {asset.category}</span>
                  </div>
                </div>

                <div className="hidden md:flex flex-col gap-1">
                  <span className="text-[10px] text-white/20 uppercase font-mono tracking-widest">Metadata</span>
                  <div className="text-[10px] font-bold text-white/60 truncate">
                    {asset.category === 'music' && `${(asset as MusicAsset).meta.bpm} BPM // ${(asset as MusicAsset).meta.key}`}
                    {asset.category === 'vocal' && `${(asset as VocalAsset).meta.language} // ${(asset as VocalAsset).type}`}
                    {asset.category === 'sfx' && `${(asset as SfxAsset).meta.mass} // ${(asset as SfxAsset).meta.frequency}`}
                    {asset.category === 'ambient' && `${(asset as AmbientAsset).meta.duration}s // Loopable: ${(asset as AmbientAsset).meta.loopable}`}
                  </div>
                </div>

                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all">
                    <Download size={18} />
                  </button>
                  <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:bg-red-500/20 hover:text-red-500 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAssets.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-white/20 space-y-4">
            <History size={48} strokeWidth={1} />
            <p className="text-sm font-medium uppercase tracking-widest">No assets found in this project</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetBrowser;
