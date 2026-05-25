import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Mic2, Radio, Coins, Network, Menu, X, PlayCircle, BrainCircuit, ShieldCheck, Key } from 'lucide-react';
import Vision from './components/sections/Vision';
import SonancePro from './components/sections/SonancePro';
import SLUniversal from './components/sections/SLUniversal';
import EmpireRevenue from './components/sections/EmpireRevenue';
import Architecture from './components/sections/Architecture';
import Simulations from './components/sections/Simulations';
import Agents from './components/sections/Agents';
import VICSProtocol from './components/sections/VICSProtocol';

const TABS = [
  { id: 'vision', label: 'Core Vision', icon: Flame },
  { id: 'agents', label: 'The Soulfire Agents', icon: BrainCircuit },
  { id: 'sonance', label: 'Sonance Pro', icon: Mic2 },
  { id: 'vics', label: 'VICS Protocol', icon: ShieldCheck },
  { id: 'universal', label: 'SL Universal', icon: Radio },
  { id: 'revenue', label: 'Empire 1 Revenue', icon: Coins },
  { id: 'architecture', label: 'Architecture & APIs', icon: Network },
  { id: 'simulations', label: 'Live Simulations', icon: PlayCircle },
];

export interface Track {
  trackMetadata?: {
    title: string;
    core_genre: string;
    s2_mutation: string;
    dna_tag_preview: string;
  };
  ccnaGhostwriterDirective?: {
    corpus: string;
    subtext: string;
  };
  epdVocalBlueprint?: {
    vulnerability_level: number;
    biometric_artifacts: string[];
    phonation: string;
  };
  acousticPrimitives?: {
    groove: string;
    texture: string;
  };
  lyricsPayload?: Array<{
    line: string;
    artifact_trigger: string;
  }>;
  audioUrl?: string;
  vocalPipelines?: Array<{
    id: string;
    active: boolean;
    intensity: number;
  }>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('vision');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'vision': return <Vision />;
      case 'agents': return <Agents />;
      case 'sonance': return <SonancePro />;
      case 'vics': return <VICSProtocol />;
      case 'universal': return <SLUniversal />;
      case 'revenue': return <EmpireRevenue />;
      case 'architecture': return <Architecture />;
      case 'simulations': return <Simulations />;
      default: return <Vision />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-orange-500/30">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 text-orange-500">
          <Flame className="w-6 h-6" />
          <span className="font-bold tracking-wider text-lg">SOULFIRE</span>
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
            className="lg:hidden fixed inset-0 top-[65px] bg-neutral-950 z-40 border-b border-neutral-800"
          >
            <nav className="flex flex-col p-4 gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' 
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 border-r border-neutral-800 bg-neutral-950/50 backdrop-blur-xl shrink-0">
          <div className="p-8 flex items-center gap-3 text-orange-500">
            <Flame className="w-8 h-8" />
            <div>
              <h1 className="font-bold tracking-widest text-xl">SOULFIRE</h1>
              <p className="text-xs text-neutral-500 tracking-widest uppercase mt-1">By Lyrica 3 Pro</p>
            </div>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group ${
                    isActive 
                      ? 'text-orange-400' 
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab" 
                      className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent border-l-2 border-orange-500 rounded-r-xl"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-orange-500' : 'group-hover:text-neutral-300'}`} />
                  <span className="font-medium relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-6 border-t border-neutral-800/50">
            <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-neutral-400 font-mono">SYSTEM STATUS</p>
                <button className="p-1.5 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg border border-orange-500/20 group transition-all" title="All Access Clearance">
                  <Key className="w-3.5 h-3.5 text-orange-500 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-neutral-300">EMSS Core Online</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950">
          <div className="max-w-5xl mx-auto p-6 lg:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
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
