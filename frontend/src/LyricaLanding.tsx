import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Mic2, Radio, Coins, Network, Menu, X, PlayCircle,
  BrainCircuit, ShieldCheck, Key, Zap, Activity, Shield,
  ArrowRight, ChevronRight, Globe, Lock, Cpu, Layers, Sparkles, Disc3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Vision from './components/sections/Vision';
import SonancePro from './components/sections/SonancePro';
import SLUniversal from './components/sections/SLUniversal';
import EmpireRevenue from './components/sections/EmpireRevenue';
import Architecture from './components/sections/Architecture';
import Simulations from './components/sections/Simulations';
import Agents from './components/sections/Agents';
import VICSProtocol from './components/sections/VICSProtocol';
import SeedRoundPitch from './components/sections/SeedRoundPitch';

const TABS = [
  { id: 'hero',         label: 'Empire Overview',       icon: Flame },
  { id: 'vision',       label: 'Core Vision',            icon: BrainCircuit },
  { id: 'agents',       label: 'Soulfire Agents',        icon: Cpu },
  { id: 'sonance',      label: 'Sonance Pro',            icon: Mic2 },
  { id: 'vics',         label: 'VICS Protocol',          icon: ShieldCheck },
  { id: 'universal',    label: 'SL Universal',           icon: Radio },
  { id: 'revenue',      label: 'Empire 1 Revenue',       icon: Coins },
  { id: 'architecture', label: 'Architecture & APIs',    icon: Network },
  { id: 'simulations',  label: 'Live Simulations',       icon: PlayCircle },
  { id: 'deck',         label: 'Seed Round Pitch',        icon: Sparkles },
];

const STATS = [
  { label: 'Active Universes',    value: '8',       unit: 'Partitions',   color: 'amber'   },
  { label: 'AI Agents Online',    value: '10',      unit: 'Lyrica Agents',color: 'rose'    },
  { label: 'Royalty Chain',       value: 'RULE_001–003', unit: 'Active', color: 'emerald' },
  { label: 'JWT Auth',            value: '< 0ms',   unit: 'Overhead',     color: 'blue'    },
  { label: 'DNA Tagged Tracks',   value: '∞',       unit: 'SVCL Ledger',  color: 'indigo'  },
  { label: 'Deploy Target',       value: 'GCP',     unit: 'Cloud Run',    color: 'amber'   },
];

const PILLARS = [
  {
    icon: BrainCircuit,
    title: 'Sovereign AI Core',
    desc: 'Lyria-3 generative engine with Overtone Suite, S2 Synthesizer, and 10 autonomous Lyrica agents processing cultural primitives.',
    color: 'amber',
  },
  {
    icon: ShieldCheck,
    title: 'VICS Identity Firewall',
    desc: 'ADR-0005 — JWT-backed universe access tokens, bcrypt identity vault, zero-latency local verification across all 8 universe partitions.',
    color: 'rose',
  },
  {
    icon: Disc3,
    title: 'DNA Royalty Chain',
    desc: 'RULE_001/002/003 micro-royalty ledger. Every flip, remix, and stem export is cryptographically attributed via the SVCL.',
    color: 'emerald',
  },
  {
    icon: Globe,
    title: 'Multi-Universe Fabric',
    desc: 'Empire-1 · SLA113 · Lyrica3-Pro · SL Universal · Sonance Pro — one sovereign platform, 8 partition-keyed domains, one identity provider.',
    color: 'blue',
  },
];

