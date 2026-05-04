import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Activity, CreditCard, Globe, Layers, Grid3x3, PanelsTopLeft,
  TriangleAlert, ChevronDown, CloudLightning, Cpu, Crosshair,
  ShieldCheck, Settings2, Music, Image, Gamepad2, Package,
  Swords, Zap, Terminal, Clock, BarChart, Skull, Box,
  FlaskConical, Lock, Radio, Star, Trophy, Users, Wallet,
  Flame, Eye, Code2, Database
} from 'lucide-react';

// ─── Canon Config ─────────────────────────────────────────────────
const BACKEND = process.env.REACT_APP_BACKEND_URL || 'https://lyrica3-pro-backend-339698334666.us-central1.run.app';
const API = `${BACKEND}/api/sla113`;

const CANON_PALETTE = {
  obsidian: '#050505',
  gold: '#D4AF37',
  cyan: '#00C8FF',
  chrome: '#E5E4E2',
  roseGold: '#B76E79',
  deepRed: '#8B0000',
  indigo: '#6366f1',
};

const STYLES = `
  #sla113-root, #sla113-root * {
    margin: 0; padding: 0; box-sizing: border-box;
    --bg-primary: initial; --bg-secondary: initial; --bg-card: initial;
    --accent-green: initial; --accent-blue: initial;
  }
  #sla113-root {
    position: fixed; inset: 0; z-index: 9999;
    background: #050505; overflow: hidden;
  }
  .sla113-scope * {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      "Liberation Mono", "Courier New", monospace !important;
  }
  .glass-panel {
    background: rgba(13,13,13,0.85);
    backdrop-filter: blur(10px);
    border: 1px solid #1a1a1a;
    box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
  }
  .input-dark {
    background: #000; border: 1px solid #1a1a1a; color: #fff;
    padding: 12px; font-size: 0.75rem; outline: none; width: 100%;
    transition: border-color 0.2s;
  }
  .input-dark:focus { border-color: currentColor; }
  @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100%)} }
  .scanline {
    position: absolute; top: 0; left: 0; width: 100%; height: 2px;
    background: rgba(255,255,255,0.05);
    animation: scanline 6s linear infinite; pointer-events: none; z-index: 50;
  }
  .tech-border { position: relative; }
  .tech-border::before, .tech-border::after {
    content: ''; position: absolute; width: 8px; height: 8px;
    border: 1px solid rgba(255,255,255,0.2); pointer-events: none;
  }
  .tech-border::before { top:-1px; left:-1px; border-right:none; border-bottom:none; }
  .tech-border::after  { bottom:-1px; right:-1px; border-left:none; border-top:none; }
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #666; }
`;

const THEMES = {
  factory: { hex: CANON_PALETTE.cyan,    text: 'text-[#00C8FF]', border: 'border-[#00C8FF]', bg: 'bg-[#00C8FF]', bgAlpha: 'bg-[#00C8FF]/10', label: 'FACTORY',  sub: 'Live Operations'  },
  empire:  { hex: CANON_PALETTE.indigo,  text: 'text-[#6366f1]', border: 'border-[#6366f1]', bg: 'bg-[#6366f1]', bgAlpha: 'bg-[#6366f1]/10', label: 'EMPIRE 1', sub: 'Revenue Matrix'   },
  foundry: { hex: CANON_PALETTE.gold,    text: 'text-[#D4AF37]', border: 'border-[#D4AF37]', bg: 'bg-[#D4AF37]', bgAlpha: 'bg-[#D4AF37]/10', label: 'FOUNDRY',  sub: 'Creative Tools'   },
  vault:   { hex: CANON_PALETTE.deepRed, text: 'text-[#8B0000]', border: 'border-[#8B0000]', bg: 'bg-[#8B0000]', bgAlpha: 'bg-[#8B0000]/10', label: 'VAULT',    sub: 'Security Core'    },
};

const ALL_NAV_ITEMS = [
  { id: 'FRONTLINE',         icon: Activity,      partition: 'factory' },
  { id: 'WHITE LABEL MINT',  icon: Wallet,        partition: 'factory' },
  { id: 'DEPLOY CENTER',     icon: Globe,         partition: 'factory' },
  { id: 'UNIVERSES',         icon: Star,          partition: 'factory' },
  { id: 'FISH ARENA',        icon: Crosshair,     partition: 'factory' },
  { id: 'MINT LEDGER',       icon: CreditCard,    partition: 'empire'  },
  { id: 'REVENUE PIPELINES', icon: BarChart,      partition: 'empire'  },
  { id: 'BESTIARY',          icon: Skull,         partition: 'empire'  },
  { id: 'SLOT SYMBOLS',      icon: Grid3x3,       partition: 'empire'  },
  { id: 'OS BUILDER',        icon: PanelsTopLeft, partition: 'foundry' },
  { id: 'VISION SMITH',      icon: Eye,           partition: 'foundry' },
  { id: 'AUDIO FORGE',       icon: Music,         partition: 'foundry' },
  { id: 'SPRITE REGISTRY',   icon: Image,         partition: 'foundry' },
  { id: 'GAME COMPOSER',     icon: Gamepad2,      partition: 'foundry' },
  { id: 'BUILD PIPELINE',    icon: Package,       partition: 'vault'   },
  { id: 'COMPLIANCE',        icon: ShieldCheck,   partition: 'vault'   },
  { id: 'ARTTECH NEXUS',     icon: Grid3x3,       partition: 'vault'   },
  { id: 'MATRIX PARAMS',     icon: Settings2,     partition: 'vault'   },
  { id: 'SYSTEM CORE',       icon: Cpu,           partition: 'vault'   },
  { id: 'NIGHT QUEUE',       icon: Clock,         partition: 'vault'   },
];

// ─── Canon Data ───────────────────────────────────────────────────
const BOSS_BESTIARY = [
  {
    id: 'XOCHIPILLI', name: 'Xochipilli Scathed', title: 'Sun Priest of the Burning Codex',
    tier: 'MYTHIC', hp: 850000, credits: { left: 3500, right: 2400 },
    image: 'https://customer-assets.emergentagent.com/job_3653cf8a-8710-488d-846f-2f0428b714dd/artifacts/7v5cck22_boss.jpg',
    spriteSheet: null,
    attacks: ['Solar Flare Staff', 'Calendar Shield Bash', 'Obsidian Cannon Barrage', 'Flower of Fire'],
    weakness: 'Water / Ice', rtp: '94.2%', theme: 'Aztec / Mesoamerican',
    lore: 'Once the god of flowers, art and song — now a skeletal harbinger wielding the burning codex of the Fifth Sun. His Aztec armor cracks with lava, each flower on his body a trapped soul.',
  },
  {
    id: 'LOBO_NEGRO', name: 'Lobo Negro', title: 'Spirit Wolf of the Golden Spiral',
    tier: 'LEGENDARY', hp: 620000, credits: { left: 2800, right: 1900 },
    image: 'https://customer-assets.emergentagent.com/job_3653cf8a-8710-488d-846f-2f0428b714dd/artifacts/row23xof_bossf.png',
    spriteSheet: 'https://customer-assets.emergentagent.com/job_3653cf8a-8710-488d-846f-2f0428b714dd/artifacts/g7h5sjnl_spritesheet1%20%281%29.jpg',
    attacks: ['Shadow Lunge', 'Gold Glyph Howl', 'Spiral Mark Drain', 'Pack Summon'],
    weakness: 'Lightning / Holy', rtp: '93.8%', theme: 'Aztec / Spirit Animal',
    lore: 'A massive black wolf branded with ancient golden Aztec glyphs. Each spiral burned into his fur is a pact with the underworld. His amber eyes see through walls and into the spirit realm.',
  },
  {
    id: 'LA_REINA', name: 'La Reina Oscura', title: 'Queen of the Obsidian Court',
    tier: 'MYTHIC', hp: 780000, credits: { left: 4200, right: 3100 },
    image: 'https://customer-assets.emergentagent.com/job_3653cf8a-8710-488d-846f-2f0428b714dd/artifacts/row23xof_bossf.png',
    spriteSheet: null,
    attacks: ['Obsidian Blade Dance', 'Shadow Crown Pulse', 'Spirit Chain Bind', 'Eclipse Judgment'],
    weakness: 'Fire / Light', rtp: '95.1%', theme: 'Aztec / Urban Warrior',
    lore: 'The warrior queen who rose from the streets of East Los to command the obsidian throne. Her blade drinks shadows and her crown channels the spirits of fallen warriors.',
  },
];

