import React from 'react';
import { ArrowUpRight, Coins, Fingerprint, Music2, Repeat2, ShieldCheck, Waves } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const stations = [
  {
    title: 'Chicano Soul After Dark',
    dna: 'DNA-L3P-CSAD-001',
    mode: 'Late-pocket vocals · warm tape texture · boulevard lowrider energy',
  },
  {
    title: 'Desert R&B Slowburn',
    dna: 'DNA-L3P-DRSB-014',
    mode: 'Dusty guitars · pleading vocal edge · low-BPM intimacy',
  },
  {
    title: 'Soulfire Sunday Cruise',
    dna: 'DNA-L3P-SSC-022',
    mode: 'Sunset harmonics · cruising drums · wide stereo ambience',
  },
];

const loop = [
  'Listener discovers a track inside SL Universal.',
  'Track identity stays attached through DNA / VICS proof.',
  'Flip It remix activity can trigger royalty events back to the origin creator.',
  'Archisynapse evaluates payout risk before money moves.',
];

export function SLUniversalOriginalPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <section className="border-b border-zinc-800/60">
        <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                <Waves className="h-4 w-4" />
                SL Universal
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
                  Consumer streaming mode for discovery, remix circulation, and creator attribution.
                </h1>
                <p className="max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
                  This replaces the old radio demo surface. SL Universal is the public-facing listening layer for Lyrica 3 Pro. It is where tracks circulate, identities stay attached, and remix behavior becomes economic evidence.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <div className="text-sm text-zinc-400">Business model</div>
                  <div className="mt-2 text-xl font-semibold text-white">$4.99/mo or ad-supported</div>
                </Card>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <div className="text-sm text-zinc-400">Remix payout target</div>
                  <div className="mt-2 text-xl font-semibold text-white">$0.025 per flip</div>
                </Card>
                <Card className="border-zinc-800 bg-zinc-900/60">
                  <div className="text-sm text-zinc-400">Ledger rule</div>
                  <div className="mt-2 text-xl font-semibold text-white">Identity stays attached</div>
                </Card>
              </div>
            </div>

            <Card className="border-zinc-700 bg-gradient-to-br from-zinc-900 to-cyan-950/30 p-0 overflow-hidden">
              <img
                src="/artists/brenton_wood.png"
                alt="SL Universal artist visual"
                className="h-72 w-full object-cover"
              />
              <div className="space-y-4 p-6">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
                  Distribution layer
                </div>
                <h2 className="text-2xl font-semibold text-white">Public ears, protected provenance</h2>
                <p className="text-sm leading-6 text-zinc-300">
                  SL Universal is not detached from the studio. It is the public continuation of the same creator-owned system.
                </p>
                <Button variant="secondary" className="w-full gap-2">
                  Live route ready for production shell
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 md:px-10">
        <div className="mb-8 flex items-center gap-3">
          <Music2 className="h-5 w-5 text-fuchsia-400" />
          <h2 className="text-2xl font-semibold text-white">Station lanes</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stations.map((station) => (
            <Card key={station.dna} className="border-zinc-800 bg-zinc-900/60">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{station.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{station.mode}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 font-mono text-xs text-cyan-300">
                  {station.dna}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Card className="border-zinc-800 bg-zinc-900/60">
            <div className="mb-6 flex items-center gap-3">
              <Repeat2 className="h-5 w-5 text-fuchsia-400" />
              <h2 className="text-2xl font-semibold text-white">Economic loop</h2>
            </div>

            <div className="space-y-3">
              {loop.map((item, index) => (
                <div key={item} className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-4 text-sm text-zinc-300">
                  <span className="mr-3 text-fuchsia-300">{index + 1}.</span>
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/60">
            <div className="mb-6 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              <h2 className="text-2xl font-semibold text-white">Protection stack</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
                <Fingerprint className="h-5 w-5 text-fuchsia-300" />
                <h3 className="mt-4 text-lg font-semibold text-white">DNA / VICS proof</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Provenance travels with the track so public circulation does not sever ownership.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
                <Coins className="h-5 w-5 text-cyan-300" />
                <h3 className="mt-4 text-lg font-semibold text-white">Archisynapse payout rules</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Royalty events can be screened for DNA verification, ledger presence, and payout fraud risk.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
