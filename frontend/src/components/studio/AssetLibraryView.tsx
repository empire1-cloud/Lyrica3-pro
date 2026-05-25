import React from 'react';
import { CATEGORIES, assetProductionList } from '../lib/assetLibrary';
import { motion } from 'motion/react';
import { Box, Layers, Cpu, Mic, Music, Zap } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  [CATEGORIES.AI_STYLE_MODEL]: <Cpu size={18} />,
  [CATEGORIES.PROCEDURAL_FX]: <Zap size={18} />,
  [CATEGORIES.AI_UTILITY]: <Layers size={18} />,
  [CATEGORIES.VOCAL_ENGINE]: <Mic size={18} />,
  [CATEGORIES.PRODUCER_KIT]: <Music size={18} />,
  [CATEGORIES.FX_PACK]: <Box size={18} />,
};

export const AssetLibraryView: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-12">
        <h2 className="text-5xl font-display uppercase tracking-tighter mb-2">Master Asset Library</h2>
        <p className="text-text-secondary font-mono text-xs uppercase tracking-[0.3em]">Definitive Registry // Production-Ready Modules</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {Object.entries(assetProductionList).map(([key, assets]) => (
          <div key={key} className="space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="text-accent">
                {categoryIcons[assets[0]?.category] || <Box size={18} />}
              </div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-primary">
                {assets[0]?.category || key}
              </h3>
            </div>

            <div className="space-y-4">
              {assets.map((asset: Record<string, unknown>) => (
                <motion.div 
                  key={asset.id as string}
                  whileHover={{ x: 4 }}
                  className="group cursor-pointer"
                >
                  <h4 className="text-sm font-bold group-hover:text-accent transition-colors">
                    {asset.name as string}
                  </h4>
                  <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                    {asset.description as string}
                  </p>
                  {asset.features as string[] && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(asset.features as string[]).map((f: string) => (
                        <span key={f} className="text-[9px] font-mono bg-white/5 px-1.5 py-0.5 rounded text-text-secondary uppercase">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