const GAME_BACKGROUNDS = [
  {
    id: 'BG_AZTEC_LA', name: 'Aztec Ruins x East LA',
    image: 'https://customer-assets.emergentagent.com/job_3653cf8a-8710-488d-846f-2f0428b714dd/artifacts/l1atothu_background1.png.png',
    type: 'Parallax Background', resolution: '1024x1024', theme: 'Mesoamerican / Urban',
  },
];

const ENGINE_PRESETS = [
  { id: 'AAA_FISH_SLOT', name: 'Fish Shooting (Luxury)',    desc: 'Casino-grade 3D render, luxury obsidian' },
  { id: 'GTA5_TYPE',     name: 'Open World (GTA Style)',    desc: 'Cinematic urban grit, hyper-realistic'   },
  { id: 'COD_WARFARE',   name: 'Tactical FPS (COD Style)', desc: 'Tactical military realism, matte black'   },
  { id: 'FANTASY_RPG',   name: 'Fantasy RPG',              desc: 'Magical, mythical creatures, aztec stone' },
];

const UNIVERSAL_GAME_TYPES = [
  { id: 'arcade_classic',     label: 'Arcade Classic',       seats: 40,  cat: 'arcade'  },
  { id: 'fish_shooting',      label: 'Fish Shooting',        seats: 60,  cat: 'arcade'  },
  { id: 'battle_royale',      label: 'Battle Royale',        seats: 100, cat: 'arcade'  },
  { id: 'tactical_fps',       label: 'Tactical FPS',         seats: 80,  cat: 'arcade'  },
  { id: 'cod_warfare',        label: 'COD Warfare',          seats: 80,  cat: 'arcade'  },
  { id: 'open_world',         label: 'Open World (GTA)',     seats: 100, cat: 'arcade'  },
  { id: 'slot_machine',       label: 'Slot Machine',         seats: 20,  cat: 'casino'  },
  { id: 'video_poker',        label: 'Video Poker',          seats: 20,  cat: 'casino'  },
  { id: 'casino_suite',       label: 'Casino Suite',         seats: 100, cat: 'casino'  },
  { id: 'pachinko',           label: 'Pachinko',             seats: 30,  cat: 'casino'  },
  { id: 'open_world_rpg',     label: 'Open World RPG',       seats: 100, cat: 'rpg'     },
  { id: 'fantasy_rpg',        label: 'Fantasy RPG',          seats: 60,  cat: 'rpg'     },
  { id: 'southern_barrio',    label: 'Southern Barrio',      seats: 40,  cat: 'rpg'     },
  { id: 'racing_sim',         label: 'Racing Sim',           seats: 60,  cat: 'racing'  },
  { id: 'hybrid_mix',         label: 'Hybrid Mix',           seats: 40,  cat: 'hybrid'  },
  { id: 'custom_partner',     label: 'Custom Partner Games', seats: 60,  cat: 'hybrid'  },
];

const CATEGORY_META = {
  arcade: { label: 'ARCADE & ACTION',    color: 'text-cyan-400'   },
  casino: { label: 'CASINO & GAMBLING',  color: 'text-amber-400'  },
  rpg:    { label: 'RPG & NARRATIVE',    color: 'text-indigo-400' },
  racing: { label: 'RACING & SIM',       color: 'text-emerald-400'},
  hybrid: { label: 'HYBRID & CUSTOM',    color: 'text-zinc-400'   },
};

const AGENT_NODES = [
  { id: 'shop-alpha', subdomain: 'alpha.empire1.cloud', credits: 12500, rtp: 92, status: 'ONLINE'    },
  { id: 'shop-beta',  subdomain: 'beta.southern.arc',   credits: 4200,  rtp: 88, status: 'ONLINE'    },
  { id: 'shop-gamma', subdomain: 'gamma.barrio.link',   credits: 150,   rtp: 94, status: 'LOW_FUNDS' },
];

const EMPIRE_PIPELINES = [
  { id: 1, lane: 1, name: 'Lead Qualification Engine', type: 'Automation' },
  { id: 2, lane: 1, name: 'CRM Syncing Logic',         type: 'Automation' },
  { id: 3, lane: 2, name: 'Pro Voice Over (SaaS)',     type: 'Utility'    },
  { id: 4, lane: 2, name: 'SMS/Email Gateway',         type: 'Utility'    },
  { id: 5, lane: 3, name: 'White-Label Instance',      type: 'Sovereign'  },
  { id: 6, lane: 3, name: 'Managed Sovereignty',       type: 'Sovereign'  },
];

const CANON_TRACKS = [
  { id: 'trk_alpha_b4d9a1_empire1', title: "Xochitl's Anchor",     bpm: 93,  key: 'Am', status: 'MASTERED'   },
  { id: 'trk_alpha_4e8a1c_empire1', title: 'Sleep On The Floor',   bpm: 88,  key: 'Dm', status: 'MASTERED'   },
  { id: 'trk_scars_001',            title: 'Scars in the Dark',    bpm: 102, key: 'Em', status: 'MIXING'     },
  { id: 'trk_smile_002',            title: 'Smile Through Damage', bpm: 78,  key: 'Cm', status: 'DRAFT'      },
];

// ─── Admin Heartbeat (exact replica) ─────────────────────────────
function AdminHeartbeat({ processingCount, theme }) {
  const [computeMode, setComputeMode] = useState('LOCAL');
  return (
    <div className={`border ${theme.border} bg-black/50 p-4 flex flex-col space-y-3 font-mono text-[10px] shadow-[0_0_15px_rgba(0,0,0,0.5)]`} data-testid="admin-heartbeat">
      <div className={`flex justify-between items-center border-b ${theme.border} pb-2`}>
        <span className={`${theme.text} font-bold tracking-widest uppercase flex items-center gap-2`}>
          <Cpu size={12} /> Daemon Uplink
        </span>
        <span className={`h-2 w-2 rounded-full ${theme.bg} animate-pulse`} />
      </div>
      <div className="space-y-2 text-zinc-400 tracking-wider">
        <div className="flex justify-between items-center">
          <span>CPU / RAM</span><span className="text-zinc-200 font-bold">14% / 42.8 GB</span>
        </div>
        <div className="flex justify-between items-center">
          <span>NIGHT QUEUE</span>
          <span className={`${theme.text} font-bold`}>{processingCount} PENDING</span>
        </div>
        <div className="flex justify-between items-center">
          <span>LAST PING</span><span className="text-zinc-500">12ms</span>
        </div>
      </div>
      <div className="pt-2 border-t border-zinc-800 flex justify-between items-center">
        <span className="text-zinc-500 uppercase">Compute Node</span>
        <button
          onClick={() => setComputeMode(m => m === 'LOCAL' ? 'CLOUD' : 'LOCAL')}
          className={`px-2 py-0.5 border text-[9px] font-bold tracking-widest transition-all ${computeMode === 'LOCAL' ? `${theme.border} ${theme.text} ${theme.bgAlpha}` : 'border-zinc-800 text-zinc-500 bg-black'}`}
          data-testid="compute-mode-toggle"
        >{computeMode}</button>
      </div>
    </div>
  );
}

