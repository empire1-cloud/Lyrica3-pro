import React from 'react';
import { ArrowRight, AudioLines, BadgeDollarSign, Fingerprint, ShieldCheck, Sparkles, Users, Waves } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router';

const surfaces = [
  {
    name: 'Sonance Pro',
    description: '48kHz/24-bit professional AI studio for creator-owned production.',
    pricing: '$99–$299/mo',
  },
  {
    name: 'SL Universal',
    description: 'Consumer streaming surface with natural-language audio generation and remix loops.',
    pricing: '$4.99/mo or ad-supported',
  },
  {
    name: 'Discord Bot',
    description: 'Real-time community collaboration engine for audience-driven creation.',
    pricing: '$4.99–$19.99/mo',
  },
  {
    name: 'TikTok Card',
    description: 'Distribution layer that carries royalty metadata into social circulation.',
    pricing: 'Distribution surface',
  },
];

const proofPoints = [
  {
    icon: Fingerprint,
    title: 'DNA-tagged ownership',
    body: 'Every audio asset carries creator proof, provenance, and a track identity layer.',
  },
  {
    icon: BadgeDollarSign,
    title: 'Micro-royalty ledger',
    body: 'Creator split targets 70/30 with remix payouts routed through the ledger.',
  },
  {
    icon: ShieldCheck,
    title: 'Fraud and payout controls',
    body: 'Archisynapse handles fraud screening, payout risk, ledger checks, and payment state.',
  },
  {
    icon: AudioLines,
    title: 'Soulfire generation engine',
    body: 'Hybrid neural-symbolic generation translates emotional directives into audio behavior.',
  },
];

export function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <section className="relative overflow-hidden border-b border-zinc-800/60">
        <div className="absolute inset-0">
          <img
            src="/artists/carnival_vibe.jpg"
            alt="Ferris wheel and carnival lights"
            className="h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950/90 to-fuchsia-950/60" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-fuchsia-300">
                <Sparkles className="h-4 w-4" />
                Lyrica 3 Pro
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  Creator-owned AI music with proof, payout rails, and public distribution.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
                  Lyrica 3 Pro is the music surface inside the Soulfire / Empire-1 stack. Sonance Pro handles studio-grade creation. SL Universal handles public streaming and remix distribution. Archisynapse handles the money, fraud, and ledger layer.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/make-music">
                  <Button variant="primary" glowColor="fuchsia" className="gap-2">
                    Make Music
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/radio">
                  <Button variant="secondary" className="gap-2">
                    Open SL Universal
                    <Waves className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-zinc-700/60 bg-zinc-950/60">
                  <div className="text-sm text-zinc-400">Creator split</div>
                  <div className="mt-2 text-3xl font-semibold text-white">70 / 30</div>
                  <div className="mt-2 text-sm text-zinc-500">Creator-first royalty model.</div>
                </Card>
                <Card className="border-zinc-700/60 bg-zinc-950/60">
                  <div className="text-sm text-zinc-400">Projected year 1 revenue</div>
                  <div className="mt-2 text-3xl font-semibold text-white">$7.93M</div>
                  <div className="mt-2 text-sm text-zinc-500">Sonance Pro is the main driver.</div>
                </Card>
                <Card className="border-zinc-700/60 bg-zinc-950/60">
                  <div className="text-sm text-zinc-400">Blended gross margin</div>
                  <div className="mt-2 text-3xl font-semibold text-white">88%</div>
                  <div className="mt-2 text-sm text-zinc-500">High-margin software + royalty rails.</div>
                </Card>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="overflow-hidden border-zinc-700/60 bg-zinc-900/70 p-0 sm:col-span-2">
                <div className="grid md:grid-cols-[1fr_1.2fr]">
                  <img
                    src="/artists/whittier_blvd_1.jpg"
                    alt="Whittier Boulevard scene"
                    className="h-full min-h-[240px] w-full object-cover"
                  />
                  <div className="space-y-4 p-6">
                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                      Public proof loop
                    </div>
                    <h2 className="text-2xl font-semibold text-white">
                      Generate → prove ownership → route royalties → distribute publicly
                    </h2>
                    <p className="text-sm leading-7 text-zinc-300">
                      The production loop is not just generation. It is generation plus creator attribution, fraud screening, payout logic, and public circulation with identity intact.
                    </p>
                    <div className="grid gap-3 text-sm text-zinc-300">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">1. Sonance Pro creates the track.</div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">2. DNA / VICS proof attaches creator identity.</div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">3. Archisynapse checks fraud, ledger, and payout risk.</div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3">4. SL Universal distributes and drives remix traffic.</div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-zinc-700/60 bg-zinc-900/70 p-0">
                <img src="/artists/ana_gabriel.jpg" alt="Artist reference" className="h-52 w-full rounded-t-2xl object-cover" />
                <div className="space-y-2 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-400">Cultural realism</div>
                  <h3 className="text-xl font-semibold text-white">Archetypes and emotional direction</h3>
                  <p className="text-sm leading-6 text-zinc-400">
                    Soulfire maps emotional prompts into vocal timing, grit, phrasing, and texture instead of treating music generation like flat prompt art.
                  </p>
                </div>
              </Card>

              <Card className="border-zinc-700/60 bg-zinc-900/70 p-0">
                <img src="/artists/teena_marie.jpg" alt="Artist reference" className="h-52 w-full rounded-t-2xl object-cover" />
                <div className="space-y-2 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-400">Infrastructure moat</div>
                  <h3 className="text-xl font-semibold text-white">Not one app. One business across multiple surfaces.</h3>
                  <p className="text-sm leading-6 text-zinc-400">
                    Studio, public streaming, community collaboration, and social distribution all share the same ownership and royalty infrastructure.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        <div className="mb-8 flex items-center gap-3">
          <Users className="h-5 w-5 text-fuchsia-400" />
          <h2 className="text-2xl font-semibold text-white">Product surfaces</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {surfaces.map((surface) => (
            <Card key={surface.name} glowOnHover className="border-zinc-800 bg-zinc-900/60">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Surface</div>
                <h3 className="text-xl font-semibold text-white">{surface.name}</h3>
                <p className="min-h-20 text-sm leading-6 text-zinc-400">{surface.description}</p>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300">
                  {surface.pricing}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-cyan-400" />
          <h2 className="text-2xl font-semibold text-white">Core system truth</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {proofPoints.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-zinc-800 bg-zinc-900/60">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-950 text-fuchsia-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