// Live HUD ticker
function HUDTicker() {
  const events = [
    '[U4/EMPIRE] EmpireHome.tsx deployed — partition key active',
    '[U0/FACTORY] identity_router registered — /api/identity/* online',
    '[U1/FOUNDRY] Lyria-3 agent serving Overtone Suite — G-SYNC: ON',
    '[U3/SOUTHERN] RULE_001 royalty split — 70/20/10 enforced',
    '[U5/OMNI] 10 Lyrica agents registered at /api/lyrica/*',
    '[SVCL] DNA_HASH: 0x8f2a...c3e4 — COMMERCIAL_RECURRING active',
    '[ADR-0004] Engine capability matrix — all pillars synchronized',
    '[GCP] Cloud Run us-central1 — backend + frontend + discord-bot LIVE',
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % events.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-neutral-950 border border-neutral-800 rounded-full text-[10px] font-mono text-neutral-500 overflow-hidden max-w-md">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          className="truncate"
        >
          {events[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Animated waveform bars
function WaveformBars({ count = 32, color = 'amber', active = true }: { count?: number; color?: string; active?: boolean }) {
  return (
    <div className="flex items-end gap-[2px] h-10">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={active ? {
            height: [`${15 + Math.sin(i * 0.8) * 60}%`, `${40 + Math.sin(i * 1.2 + 1) * 50}%`, `${15 + Math.sin(i * 0.8) * 60}%`]
          } : { height: '20%' }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' }}
          className={`w-[3px] rounded-full bg-${color}-500/60`}
        />
      ))}
    </div>
  );
}

// Hero panel
function HeroPanel() {
  const [hoveredPillar, setHoveredPillar] = useState<number | null>(null);

  return (
    <div className="space-y-16">
      {/* Cinematic Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-800/60 bg-neutral-950 min-h-[520px] flex flex-col justify-between p-10">
        {/* Radial glow BG */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_0%,rgba(245,158,11,0.12),transparent_65%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_100%,rgba(225,29,72,0.10),transparent_60%)]" />
        </div>

        {/* Scan-line grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px)',
          }}
        />

        {/* Top strip */}
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[9px] font-mono text-neutral-500 uppercase tracking-[0.3em]">Empire-1 Sovereign Platform</div>
              <div className="text-base font-black text-white tracking-widest uppercase">LYRICA 3 PRO</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-neutral-900/80 border border-neutral-800 px-4 py-2 rounded-full text-[10px] font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 font-bold uppercase">All Systems Sovereign</span>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-6 mt-10">
          <div className="space-y-1">
            <div className="text-[10px] font-mono text-amber-500 tracking-[0.4em] uppercase mb-3">
              The Empire · U0–U10 · ADR-0005 Identity Firewall Active
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
              THE EMPIRE<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-400 to-amber-300">
                SOUNDS LIKE THIS
              </span>
            </h1>
          </div>
          <p className="text-neutral-400 text-lg max-w-2xl leading-relaxed">
            One sovereign AI music platform — generative audio, DNA royalty chains, identity firewall,
            8 universe partitions — all deployed on GCP. No gatekeepers. No middlemen.
            The culture owns the infrastructure.
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <Link
              to="/studio"
              className="group flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-amber-500/25 active:scale-95"
            >
              <Zap className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Enter Studio
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/deck"
              className="flex items-center gap-2 px-8 py-4 bg-neutral-900 border border-neutral-700 hover:border-amber-500/50 text-neutral-200 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all active:scale-95"
            >
              <Layers className="w-4 h-4" />
              Stem Deck
            </Link>
            <div className="ml-auto hidden lg:block">
              <WaveformBars count={40} color="amber" active />
            </div>
          </div>
        </div>

        {/* Bottom stat strip */}
        <div className="relative z-10 mt-10 grid grid-cols-3 lg:grid-cols-6 gap-4 pt-8 border-t border-neutral-800/60">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="space-y-1"
            >
              <div className={`text-lg font-black font-mono text-${s.color}-400`}>{s.value}</div>
              <div className="text-[9px] text-neutral-500 uppercase tracking-widest leading-tight">
                {s.label}<br /><span className="text-neutral-600">{s.unit}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 4 Pillar Grid */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1 bg-neutral-800" />
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.4em]">Four Pillars of Sovereignty</span>
          <div className="h-px flex-1 bg-neutral-800" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            const isHovered = hoveredPillar === i;
            return (
              <motion.div
                key={i}
                onHoverStart={() => setHoveredPillar(i)}
                onHoverEnd={() => setHoveredPillar(null)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                className={`relative bg-neutral-950 border rounded-2xl p-7 cursor-default transition-all duration-300 overflow-hidden ${
                  isHovered ? `border-${p.color}-500/40 shadow-lg shadow-${p.color}-500/5` : 'border-neutral-800'
                }`}
              >
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`absolute inset-0 bg-${p.color}-500/[0.03] pointer-events-none`}
                  />
                )}
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-xl bg-${p.color}-500/10 border border-${p.color}-500/20 flex items-center justify-center mb-5 transition-all duration-300 ${isHovered ? `shadow-lg shadow-${p.color}-500/20` : ''}`}>
                    <Icon className={`w-6 h-6 text-${p.color}-500`} />
                  </div>
                  <h3 className={`text-base font-black text-white uppercase tracking-tight italic mb-2 transition-colors ${isHovered ? `text-${p.color}-200` : ''}`}>
                    {p.title}
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Live system status */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            Empire Infrastructure Status
          </h3>
          <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded uppercase">All Green</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'SLA113 Backend',    status: 'ONLINE',  sub: 'Cloud Run us-central1' },
            { name: 'Lyrica3 Frontend',  status: 'ONLINE',  sub: 'Cloud Run / CDN' },
            { name: 'Discord Bot',       status: 'ONLINE',  sub: '6 commands active' },
            { name: 'Identity Firewall', status: 'SECURED', sub: 'JWT / bcrypt ADR-0005' },
            { name: 'SVCL Ledger',       status: 'ACTIVE',  sub: 'DNA tagging live' },
            { name: 'Royalty Chain',     status: 'ACTIVE',  sub: 'RULE_001/002/003' },
            { name: 'Empire1 URL Map',   status: 'ONLINE',  sub: 'GCP load balancer' },
            { name: 'Lyria-3 Engine',    status: 'SYNCED',  sub: '10 agents registered' },
          ].map((s, i) => (
            <div key={i} className="bg-neutral-900 rounded-xl p-3 border border-neutral-800">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${s.status === 'SECURED' ? 'bg-blue-400' : 'bg-emerald-500'} animate-pulse`} />
                <span className={`text-[9px] font-mono font-bold uppercase ${s.status === 'SECURED' ? 'text-blue-400' : 'text-emerald-400'}`}>{s.status}</span>
              </div>
              <div className="text-xs font-bold text-neutral-200">{s.name}</div>
              <div className="text-[9px] text-neutral-600 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA strip */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/20 bg-gradient-to-br from-neutral-950 via-amber-950/10 to-neutral-950 p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(245,158,11,0.07),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Ready to enter the empire?</h2>
          <p className="text-neutral-400 text-sm">Sovereign AI music. DNA royalties. 8 universe partitions. One identity. Your culture, your infrastructure.</p>
        </div>
        <div className="relative z-10 flex gap-3 shrink-0">
          <Link
            to="/studio"
            className="group flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-amber-500/25 active:scale-95"
          >
            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            Launch Studio
          </Link>
          <a
            href="https://github.com/shiestybizz113-cell"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-6 py-4 bg-neutral-900 border border-neutral-700 hover:border-amber-500/40 text-neutral-300 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all"
          >
            <Lock className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LyricaLanding() {
  const [activeTab, setActiveTab] = useState('hero');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'hero':         return <HeroPanel />;
      case 'vision':       return <Vision />;
      case 'agents':       return <Agents />;
      case 'sonance':      return <SonancePro />;
      case 'vics':         return <VICSProtocol />;
      case 'universal':    return <SLUniversal />;
      case 'revenue':      return <EmpireRevenue />;
      case 'architecture': return <Architecture />;
      case 'simulations':  return <Simulations />;
      case 'deck':         return <SeedRoundPitch />;
      default:             return <HeroPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-amber-500/30">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 text-amber-500">
          <Flame className="w-6 h-6" />
          <span className="font-black tracking-wider text-lg uppercase">LYRICA 3 PRO</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-neutral-400 hover:text-white">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-0 top-[65px] bg-neutral-950 z-40 border-b border-neutral-800 overflow-y-auto"
          >
            <nav className="flex flex-col p-4 gap-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all text-left ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{tab.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto text-amber-500" />}
                  </button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 border-r border-neutral-800 bg-neutral-950/60 backdrop-blur-xl shrink-0">
          {/* Logo */}
          <div className="p-7 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-black tracking-widest text-base text-white uppercase">LYRICA 3 PRO</div>
              <div className="text-[9px] text-neutral-500 tracking-widest uppercase mt-0.5">The Empire · Sovereign Platform</div>
            </div>
          </div>

          {/* HUD Ticker */}
          <div className="px-4 mb-4">
            <HUDTicker />
          </div>

          <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group ${
                    isActive ? '' : 'text-neutral-500 hover:text-neutral-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabBg"
                      className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500 rounded-xl"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 relative z-10 shrink-0 ${isActive ? 'text-amber-500' : 'group-hover:text-neutral-300'}`} />
                  <span className={`font-medium text-sm relative z-10 ${isActive ? 'text-amber-200' : ''}`}>{tab.label}</span>
                  {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-amber-500 relative z-10" />}
                </button>
              );
            })}
          </nav>

          {/* Footer status */}
          <div className="p-5 border-t border-neutral-800/60 space-y-3">
            <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800/80">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">System Status</span>
                <button className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/20 group transition-all" title="Identity Firewall Active">
                  <Key className="w-3 h-3 text-amber-500" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-neutral-300 font-medium">EMSS Core Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs text-neutral-300 font-medium">8 Universes Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-xs text-neutral-300 font-medium">Identity Firewall Secured</span>
                </div>
              </div>
            </div>
            <Link
              to="/studio"
              className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-amber-400 font-bold text-xs uppercase tracking-widest transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              Enter Studio
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-950">
          <div className="max-w-5xl mx-auto p-6 lg:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