// ─── Panel: Frontline ─────────────────────────────────────────────
function FrontlinePanel({ stats, projects }) {
  const nodes = AGENT_NODES;
  return (
    <div className="grid grid-cols-12 gap-6 animate-in fade-in max-w-7xl mx-auto w-full" data-testid="frontline-panel">
      {/* Stats strip */}
      <div className="col-span-12 grid grid-cols-4 gap-4">
        {[
          { label: 'Net Revenue',      value: `$${(stats.total_revenue || 142500).toLocaleString()}`, color: 'text-white'         },
          { label: 'Active Sessions',  value: stats.active_sessions  || 247,                          color: 'text-cyan-400'      },
          { label: 'Engines Online',   value: `${stats.engines_online || 39} / 39`,                   color: 'text-emerald-400'   },
          { label: 'Tenants',          value: stats.total_tenants    || 9,                            color: 'text-[#D4AF37]'     },
        ].map(s => (
          <div key={s.label} className="glass-panel p-4 border-zinc-900/50">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">{s.label}</div>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>
      {/* Live nodes */}
      <div className="col-span-8 glass-panel border-cyan-500/20 p-6">
        <h3 className="text-cyan-400 text-[10px] font-black uppercase tracking-[4px] mb-4 border-b border-cyan-500/20 pb-3">Live Operator Nodes</h3>
        <div className="space-y-3">
          {nodes.map(n => (
            <div key={n.id} className="flex items-center justify-between p-3 bg-black/50 border border-zinc-900">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${n.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
                <span className="text-zinc-300 text-[11px] tracking-wider">{n.subdomain}</span>
              </div>
              <div className="flex items-center gap-6 text-[10px]">
                <span className="text-[#D4AF37]">{n.credits.toLocaleString()} CR</span>
                <span className="text-zinc-500">RTP {n.rtp}%</span>
                <span className={`px-2 py-0.5 border text-[8px] font-bold tracking-widest ${n.status === 'ONLINE' ? 'border-emerald-500/50 text-emerald-400' : 'border-amber-500/50 text-amber-400'}`}>{n.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* System status */}
      <div className="col-span-4 glass-panel border-cyan-500/20 p-6">
        <h3 className="text-cyan-400 text-[10px] font-black uppercase tracking-[4px] mb-4 border-b border-cyan-500/20 pb-3">System Status</h3>
        <div className="space-y-3 text-[10px]">
          {[
            { k: 'BUILD REV',       v: 'v17',               c: 'text-[#D4AF37]' },
            { k: 'PIPELINES',       v: '39 / 39 ACTIVE',    c: 'text-emerald-400' },
            { k: 'CANON ENFORCER',  v: 'ARMED',             c: 'text-cyan-400' },
            { k: 'NIGHT QUEUE',     v: '12 PENDING',        c: 'text-amber-400' },
            { k: 'SOULFIRE DNA',    v: 'ONLINE',            c: 'text-emerald-400' },
            { k: 'JWT',             v: 'SET ✓',             c: 'text-emerald-400' },
            { k: 'DB',              v: 'Lyrica3-pro',       c: 'text-zinc-300' },
          ].map(r => (
            <div key={r.k} className="flex justify-between items-center border-b border-zinc-900/50 pb-2">
              <span className="text-zinc-600 tracking-widest">{r.k}</span>
              <span className={`font-bold ${r.c}`}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Panel: Bestiary ──────────────────────────────────────────────
function BestiaryPanel() {
  const [selectedBoss, setSelectedBoss] = useState(BOSS_BESTIARY[0]);
  return (
    <div className="grid grid-cols-12 gap-6 animate-in fade-in max-w-7xl mx-auto w-full" data-testid="bestiary-panel">
      <div className="col-span-3 space-y-2">
        {BOSS_BESTIARY.map(b => (
          <button key={b.id} onClick={() => setSelectedBoss(b)}
            className={`w-full text-left p-4 border transition-all ${selectedBoss.id === b.id ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5' : 'border-zinc-900 bg-black/30 hover:border-zinc-700'}`}>
            <div className={`text-[10px] font-bold tracking-widest uppercase ${selectedBoss.id === b.id ? 'text-[#D4AF37]' : 'text-zinc-300'}`}>{b.name}</div>
            <div className="text-[8px] text-zinc-600 mt-1">{b.tier}</div>
          </button>
        ))}
      </div>
      <div className="col-span-9 glass-panel border-[#D4AF37]/20 p-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <img src={selectedBoss.image} alt={selectedBoss.name}
              className="w-full aspect-square object-cover border border-[#D4AF37]/20 shadow-[0_0_30px_rgba(212,175,55,0.1)]" />
            {selectedBoss.spriteSheet && (
              <div className="mt-3">
                <div className="text-[8px] text-zinc-600 uppercase tracking-widest mb-1">Sprite Sheet</div>
                <img src={selectedBoss.spriteSheet} alt="sprite" className="w-full border border-zinc-900" />
              </div>
            )}
          </div>
          <div className="col-span-8 space-y-4">
            <div>
              <div className="text-[#D4AF37] text-xl font-black tracking-widest uppercase">{selectedBoss.name}</div>
              <div className="text-zinc-500 text-[10px] tracking-widest mt-1">{selectedBoss.title}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              {[
                { k: 'TIER',     v: selectedBoss.tier,    c: 'text-[#D4AF37]'    },
                { k: 'HP',       v: selectedBoss.hp.toLocaleString(), c: 'text-red-400' },
                { k: 'RTP',      v: selectedBoss.rtp,     c: 'text-cyan-400'     },
                { k: 'WEAKNESS', v: selectedBoss.weakness, c: 'text-violet-400'  },
                { k: 'THEME',    v: selectedBoss.theme,   c: 'text-zinc-300'     },
                { k: 'CREDITS L', v: selectedBoss.credits.left.toLocaleString(), c: 'text-[#D4AF37]' },
              ].map(r => (
                <div key={r.k} className="border-b border-zinc-900 pb-2 flex justify-between">
                  <span className="text-zinc-600 tracking-widest">{r.k}</span>
                  <span className={`font-bold ${r.c}`}>{r.v}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-2">Attacks</div>
              <div className="flex flex-wrap gap-2">
                {selectedBoss.attacks.map(a => (
                  <span key={a} className="px-2 py-1 border border-[#D4AF37]/30 text-[#D4AF37] text-[8px] tracking-widest">{a}</span>
                ))}
              </div>
            </div>
            <div className="border-t border-zinc-900 pt-4 text-zinc-500 text-[10px] leading-relaxed">{selectedBoss.lore}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel: OS Builder ────────────────────────────────────────────
function OSBuilderPanel({ onForge, isBuilding }) {
  const [osPartitions, setOsPartitions] = useState([{ id: 1, type: 'fish_shooting', units: 1 }]);
  const [genMode, setGenMode] = useState('night');
  const totalSeats = useMemo(() => osPartitions.reduce((acc, p) => {
    const g = UNIVERSAL_GAME_TYPES.find(x => x.id === p.type);
    return acc + (g ? g.seats * p.units : 0);
  }, 0), [osPartitions]);

  const grouped = Object.entries(CATEGORY_META).map(([cat, meta]) => ({
    cat, ...meta, types: UNIVERSAL_GAME_TYPES.filter(g => g.cat === cat),
  }));

  return (
    <div className="grid grid-cols-12 gap-6 animate-in fade-in max-w-7xl mx-auto w-full" data-testid="os-builder-panel">
      <div className="col-span-7 glass-panel border-[#D4AF37]/20 p-6 space-y-4 overflow-y-auto custom-scrollbar max-h-[70vh]">
        <h3 className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[4px] border-b border-[#D4AF37]/20 pb-3">Game Type Matrix</h3>
        {grouped.map(grp => (
          <div key={grp.cat}>
            <div className={`text-[8px] ${grp.color} uppercase tracking-[3px] mb-2 font-bold`}>{grp.label}</div>
            <div className="grid grid-cols-2 gap-2">
              {grp.types.map(g => {
                const sel = osPartitions[0]?.type === g.id;
                return (
                  <button key={g.id} onClick={() => setOsPartitions([{ id: 1, type: g.id, units: osPartitions[0]?.units || 1 }])}
                    className={`text-left p-3 border text-[9px] transition-all ${sel ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5 text-[#D4AF37]' : 'border-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}>
                    <div className="font-bold tracking-wider">{g.label}</div>
                    <div className="text-[8px] opacity-60 mt-0.5">{g.seats} seats</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="col-span-5 space-y-4">
        <div className="glass-panel border-[#D4AF37]/20 p-6 space-y-4">
          <h3 className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[4px] border-b border-[#D4AF37]/20 pb-3">Configuration</h3>
          <div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2">Units</div>
            <div className="flex gap-2">
              {[1,2,5,10].map(n => (
                <button key={n} onClick={() => setOsPartitions(p => [{ ...p[0], units: n }])}
                  className={`px-4 py-2 border text-[10px] font-bold transition-all ${osPartitions[0]?.units === n ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-zinc-800 text-zinc-600 hover:text-zinc-300'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2">Gen Mode</div>
            <div className="flex gap-2">
              {['night','turbo','stealth'].map(m => (
                <button key={m} onClick={() => setGenMode(m)}
                  className={`px-3 py-1.5 border text-[8px] uppercase tracking-widest transition-all ${genMode === m ? 'border-[#D4AF37]/50 text-[#D4AF37] bg-[#D4AF37]/5' : 'border-zinc-900 text-zinc-600 hover:text-zinc-300'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="border border-zinc-900 p-3 text-[10px] space-y-1">
            <div className="flex justify-between"><span className="text-zinc-600">TYPE</span><span className="text-[#D4AF37] font-bold">{osPartitions[0]?.type.toUpperCase().replace(/_/g,' ')}</span></div>
            <div className="flex justify-between"><span className="text-zinc-600">UNITS</span><span className="text-white">{osPartitions[0]?.units}</span></div>
            <div className="flex justify-between"><span className="text-zinc-600">TOTAL SEATS</span><span className="text-cyan-400 font-bold">{totalSeats}</span></div>
            <div className="flex justify-between"><span className="text-zinc-600">MODE</span><span className="text-zinc-300">{genMode.toUpperCase()}</span></div>
          </div>
          <button onClick={() => onForge(osPartitions, genMode)} disabled={isBuilding}
            className="w-full py-4 bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/20 font-bold uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[10px]"
            data-testid="forge-os-btn">
            {isBuilding ? '[ FORGING OS... ]' : '[ FORGE SOVEREIGN OS ]'}
          </button>
        </div>
        {/* Engine presets */}
        <div className="glass-panel border-[#D4AF37]/20 p-6">
          <h3 className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[4px] mb-3">Engine Presets</h3>
          <div className="space-y-2">
            {ENGINE_PRESETS.map(e => (
              <div key={e.id} className="p-3 border border-zinc-900 flex justify-between items-center">
                <div>
                  <div className="text-zinc-300 text-[10px] font-bold">{e.name}</div>
                  <div className="text-zinc-600 text-[8px] mt-0.5">{e.desc}</div>
                </div>
                <Code2 size={12} className="text-zinc-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel: Audio Forge ───────────────────────────────────────────
function AudioForgePanel({ assets }) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const tracks = assets.length > 0 ? assets : CANON_TRACKS;

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    try {
      await axios.post(`${API}/audio/generate`, { prompt, style: 'soulfire_dna' });
    } catch {}
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div className="grid grid-cols-12 gap-6 animate-in fade-in max-w-7xl mx-auto w-full" data-testid="audio-forge-panel">
      <div className="col-span-8 glass-panel border-[#D4AF37]/20 p-6">
        <h3 className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[4px] mb-4 border-b border-[#D4AF37]/20 pb-3">SoulFire DNA — Track Registry</h3>
        <div className="space-y-2">
          {tracks.map((t, i) => (
            <div key={t.id || i} className="flex items-center justify-between p-3 border border-zinc-900 bg-black/30">
              <div>
                <div className="text-zinc-200 text-[11px] font-bold">{t.title || t.name}</div>
                <div className="text-zinc-600 text-[8px] mt-0.5 font-mono">{t.id}</div>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                {t.bpm && <span className="text-zinc-500">{t.bpm} BPM · {t.key}</span>}
                <span className={`px-2 py-0.5 border text-[8px] font-bold ${
                  t.status === 'MASTERED' ? 'border-emerald-500/50 text-emerald-400' :
                  t.status === 'MIXING'   ? 'border-cyan-500/50 text-cyan-400' :
                                            'border-zinc-700 text-zinc-500'
                }`}>{t.status || t.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-4 glass-panel border-[#D4AF37]/20 p-6 space-y-4">
        <h3 className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[4px] border-b border-[#D4AF37]/20 pb-3">Audio Forge</h3>
        <div>
          <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2">Prompt</div>
          <textarea
            value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="Describe the track vibe..."
            className="input-dark h-24 resize-none focus:border-[#D4AF37]/50"
          />
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="w-full py-3 bg-[#D4AF37]/10 border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/20 font-bold uppercase tracking-widest transition-all disabled:opacity-40 text-[9px]">
          {generating ? '[ GENERATING... ]' : '[ FORGE TRACK ]'}
        </button>
      </div>
    </div>
  );
}

// ─── Panel: Sprite Registry ───────────────────────────────────────
function SpriteRegistryPanel() {
  return (
    <div className="grid grid-cols-12 gap-6 animate-in fade-in max-w-7xl mx-auto w-full" data-testid="sprite-panel">
      <div className="col-span-12 glass-panel border-[#D4AF37]/20 p-6">
        <h3 className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[4px] mb-4 border-b border-[#D4AF37]/20 pb-3">Game Backgrounds</h3>
        {GAME_BACKGROUNDS.map(bg => (
          <div key={bg.id} className="grid grid-cols-12 gap-6">
            <div className="col-span-3">
              <img src={bg.image} alt={bg.name} className="w-full border border-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]" />
            </div>
            <div className="col-span-9 space-y-3 text-[10px]">
              <div className="text-zinc-200 font-bold text-sm">{bg.name}</div>
              {[['ID', bg.id], ['TYPE', bg.type], ['RESOLUTION', bg.resolution], ['THEME', bg.theme]].map(([k,v]) => (
                <div key={k} className="flex gap-4 border-b border-zinc-900 pb-2">
                  <span className="text-zinc-600 w-28 shrink-0">{k}</span><span className="text-zinc-300">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="col-span-12 glass-panel border-[#D4AF37]/20 p-6">
        <h3 className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[4px] mb-4 border-b border-[#D4AF37]/20 pb-3">Boss Sprites</h3>
        <div className="flex gap-6">
          {BOSS_BESTIARY.map(b => (
            <div key={b.id} className="text-center">
              <img src={b.image} alt={b.name} className="w-24 h-24 object-cover border border-[#D4AF37]/20" />
              <div className="text-[8px] text-zinc-600 mt-2 tracking-widest uppercase">{b.name}</div>
              <div className="text-[7px] text-zinc-800 mt-0.5">{b.tier}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Panel: Revenue Pipelines ─────────────────────────────────────
function RevenuePipelinesPanel({ pipelines, heartbeats }) {
  const data = pipelines.length > 0 ? pipelines : EMPIRE_PIPELINES;
  const lanes = [...new Set(data.map(p => p.lane))];
  return (
    <div className="grid grid-cols-12 gap-6 animate-in fade-in max-w-7xl mx-auto w-full" data-testid="pipelines-panel">
      {lanes.map(lane => (
        <div key={lane} className="col-span-4 glass-panel border-indigo-500/20 p-6">
          <h3 className="text-indigo-400 text-[10px] font-black uppercase tracking-[4px] mb-4 border-b border-indigo-500/20 pb-3">
            Lane {lane} — {data.find(p => p.lane === lane)?.type || 'Pipeline'}
          </h3>
          <div className="space-y-3">
            {data.filter(p => p.lane === lane).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-black/40 border border-zinc-900">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${heartbeats[p.id] === 'active' ? 'bg-indigo-400 animate-pulse' : 'bg-zinc-700'}`} />
                  <span className="text-zinc-300 text-[10px]">{p.name}</span>
                </div>
                <span className="text-[8px] text-indigo-400 border border-indigo-500/30 px-2 py-0.5">{p.type}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Panel: Night Queue ───────────────────────────────────────────
function NightQueuePanel({ queue, onRemove, workerStatus }) {
  const fallback = [
    { id: 'J001', type: 'AUDIO_GEN',   status: 'pending',    preset: 'SOULFIRE_DNA' },
    { id: 'J002', type: 'SPRITE_BUILD', status: 'processing', preset: 'LOBO_NEGRO'  },
    { id: 'J003', type: 'RTP_AUDIT',   status: 'pending',    preset: 'FISH_ARENA'  },
    { id: 'J004', type: 'DEPLOY',      status: 'completed',  preset: 'cultura-fe'  },
  ];
  const jobs = queue.length > 0 ? queue : fallback;

  return (
    <div className="grid grid-cols-12 gap-6 animate-in fade-in max-w-7xl mx-auto w-full" data-testid="queue-panel">
      {/* Worker status */}
      <div className="col-span-12 grid grid-cols-4 gap-4">
        {[
          { k: 'Active Jobs',    v: workerStatus.active_jobs    || 2,  c: 'text-cyan-400'    },
          { k: 'Pending',        v: workerStatus.blocked_jobs   || 5,  c: 'text-amber-400'   },
          { k: 'Completed',      v: workerStatus.completed_jobs || 4,  c: 'text-emerald-400' },
          { k: 'Total',          v: workerStatus.total_jobs     || 11, c: 'text-white'       },
        ].map(s => (
          <div key={s.k} className="glass-panel p-4 border-zinc-900/50">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">{s.k}</div>
            <div className={`text-2xl font-black ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="col-span-12 glass-panel border-zinc-800/50 p-6">
        <h3 className="text-zinc-400 text-[10px] font-black uppercase tracking-[4px] mb-4 border-b border-zinc-800 pb-3">Job Queue</h3>
        <div className="space-y-2">
          {jobs.map(j => (
            <div key={j.id} className="flex items-center justify-between p-4 border border-zinc-900 bg-black/30">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${
                  j.status === 'processing' ? 'bg-cyan-400 animate-pulse' :
                  j.status === 'completed'  ? 'bg-emerald-400' :
                  j.status === 'failed'     ? 'bg-red-400' : 'bg-amber-400'
                }`} />
                <div>
                  <div className="text-zinc-200 text-[11px] font-bold">{j.preset || j.name || j.id}</div>
                  <div className="text-zinc-600 text-[8px] mt-0.5">{j.type} · {j.id}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 border text-[8px] font-bold uppercase ${
                  j.status === 'processing' ? 'border-cyan-500/50 text-cyan-400' :
                  j.status === 'completed'  ? 'border-emerald-500/50 text-emerald-400' :
                  j.status === 'failed'     ? 'border-red-500/50 text-red-400' :
                                              'border-amber-500/50 text-amber-400'
                }`}>{j.status}</span>
                {j.status !== 'completed' && (
                  <button onClick={() => onRemove(j.id)} className="text-zinc-700 hover:text-red-400 transition-colors text-[10px]">✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Panel: System Core ───────────────────────────────────────────
function SystemCorePanel() {
  const [toggles, setToggles] = useState({ neuralFirewall: true, stealthMesh: false, quantumBridge: true, autoAudit: true });
  const [firewall, setFirewall] = useState(85);

  return (
    <div className="grid grid-cols-12 gap-6 animate-in fade-in max-w-7xl mx-auto w-full" data-testid="system-core-panel">
      <div className="col-span-6 glass-panel border-[#8B0000]/30 p-6 space-y-4">
        <h3 className="text-red-500 text-[10px] font-black uppercase tracking-[4px] border-b border-[#8B0000]/30 pb-3">System Toggles</h3>
        {Object.entries(toggles).map(([k, v]) => (
          <div key={k} className="flex justify-between items-center p-3 border border-zinc-900">
            <span className="text-zinc-300 text-[10px] uppercase tracking-widest">{k.replace(/([A-Z])/g, ' $1')}</span>
            <button onClick={() => setToggles(t => ({ ...t, [k]: !t[k] }))}
              className={`w-12 h-6 border transition-all flex items-center px-1 ${v ? 'border-red-500/50 bg-red-900/30 justify-end' : 'border-zinc-800 bg-black justify-start'}`}>
              <span className={`w-4 h-4 ${v ? 'bg-red-400' : 'bg-zinc-700'}`} />
            </button>
          </div>
        ))}
        <div>
          <div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-2">Neural Firewall Strength: {firewall}%</div>
          <input type="range" min={0} max={100} value={firewall} onChange={e => setFirewall(+e.target.value)}
            className="w-full" style={{ accentColor: '#8B0000' }} />
        </div>
      </div>
      <div className="col-span-6 glass-panel border-[#8B0000]/30 p-6">
        <h3 className="text-red-500 text-[10px] font-black uppercase tracking-[4px] mb-4 border-b border-[#8B0000]/30 pb-3">SLA-113 Core Config</h3>
        <div className="space-y-2 text-[10px]">
          {[
            ['HOUSE EDGE',        '5%',                  'text-[#D4AF37]'  ],
            ['RTP RANGE',         '90% – 98%',           'text-cyan-400'   ],
            ['GOVERNANCE MODS',   '5 / 5 ACTIVE',        'text-emerald-400'],
            ['ANTI-ADDICTION',    'ACTIVE',              'text-emerald-400'],
            ['ROYALTY — ARTIST',  '70%',                 'text-[#D4AF37]'  ],
            ['ROYALTY — PLATFORM','15%',                 'text-zinc-300'   ],
            ['ROYALTY — MODELS',  '10%',                 'text-zinc-300'   ],
            ['ROYALTY — INFRA',   '5%',                  'text-zinc-300'   ],
            ['JWT SECRET',        'SET ✓',               'text-emerald-400'],
            ['DB',                'Lyrica3-pro',         'text-zinc-300'   ],
            ['PROJECT',           'disco-amphora-490606','text-zinc-600'   ],
            ['BUILD REV',         'v17',                 'text-[#D4AF37]'  ],
          ].map(([k,v,c]) => (
            <div key={k} className="flex justify-between border-b border-zinc-900 pb-2">
              <span className="text-zinc-600 tracking-widest">{k}</span>
              <span className={`font-bold ${c}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Panel: Universes ─────────────────────────────────────────────
function UniversesPanel({ universes }) {
  const canon = universes.length > 0 ? universes : [
    { id: 'U0', name: 'Empire Zero',         status: 'live',    engine_count: 9,  pipeline_count: 9  },
    { id: 'U1', name: 'Southern Lifestyle',  status: 'live',    engine_count: 8,  pipeline_count: 8  },
    { id: 'U2', name: 'Cultura Underground', status: 'live',    engine_count: 5,  pipeline_count: 5  },
    { id: 'U3', name: 'Barrio Tech',         status: 'staging', engine_count: 4,  pipeline_count: 4  },
    { id: 'U4', name: 'SL Audio',            status: 'live',    engine_count: 6,  pipeline_count: 6  },
    { id: 'U5', name: 'Arcade SGV',          status: 'staging', engine_count: 7,  pipeline_count: 7  },
  ];
  return (
    <div className="grid grid-cols-3 gap-4 animate-in fade-in max-w-7xl mx-auto w-full" data-testid="universes-panel">
      {canon.map(u => (
        <div key={u.id} className="glass-panel border-cyan-500/20 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-cyan-400 text-[9px] font-bold tracking-[3px] uppercase">{u.id}</div>
              <div className="text-zinc-200 font-bold mt-1">{u.name}</div>
            </div>
            <span className={`px-2 py-0.5 border text-[7px] font-bold uppercase ${u.status === 'live' ? 'border-emerald-500/50 text-emerald-400' : 'border-amber-500/50 text-amber-400'}`}>
              {u.status}
            </span>
          </div>
          <div className="space-y-2 text-[10px]">
            <div className="flex justify-between border-b border-zinc-900 pb-1">
              <span className="text-zinc-600">Engines</span><span className="text-cyan-400 font-bold">{u.engine_count}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-1">
              <span className="text-zinc-600">Pipelines</span><span className="text-[#D4AF37] font-bold">{u.pipeline_count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Placeholder for remaining panels ────────────────────────────
function PlaceholderPanel({ tab, theme }) {
  return (
    <div className="flex-1 flex items-center justify-center animate-in fade-in">
      <div className="text-center space-y-3">
        <div className={`text-[10px] ${theme.text} font-black uppercase tracking-[6px]`}>{tab}</div>
        <div className="text-zinc-700 text-[9px] tracking-widest">Module loading — SLA-113 Foundry</div>
      </div>
    </div>
  );
}

// ─── Main SLA113Page ──────────────────────────────────────────────
export default function SLA113Page({ user, onLogout }) {
  const navigate = useNavigate();

  const _qp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const _qpTab  = (_qp.get('tab') || '').replace(/-/g,' ').toUpperCase();
  const _qpPart = (_qp.get('p') || 'factory').toLowerCase();

  const [partition, setPartition]   = useState(['factory','empire','foundry','vault'].includes(_qpPart) ? _qpPart : 'factory');
  const [activeTab, setActiveTab]   = useState(_qpTab || 'FRONTLINE');
  const [revenue]                   = useState(142500);
  const [isCritical, setIsCritical] = useState(false);
  const [humanMode, setHumanMode]   = useState(false);

  // API state
  const [stats, setStats]           = useState({});
  const [projects, setProjects]     = useState([]);
  const [pipelines, setPipelines]   = useState([]);
  const [pipelineHeartbeats, setPipelineHeartbeats] = useState({});
  const [queue, setQueue]           = useState([]);
  const [workerStatus, setWorkerStatus] = useState({ active_jobs:0, blocked_jobs:0, completed_jobs:0, total_jobs:0 });
  const [universes, setUniverses]   = useState([]);
  const [audioAssets, setAudioAssets] = useState([]);
  const [isBuilding, setIsBuilding] = useState(false);

  // White label
  const [whiteLabelName, setWhiteLabelName] = useState('');
  const [whiteLabelLogs, setWhiteLabelLogs] = useState([]);
  const [isForgingTenant, setIsForgingTenant] = useState(false);

  // AI Terminal
  const [aiInput, setAiInput]       = useState('');
  const [aiOutput, setAiOutput]     = useState('> SYSTEM_INITIALIZED. READY FOR DIRECTIVE.');
  const [isThinking, setIsThinking] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(false);

  const authHeaders = useMemo(() => ({
    headers: { Authorization: `Bearer ${user?.token}` }
  }), [user]);

  const currentTheme     = THEMES[partition];
  const activeNavItems   = ALL_NAV_ITEMS.filter(i => i.partition === partition);
  const processingCount  = queue.filter(q => ['processing','pending'].includes(q.status)).length;

  // Fetch
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, projRes, pipRes, qRes, uRes, audioRes] = await Promise.all([
        axios.get(`${API}/stats`,       authHeaders).catch(() => ({ data: {} })),
        axios.get(`${API}/projects`,    authHeaders).catch(() => ({ data: { projects: [] } })),
        axios.get(`${API}/pipelines`,   authHeaders).catch(() => ({ data: { pipelines: [] } })),
        axios.get(`${API}/jobs`,        authHeaders).catch(() => ({ data: { jobs: [] } })),
        axios.get(`${API}/universes`,   authHeaders).catch(() => ({ data: { universes: [] } })),
        axios.get(`${API}/audio/assets`,authHeaders).catch(() => ({ data: { assets: [] } })),
      ]);
      setStats(statsRes.data || {});
      setProjects(projRes.data.projects || []);
      setPipelines(pipRes.data.pipelines || []);
      setQueue(qRes.data.jobs || []);
      setUniverses(uRes.data.universes || []);
      setAudioAssets(audioRes.data.assets || []);
    } catch {}
  }, [authHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Pipeline heartbeats
  useEffect(() => {
    const t = setInterval(() => {
      const h = {};
      pipelines.forEach(p => { h[p.id] = Math.random() > 0.7 ? 'active' : 'idle'; });
      setPipelineHeartbeats(h);
    }, 2000);
    return () => clearInterval(t);
  }, [pipelines]);

  // Night Queue auto-poll
  useEffect(() => {
    if (activeTab !== 'NIGHT QUEUE') return;
    const t = setInterval(async () => {
      fetchData();
      try {
        const w = await axios.get(`${API}/worker/status`, authHeaders);
        setWorkerStatus(w.data);
      } catch {}
    }, 3000);
    return () => clearInterval(t);
  }, [activeTab, fetchData, authHeaders]);

  const handlePartitionChange = (p) => {
    setPartition(p);
    setActiveTab(ALL_NAV_ITEMS.find(i => i.partition === p)?.id || '');
  };

  const handleForge = async (osPartitions, genMode) => {
    setIsBuilding(true);
    try {
      const gameType = osPartitions[0]?.type || 'fish_shooting';
      await axios.post(`${API}/projects`, { name: `OS_BUILD_${Date.now()}`, game_type: gameType, theme: 'sovereign', target_platform: 'both' }, authHeaders);
      await axios.post(`${API}/jobs`, { preset: gameType.toUpperCase(), priority: 'high' }, authHeaders);
      await fetchData();
    } catch {}
    setIsBuilding(false);
    handlePartitionChange('vault');
    setActiveTab('NIGHT QUEUE');
  };

  const handleMintWhiteLabel = async () => {
    if (!whiteLabelName || isForgingTenant) return;
    setIsForgingTenant(true);
    setWhiteLabelLogs([`> Initiating Sovereign Mint for: ${whiteLabelName.toUpperCase()}`]);
    try {
      const subdomain = whiteLabelName.toLowerCase().replace(/\s+/g,'-') + '.empire1.cloud';
      setWhiteLabelLogs(p => [...p, '> Validating Root Authority... [OK]']);
      await new Promise(r => setTimeout(r, 600));
      setWhiteLabelLogs(p => [...p, '> Cloning SLA113 core foundries...']);
      const res = await axios.post(`${API}/tenants`, { name: whiteLabelName.toUpperCase(), subdomain }, authHeaders);
      await new Promise(r => setTimeout(r, 400));
      setWhiteLabelLogs(p => [...p, `> Done. Instance: ${res.data?.subdomain || subdomain} [ACTIVE]`]);
      await fetchData();
    } catch (e) {
      setWhiteLabelLogs(p => [...p, `> [ERROR] ${e?.response?.data?.detail || e.message}`]);
    }
    setIsForgingTenant(false);
  };

  const removeJob = async (id) => {
    try {
      await axios.delete(`${API}/jobs/${id}`, authHeaders);
      setQueue(q => q.filter(j => j.id !== id));
    } catch {}
  };

  const askAI = async () => {
    if (!aiInput.trim()) return;
    setIsThinking(true);
    setTerminalExpanded(true);
    const cmd = aiInput; setAiInput('');
    setAiOutput(prev => prev + `\n> [OPERATOR ${user?.handle?.toUpperCase()}]: ${cmd}`);
    try {
      const res = await axios.post(`${API}/terminal`, { command: cmd, session_id: 'main' }, authHeaders);
      setAiOutput(prev => prev + `\n${res.data.response}`);
    } catch (e) {
      setAiOutput(prev => prev + `\n> [ERROR] Overseer unreachable: ${e.message}`);
    }
    setIsThinking(false);
  };

  const renderPanel = () => {
    const t = activeTab;
    const p = partition;
    if (p === 'factory' && t === 'FRONTLINE')         return <FrontlinePanel stats={stats} projects={projects} />;
    if (p === 'factory' && t === 'UNIVERSES')          return <UniversesPanel universes={universes} />;
    if (p === 'factory' && t === 'WHITE LABEL MINT')   return (
      <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto w-full animate-in fade-in" data-testid="white-label-panel">
        <div className="col-span-4 glass-panel border-cyan-500/20 p-8 space-y-6">
          <h3 className="text-cyan-400 text-xs font-black uppercase tracking-[4px] border-b border-cyan-500/20 pb-4">Instance Minting</h3>
          <div>
            <label className="text-[10px] text-zinc-500 uppercase block mb-2">Instance Name</label>
            <input value={whiteLabelName} onChange={e => setWhiteLabelName(e.target.value)} placeholder="e.g. BARRIO ARCADE" className="input-dark focus:border-cyan-500 uppercase" />
          </div>
          <button onClick={handleMintWhiteLabel} disabled={isForgingTenant}
            className="w-full py-4 bg-cyan-900/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black font-bold uppercase tracking-widest transition-all">
            {isForgingTenant ? 'Forging...' : 'Execute Deploy'}
          </button>
        </div>
        <div className="col-span-8 glass-panel border-cyan-500/20 tech-border p-8 font-mono text-[11px] text-zinc-400 h-[400px] overflow-y-auto custom-scrollbar bg-black/80">
          {whiteLabelLogs.map((l, i) => <div key={i} className="mb-3">{l}</div>)}
          {whiteLabelLogs.length === 0 && <div className="opacity-30 animate-pulse uppercase tracking-[4px]">Awaiting Deployment Directive...</div>}
        </div>
      </div>
    );
    if (p === 'empire' && t === 'BESTIARY')            return <BestiaryPanel />;
    if (p === 'empire' && t === 'REVENUE PIPELINES')   return <RevenuePipelinesPanel pipelines={pipelines} heartbeats={pipelineHeartbeats} />;
    if (p === 'empire' && t === 'SLOT SYMBOLS')        return (
      <div className="grid grid-cols-3 gap-4 max-w-7xl mx-auto w-full animate-in fade-in">
        {['SYM_AZTEC_SUN','SYM_LOBO','SYM_OBSIDIAN','SYM_GOLD_GLYPH','SYM_COPAL','SYM_MARIGOLD'].map((id,i) => {
          const tiers = ['WILD','SCATTER','HIGH','HIGH','MID','LOW'];
          const names = ['Aztec Sun','Lobo Negro','Obsidian Blade','Gold Glyph','Copal Smoke','Marigold'];
          const mults = ['10x','8x','5x','4x','3x','2x'];
          const tierColors = { WILD:'text-[#D4AF37]', SCATTER:'text-cyan-400', HIGH:'text-violet-400', MID:'text-amber-400', LOW:'text-zinc-500' };
          return (
            <div key={id} className="glass-panel border-indigo-500/20 p-6">
              <div className="flex justify-between items-center mb-3">
                <span className={`font-bold text-[11px] tracking-widest ${tierColors[tiers[i]]}`}>{names[i]}</span>
                <span className={`px-2 py-0.5 border text-[8px] font-bold ${tierColors[tiers[i]]} border-current/30`}>{tiers[i]}</span>
              </div>
              <div className="text-[9px] text-zinc-500">{id}</div>
              <div className={`text-2xl font-black mt-2 ${tierColors[tiers[i]]}`}>{mults[i]}</div>
            </div>
          );
        })}
      </div>
    );
    if (p === 'foundry' && t === 'OS BUILDER')         return <OSBuilderPanel onForge={handleForge} isBuilding={isBuilding} />;
    if (p === 'foundry' && t === 'AUDIO FORGE')        return <AudioForgePanel assets={audioAssets} />;
    if (p === 'foundry' && t === 'SPRITE REGISTRY')    return <SpriteRegistryPanel />;
    if (p === 'vault'   && t === 'SYSTEM CORE')        return <SystemCorePanel />;
    if (p === 'vault'   && t === 'NIGHT QUEUE')        return <NightQueuePanel queue={queue} onRemove={removeJob} workerStatus={workerStatus} />;
    if (p === 'vault'   && t === 'COMPLIANCE')         return (
      <div className="max-w-7xl mx-auto w-full animate-in fade-in">
        <div className="glass-panel border-[#8B0000]/30 p-8">
          <h3 className="text-red-500 text-[10px] font-black uppercase tracking-[4px] mb-6 border-b border-[#8B0000]/30 pb-3">Compliance & Governance</h3>
          {[
            ['HOUSE EDGE','5% — COMPLIANT','text-emerald-400'],['RTP FLOOR','90% — ENFORCED','text-emerald-400'],
            ['RTP CEILING','98% — ENFORCED','text-emerald-400'],['ANTI-ADDICTION','ACTIVE','text-emerald-400'],
            ['AGE GATE','21+ REQUIRED','text-[#D4AF37]'],['JURISDICTIONS','CA / NV / TX','text-zinc-300'],
            ['CANON ENFORCER','ARMED','text-cyan-400'],['AUDIT REV','SLA-113 v2.1','text-zinc-300'],
            ['GOVERNANCE MODS','5 / 5 ACTIVE','text-emerald-400'],
          ].map(([k,v,c]) => (
            <div key={k} className="flex justify-between items-center p-3 border-b border-zinc-900">
              <span className="text-zinc-500 text-[10px] tracking-widest uppercase">{k}</span>
              <span className={`font-bold text-[10px] ${c}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    );
    if (p === 'vault' && t === 'MATRIX PARAMS') return (
      <div className="max-w-7xl mx-auto w-full animate-in fade-in">
        <div className="glass-panel border-[#8B0000]/30 p-8">
          <h3 className="text-red-500 text-[10px] font-black uppercase tracking-[4px] mb-6 border-b border-[#8B0000]/30 pb-3">Matrix Parameters</h3>
          {[
            ['ROYALTY — ARTIST','70%','text-[#D4AF37]'],['ROYALTY — PLATFORM','15%','text-zinc-300'],
            ['ROYALTY — MODEL OWNERS','10%','text-zinc-300'],['ROYALTY — INFRA','5%','text-zinc-300'],
            ['CREDIT TOKEN','SL_CR','text-cyan-400'],['WALLET FORMAT','0x hex','text-zinc-300'],
            ['LEDGER','empire1-ledger','text-indigo-400'],
          ].map(([k,v,c]) => (
            <div key={k} className="flex justify-between items-center p-3 border-b border-zinc-900">
              <span className="text-zinc-500 text-[10px] tracking-widest uppercase">{k}</span>
              <span className={`font-bold text-[10px] ${c}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    );
    return <PlaceholderPanel tab={t} theme={currentTheme} />;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="sla113-scope flex h-screen w-full bg-[#050505] text-zinc-300 font-mono text-sm overflow-hidden select-none" data-testid="sla113-page">

        {/* ── Sidebar ── */}
        <aside className={`w-72 border-r bg-[#050505] flex flex-col shadow-2xl z-20 shrink-0 transition-colors duration-500 ${currentTheme.border}/30`} data-testid="sla113-sidebar">
          {/* Logo */}
          <div className={`p-6 border-b transition-colors duration-500 ${currentTheme.border}/30`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 border ${currentTheme.border} flex items-center justify-center`}>
                <Flame className={currentTheme.text} size={18} />
              </div>
              <div>
                <h1 className="text-white font-bold tracking-widest text-sm uppercase leading-none">
                  SLA-113 <span className="opacity-20 mx-1">//</span> <span className={currentTheme.text}>{currentTheme.label}</span>
                </h1>
                <p className="text-zinc-500 text-[9px] mt-1 tracking-widest uppercase">{currentTheme.sub}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 space-y-1 overflow-y-auto custom-scrollbar" data-testid="sla113-nav">
            {activeNavItems.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 uppercase tracking-widest text-[10px] transition-all group ${
                    activeTab === item.id
                      ? `${currentTheme.bgAlpha} ${currentTheme.text} border-l-2 ${currentTheme.border}`
                      : 'text-zinc-500 hover:text-zinc-300 border-l-2 border-transparent'
                  }`}
                  data-testid={`nav-${item.id.toLowerCase().replace(/\s/g,'-')}`}>
                  <div className="flex items-center gap-3">
                    <Icon size={14} className={activeTab === item.id ? currentTheme.text : 'group-hover:text-zinc-300'} />
                    {item.id}
                  </div>
                  {item.id === 'NIGHT QUEUE' && processingCount > 0 && (
                    <span className={`w-2 h-2 rounded-full ${currentTheme.bg} animate-pulse`} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Heartbeat */}
          <div className={`p-4 border-t transition-colors duration-500 ${currentTheme.border}/30`}>
            <AdminHeartbeat processingCount={processingCount} theme={currentTheme} />
          </div>

          {/* Logout */}
          <button onClick={onLogout}
            className="m-4 p-3 border border-zinc-800 text-zinc-500 text-[9px] uppercase tracking-widest hover:text-red-400 hover:border-red-900 transition-all"
            data-testid="logout-btn">
            [ LOGOUT // {user?.handle?.toUpperCase()} ]
          </button>
        </aside>

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,_rgba(255,255,255,0.01)_0%,_transparent_70%)] z-10">

          {/* Header */}
          <header className="flex flex-wrap gap-4 items-center justify-between bg-[#050505]/95 border-b border-zinc-900/50 px-8 py-3 z-50 shrink-0" data-testid="sla113-header">
            <div>
              <div className="text-[8px] text-zinc-500 uppercase tracking-widest">Net Revenue</div>
              <div className="text-lg font-black text-white">${revenue.toLocaleString()}</div>
            </div>
            <div className="flex gap-2 items-center">
              {['factory','empire','foundry','vault'].map(p => (
                <button key={p} onClick={() => handlePartitionChange(p)}
                  className={`px-4 py-2 text-[9px] font-bold border transition-all uppercase tracking-widest ${
                    partition === p
                      ? `${THEMES[p].bgAlpha} ${THEMES[p].text} ${THEMES[p].border}`
                      : 'border-zinc-800/50 text-zinc-600 hover:text-zinc-400 bg-black/50'
                  }`}
                  data-testid={`partition-${p}`}>
                  {THEMES[p].label}
                </button>
              ))}
              <div className="h-6 w-px bg-zinc-800 mx-2" />
              <button onClick={() => setHumanMode(h => !h)}
                className={`px-4 py-2 border text-[9px] font-bold transition-all ${humanMode ? currentTheme.border + ' ' + currentTheme.text : 'border-zinc-800 text-zinc-500'}`}
                data-testid="mode-toggle">
                {humanMode ? 'HUMAN' : 'TECH'}
              </button>
              <button onClick={() => setIsCritical(true)}
                className="p-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors" data-testid="critical-btn">
                <TriangleAlert size={14} />
              </button>
            </div>
          </header>

          {/* Panel content */}
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative flex flex-col">
            <div className="scanline" />
            {renderPanel()}
          </main>

          {/* AI Terminal */}
          <div className={`border-t border-zinc-900 transition-all duration-300 shrink-0 ${terminalExpanded ? 'h-48' : 'h-12'}`}>
            <div className="flex items-center gap-3 px-4 py-2 border-b border-zinc-900 bg-black/80">
              <Terminal size={10} className="text-zinc-600" />
              <span className="text-[9px] text-zinc-600 uppercase tracking-widest">AI Overseer Terminal</span>
              {isThinking && <span className={`text-[8px] ${currentTheme.text} animate-pulse`}>thinking...</span>}
              <div className="flex-1" />
              <button onClick={() => setTerminalExpanded(e => !e)} className="text-zinc-700 hover:text-zinc-400 text-[10px]">
                {terminalExpanded ? '▼' : '▲'}
              </button>
            </div>
            {terminalExpanded && (
              <div className="flex flex-col h-[calc(100%-33px)]">
                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar text-[10px] text-zinc-500 font-mono whitespace-pre-wrap">{aiOutput}</div>
                <div className="flex border-t border-zinc-900">
                  <span className={`px-3 py-2 text-[10px] ${currentTheme.text}`}>›</span>
                  <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && askAI()}
                    placeholder="Enter directive..."
                    className="flex-1 bg-transparent text-zinc-300 text-[11px] outline-none py-2 pr-4 placeholder-zinc-800" />
                  <button onClick={askAI} className={`px-4 text-[9px] ${currentTheme.text} border-l border-zinc-900`}>SEND</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Critical Alert Modal */}
        {isCritical && (
          <div className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center">
            <div className="glass-panel border-red-500/50 p-8 max-w-md w-full tech-border-red space-y-4">
              <div className="flex items-center gap-3">
                <TriangleAlert className="text-red-500" size={20} />
                <span className="text-red-500 font-black uppercase tracking-widest text-sm">Critical Alert</span>
              </div>
              <p className="text-zinc-400 text-[11px]">System integrity check required. All operator actions logged.</p>
              <button onClick={() => setIsCritical(false)}
                className="w-full py-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 uppercase tracking-widest text-[10px] font-bold transition-all">
                Acknowledge
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
