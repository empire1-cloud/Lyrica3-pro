import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Cpu, Layers, Globe, Shield, Network, Zap, Building2,
  Users, ChevronRight, ChevronDown, BarChart3, Settings2,
  Mic2, Gamepad2, Music2, Brain, Activity, Lock, ArrowRight,
  Database, Code2, Bell, Calendar, FileText, Search, Link2,
  Terminal, CheckSquare, TrendingUp, Package, Briefcase,
  Radio, Headphones, Volume2, Sparkles, Star, BookOpen,
  Tag, DollarSign, Puzzle, Server
} from 'lucide-react';

// ─── Data ────────────────────────────────────────────────────────────────────

const EMPIRE_CORE = [
  { label: 'Identity & Brand Enforcement',  icon: Shield },
  { label: 'Operator Permissions & Roles',  icon: Lock },
  { label: 'Billing & Subscription Engine', icon: DollarSign },
  { label: 'Client Portal Framework',       icon: Globe },
  { label: 'Enterprise UI Shell',           icon: Layers },
];

const PIPELINES = [
  { n: '01', label: 'Automation Engine',         icon: Zap },
  { n: '02', label: 'Workflow Orchestrator',      icon: Settings2 },
  { n: '03', label: 'CRM Engine',                 icon: Users },
  { n: '04', label: 'Client Portal Generator',    icon: Globe },
  { n: '05', label: 'Dashboard Builder',          icon: BarChart3 },
  { n: '06', label: 'Data Transformation Engine', icon: Database },
  { n: '07', label: 'API Factory',                icon: Code2 },
  { n: '08', label: 'AI Agent Builder',           icon: Brain },
  { n: '09', label: 'Knowledge Base Engine',      icon: Search },
  { n: '10', label: 'Form & Intake Engine',       icon: FileText },
  { n: '11', label: 'Scheduling Engine',          icon: Calendar },
  { n: '12', label: 'Notification Engine',        icon: Bell },
  { n: '13', label: 'Document Automation',        icon: FileText },
  { n: '14', label: 'Analytics Engine',           icon: TrendingUp },
  { n: '15', label: 'White-Label SaaS Generator', icon: Package },
  { n: '16', label: 'Multi-Tenant Management',    icon: Building2 },
  { n: '17', label: 'Compliance & Audit Layer',   icon: CheckSquare },
  { n: '18', label: 'Integration Hub',            icon: Link2 },
  { n: '19', label: 'Operator Command Center',    icon: Terminal },
];

const SLA113_ENGINES = [
  { label: 'Terminal & Shell Generator',       desc: 'Generates OS terminals and interactive shells for every universe layer.',     icon: Terminal },
  { label: 'Build Foundry',                    desc: 'Manufactures OSes, world systems, and engine builds on contract.',            icon: Cpu },
  { label: 'Narrative Seed & Canon Enforcement', desc: 'Seeds universe lore and enforces canon policy across all creative outputs.', icon: BookOpen },
  { label: 'Identity & Tone Enforcement',      desc: 'Locks voice, character, and brand identity across every engine output.',     icon: Shield },
  { label: 'Pricing Ledger / Economy Engine',  desc: 'Manages royalties, asset pricing, and economy rules platform-wide.',         icon: DollarSign },
  { label: 'Extraction & Add-On Pipelines',    desc: 'Modular extraction layer for custom add-ons and third-party integrations.',  icon: Puzzle },
];

const SLA113_INFRA = [
  { label: 'Engine APIs for EmpireOne', icon: Network },
  { label: 'Engine APIs for Southern',  icon: Server },
];

const AI_MODELS = [
  { label: 'GPT-5.2',            color: 'from-green-500 to-emerald-600',  status: 'ACTIVE' },
  { label: 'Claude Sonnet 4.5',  color: 'from-amber-500 to-orange-600',   status: 'ACTIVE' },
  { label: 'Gemini 3 Flash',     color: 'from-blue-500 to-cyan-600',      status: 'ACTIVE' },
  { label: 'Routing Engine',     color: 'from-purple-500 to-violet-600',  status: 'ROUTING' },
  { label: 'Canon Enforcer',     color: 'from-rose-500 to-red-600',       status: 'ENFORCING' },
  { label: 'Format Normalizer',  color: 'from-slate-500 to-gray-600',     status: 'ACTIVE' },
  { label: 'Drift Monitor',      color: 'from-yellow-500 to-amber-600',   status: 'WATCHING' },
];

