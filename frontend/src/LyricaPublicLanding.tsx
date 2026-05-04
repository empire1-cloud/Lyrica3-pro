import React from "react";

type Props = {
  onEnterStudio: () => void;
};

export default function LyricaPublicLanding({ onEnterStudio }: Props) {
  const stats = [
    { value: "50+", label: "Engines" },
    { value: "7", label: "Universes" },
    { value: "1", label: "Ecosystem" },
  ];

  const genres = [
    {
      title: "Regional Mexican",
      mood: "Legion Stadium brass, corrido edge, modern low-end",
      palette: "from-amber-200 via-rose-100 to-orange-200",
      legends: ["Ramon Ayala", "Vicente Fernandez", "Chalino Sanchez", "Fuerza Regida", "Xavi"],
    },
    {
      title: "Chicano Rap",
      mood: "SGV stories, lowrider cadence, late-night boulevard drums",
      palette: "from-sky-200 via-cyan-100 to-blue-200",
      legends: ["ShadyBoy", "Lil Ybe", "Herencia de Patrones"],
    },
    {
      title: "R&B / Soul",
      mood: "Talkbox warmth, emotional falsetto, midnight romance",
      palette: "from-pink-200 via-fuchsia-100 to-violet-200",
      legends: ["Keith Sweat", "Barbara Mason", "Teena Marie", "Brenton Wood"],
    },
  ];

  const scenes = [
    "Whittier Narrows carnival lights over summer fog",
    "Backyard party energy with polished vintage soul",
    "El Monte lowrider night show, chrome and velvet sound",
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fbf7f2_0%,#f4f8ff_40%,#f7f4ff_100%)] text-neutral-900">
      <section className="px-6 md:px-12 py-16 border-b border-neutral-200/80">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-amber-700 mb-4">Lyrica 3 Pro // Creator-Owned Category</p>
            <h1 className="text-4xl md:text-6xl font-black leading-[0.95] tracking-tight mb-6">
              Sovereign music creation
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-600 via-amber-600 to-cyan-600">
                with SGV heartbeat.
              </span>
            </h1>
            <p className="text-sm md:text-base text-neutral-700 leading-relaxed max-w-xl border-l-2 border-amber-500/50 pl-4 mb-8">
              Rock n Wednesday and El Monte Legion Stadium energy, crafted for modern creators.
              Culture leads. Technology serves. Build tracks that feel lived-in, emotionally true,
              and financially creator-owned from stem to stream.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onEnterStudio}
                className="px-6 py-3 bg-neutral-900 text-white text-sm font-bold uppercase tracking-[0.15em] rounded hover:bg-neutral-700 transition"
              >
                Enter Studio
              </button>
              <a
                href="#economy"
                className="px-6 py-3 border border-neutral-300 text-sm font-bold uppercase tracking-[0.15em] rounded hover:bg-white transition"
              >
                Creator Economy
              </a>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/90 border border-neutral-200 rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl md:text-3xl font-black text-neutral-900">{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500">{s.label}</p>
              </div>
            ))}
            <div className="col-span-3 bg-white/90 border border-neutral-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">SLA-113 Federal Control Plane</p>
              <p className="text-sm text-neutral-700">
                Every engine is forged, versioned, and orchestrated through SLA-113 so Lyrica stays fast,
                auditable, and creator-safe at scale.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-14 border-b border-neutral-200/80">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-700 mb-3">Wall of Legends</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-10">Genre blocks with cultural scene art</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {genres.map((g) => (
              <div key={g.title} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
                <div className={`h-32 bg-gradient-to-br ${g.palette}`} />
                <div className="p-5">
                  <h3 className="text-lg font-black mb-1">{g.title}</h3>
                  <p className="text-sm text-neutral-700 mb-3">{g.mood}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.legends.map((name) => (
                      <span key={name} className="text-[10px] uppercase tracking-wide px-2 py-1 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 py-14 border-b border-neutral-200/80">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.25em] text-rose-700 mb-3">Cultural Scenes</p>
          <div className="grid md:grid-cols-3 gap-4">
            {scenes.map((s) => (
              <div key={s} className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm text-neutral-700 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="economy" className="px-6 md:px-12 py-14">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-700 mb-3">Product Under Culture</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-10">Soulfire engine, DNA tagging, remix economy</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Soulfire", "Emotion-first generation tuned for Chicano soul, R&B, rap, and regional fusion."],
              ["DNA Tagging", "Every stem and derivative tracked for fair attribution and micro-royalty routing."],
              ["Sonance Pro", "Pro studio tier for high-volume creators and labels ($99-$299/mo)."],
              ["SL Universal", "Consumer streaming + creator loop where every share can feed earnings."],
            ].map(([title, body]) => (
              <div key={title} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-black mb-2">{title}</h3>
                <p className="text-sm text-neutral-700">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
