import React from "react";
import { Music, DollarSign, Shield, Fingerprint, Sparkles, TrendingUp } from "lucide-react";

type LandingProps = {
  onEnterStudio?: () => void;
};

export default function LyricaPublicLanding({ onEnterStudio }: LandingProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Ambient gradient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600/10 blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600/10 blur-[120px] -ml-48 -mb-48" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 text-[11px] font-black uppercase tracking-[0.25em] mb-4 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Sparkles className="w-3 h-3 text-pink-500" />
            Powered by Soulfire Engine
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter">
            <span className="block text-white">Creator-Owned</span>
            <span className="block mt-3 bg-gradient-to-r from-pink-500 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
              AI Music
            </span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-3xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-medium">
            AI that understands your culture, your slang, your sound. 
            <span className="block mt-2 text-gray-400">Keep 100% ownership. Get paid for every remix. Build your legacy.</span>
          </p>
          
          {/* CTA Button */}
          <div className="pt-6">
            <button
              onClick={onEnterStudio}
              className="group relative px-12 py-6 bg-pink-500 text-black text-base font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-pink-500/30 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Music className="w-6 h-6" />
                Enter Studio
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <p className="text-xs text-gray-500 mt-4 uppercase tracking-widest">Free tier available • No credit card required</p>
          </div>
          
          {/* Real-time Stats */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-black text-pink-500">$0.01</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Cost Per Track</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-black text-pink-500">100%</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Creator Owned</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-black text-pink-500">4</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Pro Stems</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-black text-pink-500">∞</div>
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Remix Rights</div>
            </div>
          </div>
        </div>
      </section>

      {/* Soulfire Engine Spotlight */}
      <section className="py-24 px-6 border-t border-white/5 bg-gradient-to-b from-black to-amber-950/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-pink-600/10 border border-pink-600/20 text-[10px] font-bold text-pink-500 uppercase tracking-[0.25em] mb-2">
              The Heart of Lyrica3
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
              <span className="text-pink-500">Soulfire Engine</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              AI trained on real music from real communities. Not generic AI slop—your culture, your voice, done right.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-pink-600/10 to-pink-600/5 border border-pink-600/20 hover:border-pink-500/50 transition-all">
              <div className="space-y-4">
                <div className="text-4xl">🌍</div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Music That Sounds Like You</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Chicano Soul, Trap, Afrobeats, K-Pop, Reggaeton, Drill. Code-switch between languages. Mix your hood's slang. The AI gets it.
                </p>
              </div>
            </div>

            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-pink-600/10 to-purple-500/5 border border-pink-600/20 hover:border-pink-500/50 transition-all">
              <div className="space-y-4">
                <div className="text-4xl">🎤</div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Real Voice, Real Accent</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Your slang sounds right. Your accent is accurate. Not some robot reading text—actual pronunciation from your culture.
                </p>
              </div>
            </div>

            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 hover:border-cyan-400/50 transition-all">
              <div className="space-y-4">
                <div className="text-4xl">✅</div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">No Culture Vultures</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  System warns you before you mix cultures wrong. Keeps your music authentic. Keeps you from looking stupid.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Ownership Features */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-block px-3 py-1 rounded-full bg-pink-600/10 border border-pink-600/20 text-[10px] font-bold text-pink-500 uppercase tracking-[0.25em] mb-2">
              Your Music, Your Money
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
              <span className="text-white">Keep</span>
              <span className="block mt-2 text-pink-500">100% Ownership</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              No labels taking your cut. No hidden fees. Your music, your money, forever.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* DNA Tagging */}
            <div className="group relative p-10 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-pink-500/50 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-600/5 blur-[60px] -mr-16 -mt-16" />
              <div className="relative space-y-6">
                <div className="w-14 h-14 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                  <Fingerprint className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">DNA Tagging</h3>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    Every track gets a unique DNA tag—a digital birth certificate stored on-chain. 
                    When someone flips your beat, the blockchain knows. When royalties flow, you get paid.
                  </p>
                  <div className="inline-block px-3 py-1 rounded-full bg-pink-600/10 border border-pink-600/20 text-[10px] font-bold text-rose-300 uppercase tracking-wider">
                    Powered by Empire One Ledger
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-Royalties */}
            <div className="group relative p-10 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-emerald-400/50 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] -mr-16 -mt-16" />
              <div className="relative space-y-6">
                <div className="w-14 h-14 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Micro-Royalties</h3>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    Get paid every time someone uses your stem. Every remix. Every flip. Every sample. 
                    Automated splits. Instant payouts. No paperwork.
                  </p>
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                    Fair Attribution, Always
                  </div>
                </div>
              </div>
            </div>

            {/* 4-Stem Output */}
            <div className="group relative p-10 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-cyan-400/50 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[60px] -mr-16 -mt-16" />
              <div className="relative space-y-6">
                <div className="w-14 h-14 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  <Music className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Pro-Grade Stems</h3>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    Vocals, drums, bass, other—separated, downloadable, production-ready. 
                    Sell individual stems. License to producers. Build your catalog.
                  </p>
                  <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                    Studio Quality Output
                  </div>
                </div>
              </div>
            </div>

            {/* Creator Economy */}
            <div className="group relative p-10 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-purple-400/50 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[60px] -mr-16 -mt-16" />
              <div className="relative space-y-6">
                <div className="w-14 h-14 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Remix Economy</h3>
                  <p className="text-gray-400 leading-relaxed mb-4">
                    Every share can feed earnings. Every remix grows your reach. 
                    Your music becomes a living asset that works for you 24/7.
                  </p>
                  <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                    Infinite Revenue Streams
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Lyrica3 is Different */}
      <section className="py-24 px-6 border-t border-white/5 bg-gradient-to-b from-black to-neutral-950">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
              Why Competitors Can't Copy This
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              388MB cultural corpus. 7 cultural lenses. 40+ slang entries with phonetic targets. Zero other platforms have this.
            </p>
          </div>

          <div className="relative p-8 rounded-2xl bg-gradient-to-br from-pink-600/5 to-pink-600/5 border border-white/10">
            <div className="space-y-6">
              {[
                { icon: "🔥", text: "Soulfire Engine: Emotion-first generation for Chicano soul, R&B, rap, and regional fusion" },
                { icon: "🧬", text: "Cultural DNA tagging on every stem for fair attribution and automatic royalty routing" },
                { icon: "🎯", text: "Barrio Phonetics Engine with slang-to-IPA transformation and formant shifts" },
                { icon: "🌍", text: "7 Cultural Lenses with code-switching support (not generic one-size-fits-all)" },
                { icon: "🛡️", text: "Cultural Gatekeeping Protocol prevents cultural appropriation before you publish" },
                { icon: "💎", text: "Deterministic 5-organ pipeline (AURA → EFL → ASE → ECHO → EFAD)" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className="text-2xl flex-shrink-0">{item.icon}</div>
                  <p className="text-gray-300 text-base leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-600/5 to-transparent" />
        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-8">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
            <span className="text-white">Start Creating</span>{" "}
            <span className="block mt-2 text-pink-500">Your Legacy</span>
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed">
            No labels. No gatekeepers. No bullshit.
            <span className="block mt-2 text-gray-500">Just you, your culture, and your music.</span>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onEnterStudio}
              className="group relative px-12 py-6 bg-pink-500 text-black text-base font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-pink-500/30 overflow-hidden"
            >
              <span className="relative z-10">Enter Studio Now</span>
              <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <a
              href="/pricing"
              className="px-10 py-5 border border-white/20 text-sm font-bold uppercase tracking-[0.15em] rounded-2xl hover:bg-white/5 transition-all text-gray-300"
            >
              View Pricing
            </a>
          </div>
          <p className="text-xs text-gray-600 uppercase tracking-widest">Free tier available • No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center space-y-4">
        <p className="text-sm text-gray-500 font-medium">
          Built with Reverence Architecture • Powered by Empire One OS • SLA-113 Control Plane
        </p>
        <div className="flex items-center justify-center gap-6 text-xs pt-4">
          <a href="mailto:manda@empire1.cloud" className="text-pink-500 hover:text-pink-400 transition-colors font-medium">
            Contact
          </a>
          <span className="text-gray-700">|</span>
          <a href="https://twitter.com/lyrica3pro" className="text-pink-500 hover:text-pink-400 transition-colors font-medium">
            Twitter
          </a>
        </div>
      </footer>
    </div>
  );
}