const SOUTHERN_LAYERS = [
  { label: 'World Shells',                      icon: Globe },
  { label: 'Emotional Systems',                 icon: Activity },
  { label: 'Player Identity Systems',           icon: Users },
  { label: 'Loyalty & Progression',             icon: Star },
  { label: 'Visual / Narrative Pipelines (29+)', icon: Layers },
];

const SL_AUDIO = [
  { label: 'Sound Engine Integration',  icon: Volume2 },
  { label: 'Emotional Audio Layer',     icon: Music2 },
  { label: 'SFX Library (~87 sounds)',  icon: Headphones },
  { label: 'Music / Atmosphere Systems', icon: Radio },
  { label: 'Audio Canon Enforcement',   icon: Shield },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function LayerTag({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-block text-xs font-mono font-bold px-2 py-0.5 rounded border ${color}`}>
      {label}
    </span>
  );
}

function SectionHeader({
  layerLabel, layerColor, title, sub,
}: { layerLabel: string; layerColor: string; title: string; sub: string }) {
  return (
    <div className="mb-10">
      <LayerTag label={layerLabel} color={layerColor} />
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white">{title}</h2>
      <p className="mt-1 text-neutral-400 text-sm">{sub}</p>
    </div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function TopNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-800/50 bg-neutral-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <span className="font-black tracking-widest text-sm bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-rose-200">
            EMPIRE ONE
          </span>
          <span className="hidden sm:block text-xs font-mono text-neutral-600 ml-1">empire1.cloud</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://lyrica3.com"
            className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Mic2 className="w-3.5 h-3.5" /> Lyrica 3
          </a>
          <a
            href="/app"
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold px-4 py-1.5 rounded-lg transition-colors"
          >
            Studio <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── Hybrid AI Banner ────────────────────────────────────────────────────────

function HybridAIBanner() {
  return (
    <div className="border-b border-neutral-800/60 bg-neutral-900/50 py-3 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="text-xs font-mono text-purple-400 tracking-widest uppercase">
            Hybrid AI Stack — Intelligence Layer (Horizontal)
          </span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>
        <div className="flex flex-wrap gap-2">
          {AI_MODELS.map((m) => (
            <div
              key={m.label}
              className="flex items-center gap-2 bg-neutral-800/50 border border-neutral-700/30 rounded-lg px-3 py-1"
            >
              <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${m.color}`} />
              <span className="text-xs font-medium text-neutral-300">{m.label}</span>
              <span className="text-xs font-mono text-neutral-500">{m.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative pt-24 pb-20 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <LayerTag label="L0 — ENTERPRISE GOVERNANCE & INDUSTRIAL ROOT" color="border-amber-500/40 text-amber-400" />
          <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tight leading-none">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-white to-amber-100">
              Empire One
            </span>
          </h1>
          <p className="mt-5 text-lg text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            The governance and industrial root of a federated universe constellation.
            Powered by SLA-113's engine factory. Expressed through Southern OS.
            Delivered as infinite-scale white-label B2B SaaS.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-400">
            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" />19 Business Pipelines</span>
            <span className="flex items-center gap-2"><Cpu className="w-4 h-4 text-violet-400" />SLA-113 Engine Factory</span>
            <span className="flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" />Southern OS · 29+ Pipelines</span>
            <span className="flex items-center gap-2"><Brain className="w-4 h-4 text-purple-400" />3-Model AI Stack</span>
            <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-green-400" />Infinite Tenants</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Architecture Tree ───────────────────────────────────────────────────────

function ArchitectureTree() {
  const rows = [
    {
      indent: 0,
      badge: 'L0',
      badgeColor: 'text-amber-400 border-amber-500/40',
      bg: 'border-amber-500/30 bg-amber-500/5',
      title: 'Empire One',
      sub: 'Governance & Industrial Root · 19-Pipeline SaaS · White-Label · Partner Network',
    },
    {
      indent: 1,
      badge: 'L1',
      badgeColor: 'text-violet-400 border-violet-500/40',
      bg: 'border-violet-500/30 bg-violet-500/5',
      title: 'SLA-113',
      sub: 'Engine Factory · OS Foundry · Logic Manufacturer · Shared Infrastructure',
    },
    {
      indent: 2,
      badge: 'L2',
      badgeColor: 'text-cyan-400 border-cyan-500/40',
      bg: 'border-cyan-500/30 bg-cyan-500/5',
      title: 'Southern Lifestyle Arcade',
      sub: 'Cultural OS · 29+ Pipelines · Player Experience · Universe Manufacturer',
    },
    {
      indent: 3,
      badge: 'L3',
      badgeColor: 'text-emerald-400 border-emerald-500/40',
      bg: 'border-emerald-500/30 bg-emerald-500/5',
      title: 'SL Audio',
      sub: 'Audio OS of Southern · ~87 SFX · Emotional Audio · Canon Enforcement',
    },
    {
      indent: 3,
      badge: 'L3',
      badgeColor: 'text-rose-400 border-rose-500/40',
      bg: 'border-rose-500/30 bg-rose-500/5',
      title: 'Southern Frontend',
      sub: 'Player-facing experience · Calls SLA-113 for engine logic · Calls EmpireOne for governance',
    },
  ];

  return (
    <section className="px-6 py-16 max-w-7xl mx-auto">
      <SectionHeader
        layerLabel="SYSTEM HIERARCHY"
        layerColor="border-neutral-600 text-neutral-400"
        title="Architecture"
        sub="One governance root. One engine factory. One cultural universe. Infinite expression."
      />
      <div className="space-y-2">
        {rows.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            style={{ marginLeft: r.indent * 28 }}
            className={`flex items-center gap-4 border rounded-xl px-5 py-3.5 ${r.bg}`}
          >
            {r.indent > 0 && (
              <div className="w-px h-5 bg-neutral-700 -ml-2 shrink-0" />
            )}
            <span className={`text-xs font-mono font-bold border px-1.5 py-0.5 rounded shrink-0 ${r.badgeColor}`}>
              {r.badge}
            </span>
            <div className="min-w-0">
              <span className="font-bold text-white">{r.title}</span>
              <span className="hidden sm:inline text-neutral-500 text-sm ml-3">{r.sub}</span>
            </div>
          </motion.div>
        ))}
        {/* Horizontal AI layer */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.45 }}
          className="flex items-center gap-4 border border-purple-500/30 bg-purple-500/5 rounded-xl px-5 py-3.5 mt-5"
        >
          <Brain className="w-5 h-5 text-purple-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="font-bold text-white">Hybrid AI Stack</span>
            <span className="hidden sm:inline text-neutral-500 text-sm ml-3">
              GPT-5.2 · Claude Sonnet 4.5 · Gemini 3 Flash · Routing Engine · Canon Enforcer · Format Normalizer · Drift Monitor
            </span>
          </div>
          <span className="text-xs font-mono text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded shrink-0">
            HORIZONTAL
          </span>
        </motion.div>
      </div>
    </section>
  );
}

