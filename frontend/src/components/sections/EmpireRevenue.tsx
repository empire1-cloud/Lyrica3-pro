import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Fingerprint, TrendingUp, Network, ArrowRight, Database, Check, Plus, Trash2, ShieldCheck, Wallet, BarChart3, Globe, Zap } from 'lucide-react';

export default function EmpireRevenue() {
  const [dnaTags, setDnaTags] = useState([
    { id: 'trk_98x2_alpha', creator: 'usr_44a1_terra', hash: '0x8f2a...', status: 'Active' },
    { id: 'trk_s2_mutant_881z', creator: 'usr_44a1_terra', hash: '0x3c1b...', status: 'Active' }
  ]);

  const removeTag = (id: string) => {
    setDnaTags(dnaTags.filter(tag => tag.id !== id));
  };

  return (
    <div className="space-y-16 pb-20 max-w-6xl mx-auto">
      <header className="space-y-6">
        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-velvet-purple/10 border border-velvet-purple/20 text-velvet-purple text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
          <Coins className="w-3.5 h-3.5" />
          <span>Phase IV: Revenue Architecture</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-serif font-bold italic text-white tracking-tight leading-tight">
          The Business <span className="premium-gradient-text">Factory</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-3xl leading-relaxed font-serif italic">
          Backend mechanisms for tracking and distributing royalties for public AI tracks, ensuring creators are compensated for their digital DNA.
        </p>
      </header>

      {/* Syndicate Access Section */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-serif font-bold italic text-white tracking-tight">Empire 1 Access Tiers</h2>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-velvet-purple/50 to-transparent mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          {/* Initiate */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-obsidian-900/40 border border-white/5 rounded-[2.5rem] p-10 space-y-8 backdrop-blur-xl"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold italic text-slate-400">Initiate</h3>
              <div className="text-4xl font-serif font-bold text-white">Free</div>
            </div>
            <ul className="space-y-4">
              {[
                'Standard Audio (MP3)',
                'Basic Beat Templates',
                'Draft Vocal Synthesis'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-500 font-serif italic">
                  <Check className="w-4 h-4 text-velvet-purple/50" /> {item}
                </li>
              ))}
            </ul>
            <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
              Current Access
            </button>
          </motion.div>

          {/* Syndicate */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-b from-velvet-purple/20 to-obsidian-900/60 border border-velvet-purple/30 rounded-[3rem] p-12 space-y-10 relative shadow-2xl shadow-velvet-purple/10 transform md:scale-105 z-10 backdrop-blur-2xl"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-velvet-purple text-white text-[10px] font-bold rounded-full uppercase tracking-[0.2em] shadow-lg shadow-velvet-purple/20">
              The Syndicate
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-serif font-bold italic text-white">Empire 1 Syndicate</h3>
              <div className="text-5xl font-serif font-bold text-white">$24<span className="text-xl text-velvet-purple/60 font-normal">/mo</span></div>
            </div>
            <ul className="space-y-6">
              {[
                { label: 'SSAI Access', desc: 'Direct interface with the Multimodal Metaphor-to-Sonic-Vector Mapper.' },
                { label: 'S2 Synthesizer', desc: 'Unrestricted Disruption Heuristics (Juxtaposition, Transplantation).' },
                { label: 'Native MSGO', desc: 'Phase-coherent 48kHz/24-bit separated stems.' },
                { label: 'Ledger Sovereignty', desc: 'CSPIW watermarking & fractional micro-royalties.' }
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="p-1 bg-velvet-purple/20 rounded-lg mt-1">
                    <Check className="w-3 h-3 text-velvet-purple" />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-serif italic">
                    <strong className="text-white not-italic font-bold">{item.label}:</strong> {item.desc}
                  </p>
                </li>
              ))}
            </ul>
            <button className="w-full py-5 rounded-[2rem] bg-velvet-purple text-white font-bold text-xs uppercase tracking-[0.2em] hover:bg-fuchsia-600 transition-all shadow-xl shadow-velvet-purple/20">
              Weaponize the Empire
            </button>
          </motion.div>

          {/* Sovereign */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-obsidian-900/40 border border-white/5 rounded-[2.5rem] p-10 space-y-8 backdrop-blur-xl"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold italic text-slate-400">Sovereign</h3>
              <div className="text-4xl font-serif font-bold text-white">$99<span className="text-xl text-slate-600 font-normal">/mo</span></div>
            </div>
            <ul className="space-y-4">
              {[
                'Hi-Res (32bit float WAV/FLAC)',
                'Ultra Live Vocal Realism',
                'API Access & White-labeling'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-500 font-serif italic">
                  <Check className="w-4 h-4 text-velvet-purple/50" /> {item}
                </li>
              ))}
            </ul>
            <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
              Contact the Ledger
            </button>
          </motion.div>
        </div>
      </section>

      {/* DNA Tag Management */}
      <section className="bg-obsidian-900/40 border border-white/5 rounded-[3rem] p-10 backdrop-blur-xl relative overflow-hidden">
        <div className="architectural-grid absolute inset-0 opacity-[0.02] pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-velvet-purple/10 rounded-2xl border border-velvet-purple/20">
              <Fingerprint className="w-8 h-8 text-velvet-purple" />
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold italic text-white tracking-tight">DNA Tag Management</h3>
              <p className="text-sm text-slate-500 font-serif italic">Permanently linked Creator IDs & Attribution Ledger</p>
            </div>
          </div>
          <button className="flex items-center gap-3 px-6 py-3 bg-velvet-purple hover:bg-fuchsia-600 text-white text-[10px] font-bold rounded-2xl transition-all uppercase tracking-widest shadow-lg shadow-velvet-purple/20">
            <Plus className="w-4 h-4" />
            Register New DNA Vector
          </button>
        </div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="pb-6 micro-label !text-slate-600">Asset ID</th>
                <th className="pb-6 micro-label !text-slate-600">Creator DNA</th>
                <th className="pb-6 micro-label !text-slate-600">Stem Hash</th>
                <th className="pb-6 micro-label !text-slate-600">Status</th>
                <th className="pb-6 micro-label !text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {dnaTags.map((tag) => (
                <tr key={tag.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-6 font-mono text-xs text-velvet-purple font-bold">{tag.id}</td>
                  <td className="py-6 font-mono text-xs text-slate-400">{tag.creator}</td>
                  <td className="py-6 font-mono text-xs text-slate-600">{tag.hash}</td>
                  <td className="py-6">
                    <span className="px-3 py-1 rounded-lg bg-velvet-purple/10 border border-velvet-purple/20 text-[9px] font-bold text-velvet-purple uppercase tracking-widest">
                      {tag.status}
                    </span>
                  </td>
                  <td className="py-6 text-right">
                    <button 
                      onClick={() => removeTag(tag.id)}
                      className="p-2.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lane 01 */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-obsidian-900/40 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group backdrop-blur-xl"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <Network className="w-32 h-32 text-velvet-purple" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-velvet-purple/10 rounded-xl border border-velvet-purple/20">
                <Zap className="w-5 h-5 text-velvet-purple" />
              </div>
              <h3 className="text-xl font-serif font-bold italic text-white">Lane 01: Automation</h3>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed font-serif italic">
              "Flip" Trigger. Per-Execution / Task billing for every remix, generation, or consumption event.
            </p>
            <div className="space-y-4 pt-4">
              {[
                { label: 'Generation Event', price: '+$0.005' },
                { label: 'Stem Remix (Flip)', price: '+$0.012' },
                { label: 'Stream Play', price: '+$0.001' }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 pb-4">
                  <span className="text-slate-300 font-serif italic">{item.label}</span>
                  <span className="text-velvet-purple font-mono font-bold">{item.price}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Lane 02 */}
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-obsidian-900/40 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group backdrop-blur-xl"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <TrendingUp className="w-32 h-32 text-indigo-500" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-xl font-serif font-bold italic text-white">Lane 02: Utility SaaS</h3>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed font-serif italic">
              Viral Margins. Volume-based, graduated billing logic where cost per execution decreases with scale.
            </p>
            <div className="h-32 w-full flex items-end gap-3 pt-4">
              {[20, 35, 45, 60, 80, 100].map((height, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-gradient-to-t from-indigo-500/10 to-indigo-500/60 rounded-t-xl hover:to-indigo-400 transition-all cursor-help"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between micro-label !text-slate-600 pt-2">
              <span>Low Volume</span>
              <span>Viral Scale</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Micro-Royalty Flow */}
      <section className="bg-black/40 border border-white/5 rounded-[3.5rem] p-12 md:p-16 relative overflow-hidden backdrop-blur-2xl">
        <div className="architectural-grid absolute inset-0 opacity-[0.02] pointer-events-none" />
        <h2 className="text-3xl font-serif font-bold italic text-white mb-16 text-center tracking-tight">Micro-Royalty Split Architecture</h2>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16 relative z-10">
          {[
            { icon: Database, title: 'Execution Log', desc: 'Event Triggered', color: 'slate' },
            { icon: Fingerprint, title: 'DNA Resolution', desc: 'Identify Creators', color: 'velvet-purple', active: true },
            { icon: Coins, title: 'Ledger Split', desc: 'Fractional Dist.', color: 'amber' }
          ].map((step, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center gap-12 md:gap-16 w-full md:w-auto">
              <div className={`flex flex-col items-center text-center w-full md:w-56 p-10 rounded-[2.5rem] border transition-all ${
                step.active 
                  ? 'bg-velvet-purple/10 border-velvet-purple/30 shadow-2xl shadow-velvet-purple/10 scale-110' 
                  : 'bg-white/[0.02] border-white/5'
              }`}>
                <div className={`p-5 rounded-2xl mb-6 ${
                  step.color === 'slate' ? 'bg-slate-500/10 text-slate-400' :
                  step.color === 'velvet-purple' ? 'bg-velvet-purple/20 text-velvet-purple' :
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="text-lg font-serif font-bold italic text-white mb-2">{step.title}</div>
                <div className="text-xs text-slate-500 font-serif italic">{step.desc}</div>
                {step.active && (
                  <div className="mt-6 px-4 py-1 bg-velvet-purple text-white text-[8px] font-bold rounded-full uppercase tracking-widest animate-pulse">
                    Processing
                  </div>
                )}
              </div>
              {i < 2 && (
                <div className="flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-slate-700 hidden md:block" />
                  <div className="w-[1px] h-12 bg-slate-800 md:hidden" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
