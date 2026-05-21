import React, { useState } from 'react';
import {
  Music2, Flame, Crown, Building2, Check, X, Zap, Shield, Download,
  Dna, Radio, Users, Code2, Headphones, ArrowRight, Sparkles
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   LYRICA 3 PRO — PRICING PAGE
   "You own everything you make. Period."
   ═══════════════════════════════════════════════════════════════════════════ */

interface Tier {
  id: string;
  name: string;
  price: string;
  priceSub: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  color: string;         // tailwind gradient classes
  borderColor: string;
  glowColor: string;
  badge?: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

const TIERS: Tier[] = [
  {
    id: 'creator',
    name: 'Creator',
    price: 'Free',
    priceSub: 'forever',
    tagline: 'Start making. Start owning.',
    description: 'No credit card. No catch. Full ownership on every track you create.',
    icon: <Music2 className="w-7 h-7" />,
    color: 'from-gray-500/20 to-gray-600/5',
    borderColor: 'border-white/10 hover:border-white/20',
    glowColor: 'bg-white/5',
    features: [
      '5 tracks per month',
      '100% creator ownership',
      'DNA tagging on every track',
      'Download everything you make',
      'Basic Soulfire Engine',
      'Community access',
    ],
    cta: 'Start Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    priceSub: '/month',
    tagline: 'Unlimited creation. Full power.',
    description: 'Everything you need to create, own, and distribute professional-grade music.',
    icon: <Flame className="w-7 h-7" />,
    color: 'from-pink-500/20 to-pink-600/5',
    borderColor: 'border-pink-500/30 hover:border-pink-500/50',
    glowColor: 'bg-pink-500/10',
    badge: 'MOST POPULAR',
    features: [
      'Unlimited tracks',
      '100% creator ownership',
      'DNA tagging + royalty routing',
      'Download everything you make',
      'Full Soulfire Engine',
      'Distribution-ready exports',
      'Advanced mastering pipeline',
      'Priority rendering',
    ],
    cta: 'Go Pro',
    popular: true,
  },
  {
    id: 'empire',
    name: 'Empire',
    price: '$24.99',
    priceSub: '/month',
    tagline: 'Multi-universe creator ecosystem.',
    description: 'For serious producers building an empire across every surface.',
    icon: <Crown className="w-7 h-7" />,
    color: 'from-purple-500/20 to-violet-600/5',
    borderColor: 'border-purple-500/30 hover:border-purple-500/50',
    glowColor: 'bg-purple-500/10',
    features: [
      'Everything in Pro',
      'Multi-universe access',
      'Commercial licensing tools',
      'Batch generation',
      'API access',
      'Advanced remix economics',
      'Priority support',
      'Early access to new engines',
    ],
    cta: 'Build Your Empire',
  },
  {
    id: 'label',
    name: 'Label',
    price: '$49.99',
    priceSub: '/month',
    tagline: 'Teams, studios, and labels.',
    description: 'White-label power for teams shipping music at scale.',
    icon: <Building2 className="w-7 h-7" />,
    color: 'from-amber-500/20 to-orange-600/5',
    borderColor: 'border-amber-500/30 hover:border-amber-500/50',
    glowColor: 'bg-amber-500/10',
    features: [
      'Everything in Empire',
      'Team seats (up to 5)',
      'White-label exports',
      'Bulk commercial licenses',
      'Dedicated support',
      'Custom engine tuning',
      'Analytics dashboard',
      'Sync licensing tools',
    ],
    cta: 'Contact Us',
  },
];

// Competitor comparison data
const COMPARE_ROWS = [
  { feature: 'You own your music',          lyrica: true,  suno: false, udio: false, eleven: 'partial' },
  { feature: 'Download your tracks',         lyrica: true,  suno: 'limited', udio: false, eleven: true },
  { feature: 'DNA tagging / provenance',     lyrica: true,  suno: false, udio: false, eleven: false },
  { feature: 'Automatic royalty routing',     lyrica: true,  suno: false, udio: false, eleven: 'partial' },
  { feature: 'Distribution-ready exports',   lyrica: true,  suno: false, udio: false, eleven: true },
  { feature: 'No label takes your rights',   lyrica: true,  suno: false, udio: false, eleven: false },
  { feature: 'Cultural authenticity engine',  lyrica: true,  suno: false, udio: false, eleven: false },
  { feature: 'Pro plan price',               lyrica: '$9.99', suno: '$8–$24', udio: '$10–$30', eleven: '$7.99' },
];

function CellIcon({ val }: { val: boolean | string }) {
  if (val === true) return <Check className="w-5 h-5 text-emerald-400 mx-auto" />;
  if (val === false) return <X className="w-5 h-5 text-red-400/60 mx-auto" />;
  if (val === 'partial') return <span className="text-xs text-amber-400 font-medium">Partial</span>;
  if (val === 'limited') return <span className="text-xs text-amber-400 font-medium">Limited</span>;
  return <span className="text-sm text-gray-300 font-bold">{String(val)}</span>;
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Hero ── */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-600/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[120px]" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Creator-Owned Pricing
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95]">
            <span className="text-white">Own Your Music.</span>{' '}
            <span className="text-pink-500">Pay What's Fair.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Udio charges $30/mo and won't let you download your music.
            Suno charges $24/mo and gave your rights to Warner.
            <span className="block mt-2 text-gray-300 font-medium">
              We start free, you own everything, and Pro is $9.99.
            </span>
          </p>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-6 border bg-gradient-to-br ${tier.color} ${tier.borderColor} flex flex-col transition-all duration-300 ${
                tier.popular ? 'lg:-mt-4 lg:mb-0 ring-1 ring-pink-500/30 shadow-2xl shadow-pink-500/10' : ''
              }`}
            >
              {/* Popular badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-pink-500 text-black text-[10px] font-black uppercase tracking-wider shadow-lg shadow-pink-500/30">
                  {tier.badge}
                </div>
              )}

              {/* Icon + Name */}
              <div className="flex items-center gap-3 mb-4 mt-1">
                <div className={`w-12 h-12 rounded-xl ${tier.glowColor} border border-white/10 flex items-center justify-center`}>
                  {tier.icon}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">{tier.name}</h3>
                  <p className="text-[10px] uppercase tracking-widest text-gray-500">{tier.tagline}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-4xl font-black text-white">{tier.price}</span>
                <span className="text-sm text-gray-500 ml-1">{tier.priceSub}</span>
              </div>

              <p className="text-sm text-gray-400 mb-6 leading-relaxed">{tier.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-grow">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feat}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  tier.popular
                    ? 'bg-pink-500 text-black hover:bg-pink-400 shadow-lg shadow-pink-500/20'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                {tier.cta}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Ownership guarantee */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-emerald-300 font-medium">
              Every plan includes 100% creator ownership + DNA tagging. No exceptions.
            </span>
          </div>
        </div>
      </section>

      {/* ── Key Differentiators ── */}
      <section className="py-20 px-6 border-t border-white/5 bg-gradient-to-b from-black to-neutral-950">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
              What You Get That They Don't
            </h2>
            <p className="text-gray-400 text-base max-w-xl mx-auto">
              Every plan — including Free — ships with features competitors charge extra for or don't offer at all.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <Download className="w-6 h-6" />,
                title: 'Download Everything',
                desc: "Udio just killed downloads. Suno caps them. Every track you make here is yours to download. Always.",
                color: 'text-pink-400',
                bg: 'bg-pink-500/10 border-pink-500/20',
              },
              {
                icon: <Dna className="w-6 h-6" />,
                title: 'DNA Tagged',
                desc: 'Every track gets a digital birth certificate with provenance tracking and automatic royalty routing.',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10 border-purple-500/20',
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: '100% Ownership',
                desc: "No label takes your rights. No corporation trains on your music. You created it, you own it. Full stop.",
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20',
              },
              {
                icon: <Radio className="w-6 h-6" />,
                title: 'Distribution-Ready',
                desc: "Distributors are blocking Suno/Udio tracks. Your Lyrica 3 music distributes clean with DNA verification.",
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10 border-cyan-500/20',
              },
              {
                icon: <Headphones className="w-6 h-6" />,
                title: 'Cultural Authenticity',
                desc: "388MB cultural corpus. 7 lenses. Barrio Phonetics Engine. Music that sounds real because it's built on real.",
                color: 'text-amber-400',
                bg: 'bg-amber-500/10 border-amber-500/20',
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Soulfire Engine',
                desc: 'Emotion-first generation for Chicano soul, R&B, rap, corridos, and regional fusion. Not generic AI slop.',
                color: 'text-rose-400',
                bg: 'bg-rose-500/10 border-rose-500/20',
              },
            ].map((item) => (
              <div key={item.title} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                <div className={`w-12 h-12 rounded-xl ${item.bg} border flex items-center justify-center ${item.color} mb-4 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Competitor Comparison ── */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
              The Real Comparison
            </h2>
            <p className="text-gray-400 text-base">
              Not just features — <span className="text-white font-medium">ownership</span>.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="text-left px-5 py-4 text-gray-400 font-medium text-xs uppercase tracking-wider">Feature</th>
                    <th className="text-center px-4 py-4 text-pink-400 font-bold text-xs uppercase tracking-wider">
                      <div className="flex flex-col items-center gap-1">
                        <Flame className="w-4 h-4" />
                        Lyrica 3
                      </div>
                    </th>
                    <th className="text-center px-4 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Suno</th>
                    <th className="text-center px-4 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider">Udio</th>
                    <th className="text-center px-4 py-4 text-gray-500 font-medium text-xs uppercase tracking-wider">ElevenMusic</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, i) => (
                    <tr key={row.feature} className={`border-b border-white/5 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="px-5 py-3.5 text-gray-300 font-medium">{row.feature}</td>
                      <td className="px-4 py-3.5 text-center bg-pink-500/[0.03]"><CellIcon val={row.lyrica} /></td>
                      <td className="px-4 py-3.5 text-center"><CellIcon val={row.suno} /></td>
                      <td className="px-4 py-3.5 text-center"><CellIcon val={row.udio} /></td>
                      <td className="px-4 py-3.5 text-center"><CellIcon val={row.eleven} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-4">
            Data as of May 2026. Suno pricing reflects Warner partnership terms. Udio downloads disabled post-UMG settlement.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-6 border-t border-white/5 bg-gradient-to-b from-neutral-950 to-black">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black tracking-tighter text-white text-center mb-12">
            Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Do I really own 100% of what I create?",
                a: "Yes. Every track you create on Lyrica 3 Pro is yours — the composition, the stems, the masters, everything. We never claim rights to your music. We never train on your music. We never license your music to anyone. Your DNA tag is your proof of creation."
              },
              {
                q: "Can I distribute music made on Lyrica 3?",
                a: "Yes. Unlike Suno and Udio, tracks created on Lyrica 3 come with DNA verification that passes distributor checks. TuneCore and DistroKid are actively blocking unlicensed AI tracks — yours won't be one of them."
              },
              {
                q: "What's the DNA tag?",
                a: "Think of it as a digital birth certificate for your track. It records who created it, when, what inputs were used, and routes royalties automatically. It's baked into every track on every plan — including Free."
              },
              {
                q: "Why is Pro only $9.99 when competitors charge $24–$30?",
                a: "Because we believe creators shouldn't have to choose between eating and making music. We don't have Warner or UMG taking a cut. We don't have $250M in VC to pay back. We built this lean, and we pass the savings to you."
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. No contracts, no commitments. Cancel anytime and keep everything you've created — it's your music, not ours."
              },
              {
                q: "What happens to my tracks if I downgrade?",
                a: "Nothing. They're yours forever. You just won't be able to create new tracks beyond the Free tier limit. Everything you already made stays in your library with full ownership."
              },
            ].map((item) => (
              <details key={item.q} className="group rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <summary className="px-6 py-4 cursor-pointer text-white font-bold text-sm flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  {item.q}
                  <span className="text-gray-500 group-open:rotate-180 transition-transform text-lg">▾</span>
                </summary>
                <div className="px-6 pb-5 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-24 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-600/5 to-transparent" />
        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
            <span className="text-white">Ready to Own</span>{' '}
            <span className="text-pink-500">Your Sound?</span>
          </h2>
          <p className="text-lg text-gray-400">
            Start free. Upgrade when you're ready. Keep everything you create.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="group px-10 py-4 bg-pink-500 text-black text-sm font-black uppercase tracking-[0.2em] rounded-xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-pink-500/30">
              Start Creating Free
            </button>
            <a href="mailto:manda@empire1.cloud" className="px-10 py-4 border border-white/20 text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-white/5 transition-all text-gray-300">
              Talk to Us
            </a>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-widest">
            No credit card required • Cancel anytime • You own everything
          </p>
        </div>
      </section>
    </div>
  );
}