// ─── L0 Empire One Core + Pipelines ─────────────────────────────────────────

function EmpireOneSection() {
  const [pipelinesExpanded, setPipelinesExpanded] = useState(false);
  const visible = pipelinesExpanded ? PIPELINES : PIPELINES.slice(0, 10);

  return (
    <section className="px-6 py-16 bg-neutral-900/30 border-y border-neutral-800/40">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          layerLabel="L0 — EMPIRE ONE"
          layerColor="border-amber-500/40 text-amber-400"
          title="Governance Core + 19 Pipelines"
          sub="The industrial root. Every tenant, partner, and white-label instance is powered by the full stack."
        />

        {/* Core governance modules */}
        <div className="mb-10">
          <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">Governance Core</div>
          <div className="flex flex-wrap gap-3">
            {EMPIRE_CORE.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.label}
                  className="flex items-center gap-2 bg-neutral-800/40 border border-amber-500/15 rounded-lg px-4 py-2.5"
                >
                  <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm text-neutral-200">{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 19 Pipelines */}
        <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-4">
          19 Business Pipelines (B2B SaaS Engines)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {visible.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.n}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.025 }}
                className="flex items-center gap-3 bg-neutral-800/40 border border-neutral-700/30 rounded-lg px-4 py-3 hover:border-amber-500/30 hover:bg-neutral-800/60 transition-all"
              >
                <span className="text-xs font-mono text-neutral-600 w-6 shrink-0">{p.n}</span>
                <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-sm text-neutral-200">{p.label}</span>
              </motion.div>
            );
          })}
        </div>
        {!pipelinesExpanded && (
          <button
            onClick={() => setPipelinesExpanded(true)}
            className="mt-5 flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors mx-auto"
          >
            Show all 19 <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>
    </section>
  );
}

