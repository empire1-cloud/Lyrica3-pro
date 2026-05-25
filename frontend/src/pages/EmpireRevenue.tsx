import { motion } from 'motion/react';
import { Coins, Fingerprint, TrendingUp, Network, ArrowRight, Database, Check } from 'lucide-react';

export default function EmpireRevenue() {
  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-mono mb-4">
          <Coins className="w-4 h-4" />
          <span>PHASE IV: EMPIRE 1 REVENUE ARCHITECTURE</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
          The Business <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Factory</span>
        </h1>
        <p className="text-xl text-neutral-400 max-w-3xl leading-relaxed">
          Backend mechanisms for tracking and distributing royalties for public AI tracks, ensuring creators are compensated for their digital DNA.
        </p>
      </header>

      {/* Syndicate Access Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Empire 1 Access Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Initiate */}
          <div className="bg-neutral-900/30 border border-neutral-800 rounded-3xl p-8">
            <h3 className="text-xl font-semibold text-white mb-2">Initiate</h3>
            <div className="text-3xl font-bold text-white mb-6">Free</div>
            <ul className="space-y-4 text-sm text-neutral-400 mb-8">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" /> Standard Audio (MP3)</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" /> Basic Beat Templates</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" /> Draft Vocal Synthesis</li>
            </ul>
            <button className="w-full py-3 rounded-xl bg-neutral-800 text-white font-medium hover:bg-neutral-700 transition-colors">Current Access</button>
          </div>
          {/* Syndicate */}
          <div className="bg-gradient-to-b from-red-900/40 to-neutral-900/40 border border-red-500/30 rounded-3xl p-8 relative transform md:-translate-y-4 shadow-2xl shadow-red-500/10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">The Syndicate</div>
            <h3 className="text-xl font-semibold text-white mb-2">Empire 1 Syndicate</h3>
            <div className="text-3xl font-bold text-white mb-6">$24<span className="text-lg text-neutral-500 font-normal">/mo</span></div>
            <ul className="space-y-4 text-sm text-neutral-300 mb-8">
              <li className="flex items-start gap-3"><Check className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> <span><strong>SSAI Access:</strong> Direct interface with the Multimodal Metaphor-to-Sonic-Vector Mapper.</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> <span><strong>S2 Serendipity Synthesizer:</strong> Unrestricted Disruption Heuristics (Juxtaposition, Transplantation).</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> <span><strong>Native MSGO Rendering:</strong> Phase-coherent 48kHz/24-bit separated stems.</span></li>
              <li className="flex items-start gap-3"><Check className="w-4 h-4 text-red-400 mt-0.5 shrink-0" /> <span><strong>Empire 1 Ledger Sovereignty:</strong> CSPIW watermarking & fractional micro-royalties.</span></li>
            </ul>
            <button className="w-full py-3 rounded-xl bg-red-600 text-white font-bold tracking-wide hover:bg-red-500 transition-colors">Weaponize the Empire</button>
          </div>
          {/* Sovereign */}
          <div className="bg-neutral-900/30 border border-neutral-800 rounded-3xl p-8">
            <h3 className="text-xl font-semibold text-white mb-2">Sovereign</h3>
            <div className="text-3xl font-bold text-white mb-6">$99<span className="text-lg text-neutral-500 font-normal">/mo</span></div>
            <ul className="space-y-4 text-sm text-neutral-400 mb-8">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" /> Hi-Res (32bit float WAV/FLAC)</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" /> Ultra Live Vocal Realism</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-emerald-500" /> API Access & White-labeling</li>
            </ul>
            <button className="w-full py-3 rounded-xl bg-neutral-800 text-white font-medium hover:bg-neutral-700 transition-colors">Contact the Ledger</button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DNA Tag */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Fingerprint className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-semibold text-white mb-4">DNA Tagging</h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              Immutable metadata tags injected into all assets, permanently linked to Creator IDs. This is the foundational layer for attribution.
            </p>
            <div className="bg-black/50 border border-neutral-800 rounded-xl p-4 font-mono text-xs text-neutral-500">
              <div>{"{"}</div>
              <div className="pl-4">"asset_id": "trk_98x2...",</div>
              <div className="pl-4">"creator_dna": "usr_44a1...",</div>
              <div className="pl-4">"stem_hash": "0x8f2a..."</div>
              <div>{"}"}</div>
            </div>
          </div>
        </div>

        {/* Lane 01 */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Network className="w-24 h-24 text-blue-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-semibold text-white mb-4">Lane 01: Automation</h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              "Flip" Trigger. Per-Execution / Task billing for every remix, generation, or consumption event.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm border-b border-neutral-800 pb-2">
                <span className="text-neutral-300">Generation Event</span>
                <span className="text-emerald-400 font-mono">+$0.005</span>
              </div>
              <div className="flex items-center justify-between text-sm border-b border-neutral-800 pb-2">
                <span className="text-neutral-300">Stem Remix (Flip)</span>
                <span className="text-emerald-400 font-mono">+$0.012</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-300">Stream Play</span>
                <span className="text-emerald-400 font-mono">+$0.001</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lane 02 */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-24 h-24 text-purple-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-xl font-semibold text-white mb-4">Lane 02: Utility SaaS</h3>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6">
              Viral Margins. Volume-based, graduated billing logic where cost per execution decreases with scale, increasing profit margins as virality grows.
            </p>
            <div className="h-24 w-full flex items-end gap-2">
              {[20, 35, 45, 60, 80, 100].map((height, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-gradient-to-t from-purple-500/20 to-purple-500/80 rounded-t-sm"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-neutral-500 mt-2 font-mono">
              <span>Low Vol</span>
              <span>High Vol (Viral)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Micro-Royalty Flow */}
      <section className="bg-black border border-neutral-800 rounded-3xl p-8 md:p-12">
        <h2 className="text-2xl font-semibold text-white mb-8 text-center">Micro-Royalty Split Architecture</h2>
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col items-center text-center w-full md:w-48">
            <Database className="w-8 h-8 text-neutral-400 mb-3" />
            <div className="text-sm font-medium text-white">Execution Log</div>
            <div className="text-xs text-neutral-500 mt-1">Event Triggered</div>
          </div>

          <ArrowRight className="w-6 h-6 text-neutral-600 hidden md:block" />
          <div className="w-1 h-6 bg-neutral-800 md:hidden" />

          <div className="bg-neutral-900 border border-emerald-500/30 p-6 rounded-2xl flex flex-col items-center text-center w-full md:w-48 relative">
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full animate-ping opacity-75" />
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full" />
            <Fingerprint className="w-8 h-8 text-emerald-400 mb-3" />
            <div className="text-sm font-medium text-white">DNA Resolution</div>
            <div className="text-xs text-neutral-500 mt-1">Identify Creators</div>
          </div>

          <ArrowRight className="w-6 h-6 text-neutral-600 hidden md:block" />
          <div className="w-1 h-6 bg-neutral-800 md:hidden" />

          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col items-center text-center w-full md:w-48">
            <Coins className="w-8 h-8 text-amber-400 mb-3" />
            <div className="text-sm font-medium text-white">Ledger Split</div>
            <div className="text-xs text-neutral-500 mt-1">Fractional Dist.</div>
          </div>

        </div>
      </section>
    </div>
  );
}