// ─── L1 SLA-113 ──────────────────────────────────────────────────────────────

function SLA113Section() {
  return (
    <section className="px-6 py-16 max-w-7xl mx-auto">
      <SectionHeader
        layerLabel="L1 — SLA-113"
        layerColor="border-violet-500/40 text-violet-400"
        title="Engine Factory & OS Foundry"
        sub="SLA-113 is the industrial factory that manufactures every engine Empire One deploys. Governance only — no creative workloads execute inside it."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {SLA113_ENGINES.map((e, i) => {
          const Icon = e.icon;
          return (
            <motion.div
              key={e.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="flex gap-4 bg-neutral-800/30 border border-violet-500/15 rounded-xl p-5 hover:border-violet-500/35 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="font-bold text-white">{e.label}</div>
                <div className="text-sm text-neutral-400 mt-1">{e.desc}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Shared Infra */}
      <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest mb-3">Shared Infrastructure</div>
      <div className="flex flex-wrap gap-3">
        {SLA113_INFRA.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-2 bg-neutral-800/30 border border-violet-500/10 rounded-lg px-4 py-2.5">
              <Icon className="w-4 h-4 text-violet-400 shrink-0" />
              <span className="text-sm text-neutral-300">{s.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── L2 Southern + L3 SL Audio ───────────────────────────────────────────────

function SouthernSection() {
  const [tab, setTab] = useState<'os' | 'audio' | 'frontend'>('os');

  return (
    <section className="px-6 py-16 bg-neutral-900/30 border-y border-neutral-800/40">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          layerLabel="L2 — SOUTHERN LIFESTYLE ARCADE"
          layerColor="border-cyan-500/40 text-cyan-400"
          title="Cultural OS & Universe Manufacturer"
          sub="The player-facing creative universe. Manufactured by SLA-113. Governed by Empire One."
        />

        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { id: 'os',       label: 'Southern OS Layers' },
            { id: 'audio',    label: 'SL Audio  (L3)' },
            { id: 'frontend', label: 'Southern Frontend' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                tab === t.id
                  ? 'bg-neutral-800 border-neutral-600 text-white'
                  : 'border-transparent text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'os' && (
            <motion.div key="os" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SOUTHERN_LAYERS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="flex items-center gap-3 bg-neutral-800/40 border border-cyan-500/15 rounded-xl px-5 py-4">
                    <Icon className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span className="text-neutral-200 font-medium">{s.label}</span>
                  </div>
                );
              })}
            </motion.div>
          )}

          {tab === 'audio' && (
            <motion.div key="audio" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-3 flex items-center gap-2">
                <LayerTag label="L3 — SL AUDIO" color="border-emerald-500/40 text-emerald-400" />
                <span className="text-sm text-neutral-400">Audio OS of Southern</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SL_AUDIO.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="flex items-center gap-3 bg-neutral-800/40 border border-emerald-500/15 rounded-xl px-5 py-4">
                      <Icon className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="text-neutral-200 font-medium">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {tab === 'frontend' && (
            <motion.div key="frontend" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-3 flex items-center gap-2">
                <LayerTag label="L3 — SOUTHERN FRONTEND" color="border-rose-500/40 text-rose-400" />
                <span className="text-sm text-neutral-400">Full player-facing experience</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: 'Calls SLA-113 for engine logic',        icon: Cpu },
                  { label: 'Calls EmpireOne for governance logic',   icon: Shield },
                  { label: 'Houses full player-facing experience',   icon: Gamepad2 },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="flex items-center gap-3 bg-neutral-800/40 border border-rose-500/15 rounded-xl px-5 py-4">
                      <Icon className="w-5 h-5 text-rose-400 shrink-0" />
                      <span className="text-neutral-200 font-medium">{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ─── White-Label + Partner (compact) ─────────────────────────────────────────

function WhiteLabelPartnerSection() {
  const tenants = [
    { id: '001', label: 'Agency Instance',      desc: 'Custom branding · custom domain · their clients · their revenue.' },
    { id: '002', label: 'Creator Instance',     desc: 'Solo creator or influencer running their own SaaS suite.' },
    { id: '003', label: 'Enterprise Instance',  desc: 'Full enterprise deployment with SSO, compliance, dedicated infra.' },
    { id: '004', label: 'Niche SaaS Instance',  desc: 'Vertical-specific SaaS on the full 19-pipeline stack.' },
    { id: '∞',   label: 'Infinite Scaling',    desc: 'Every tenant auto-provisioned with all 19 pipelines.' },
  ];
  const partners = [
    { type: 'A', label: 'Resellers',                  desc: 'Sell EmpireOne under their brand using all 19 pipelines.' },
    { type: 'B', label: 'Integrators',                desc: 'Build custom enterprise solutions on EmpireOne APIs.' },
    { type: 'C', label: 'Co-Branded Ventures',        desc: 'Joint branding with shared revenue models.' },
    { type: 'D', label: 'Industry Vertical Partners', desc: 'Real Estate · Medical · Legal · Education SaaS.' },
  ];

  return (
    <section className="px-6 py-16 max-w-7xl mx-auto">
      <div className="grid md:grid-cols-2 gap-12">
        {/* White-label */}
        <div>
          <SectionHeader
            layerLabel="L0 — WHITE-LABEL PROGRAM"
            layerColor="border-amber-500/40 text-amber-400"
            title="Tenant Factory"
            sub="Every tenant gets the full stack, custom branded, infinitely scalable."
          />
          <div className="space-y-3">
            {tenants.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex gap-3 bg-neutral-800/30 border border-neutral-700/30 rounded-xl px-4 py-3 hover:border-amber-500/20 transition-all"
              >
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded h-fit mt-0.5 shrink-0">
                  {t.id}
                </span>
                <div>
                  <div className="font-semibold text-white text-sm">{t.label}</div>
                  <div className="text-xs text-neutral-400 mt-0.5">{t.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Partners */}
        <div>
          <SectionHeader
            layerLabel="L0 — PARTNER NETWORK"
            layerColor="border-neutral-500/40 text-neutral-400"
            title="Strategic Partners"
            sub="Four partner models. One platform. Shared upside."
          />
          <div className="space-y-3">
            {partners.map((p, i) => (
              <motion.div
                key={p.type}
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex gap-3 bg-neutral-800/30 border border-neutral-700/30 rounded-xl px-4 py-3 hover:border-neutral-600 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-neutral-700/50 flex items-center justify-center font-black text-white text-xs shrink-0">
                  {p.type}
                </div>
                <div>
                  <div className="font-semibold text-white text-sm">{p.label}</div>
                  <div className="text-xs text-neutral-400 mt-0.5">{p.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function FooterStatus() {
  const services = [
    { label: 'Empire One Core',    status: 'OPERATIONAL' },
    { label: 'SLA-113 Factory',    status: 'OPERATIONAL' },
    { label: 'Southern OS',        status: 'OPERATIONAL' },
    { label: 'SL Audio',           status: 'OPERATIONAL' },
    { label: 'Lyrica 3',           status: 'OPERATIONAL' },
    { label: 'AI Routing Engine',  status: 'OPERATIONAL' },
    { label: 'Canon Enforcer',     status: 'ACTIVE' },
  ];

  return (
    <footer className="border-t border-neutral-800/60 bg-neutral-950 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-x-8 gap-y-3 mb-8">
          {services.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow shadow-emerald-400/50 animate-pulse" />
              <span className="text-neutral-300">{s.label}</span>
              <span className="text-xs font-mono text-emerald-500">{s.status}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-neutral-800/40">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="font-black tracking-widest text-sm bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-rose-200">
              EMPIRE ONE
            </span>
          </div>
          <div className="text-xs text-neutral-600">
            Governed by SLA-113 · Royalties: 70% Artist / 15% Platform / 10% Model Owners / 5% Infra
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmpireHomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-amber-500/30">
      <TopNav />
      <div className="pt-14">
        <HybridAIBanner />
        <HeroSection />
        <ArchitectureTree />
        <EmpireOneSection />
        <SLA113Section />
        <SouthernSection />
        <WhiteLabelPartnerSection />
        <FooterStatus />
      </div>
    </div>
  );
}
