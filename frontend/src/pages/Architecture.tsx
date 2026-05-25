import { motion } from 'motion/react';
import { Network, Server, Cpu, Layers, Code2, Workflow, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Architecture() {
  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-mono mb-4">
          <Network className="w-4 h-4" />
          <span>PHASE V: ARCHITECTURE & APIs</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
          System <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Interdependencies</span>
        </h1>
        <p className="text-xl text-neutral-400 max-w-3xl leading-relaxed">
          Conceptual API structures and AI model interdependencies that power the Soulfire ecosystem.
        </p>
      </header>

      {/* Surpassing the Baseline Section */}
      <section className="bg-gradient-to-br from-cyan-950/30 to-blue-900/20 border border-cyan-500/20 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <Zap className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-semibold text-white">Surpassing the Baseline</h2>
        </div>
        <p className="text-neutral-400 mb-8 max-w-3xl relative z-10">
          How the Lyrica 3 Pro architecture completely eclipses standard open-source and commercial stacks (like the HeartMuLa ecosystem) by moving from static generation to dynamic, emotionally-aware synthesis.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {/* Foundation Model */}
          <div className="bg-black/40 border border-neutral-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-mono text-neutral-500 line-through decoration-red-500/50">HeartMuLa-7B</div>
              <ArrowRight className="w-4 h-4 text-cyan-500" />
              <div className="text-sm font-mono text-cyan-400 font-bold">Aura-Core 12B (Affective)</div>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">The Empathic Brain</h3>
            <p className="text-sm text-neutral-400">
              Standard models only understand music theory and lyrics. Aura-Core 12B understands <span className="text-cyan-300">somatic emotional grammar</span>. It comprehends "bruised subtext" and the irony of sad lyrics over bright progressions.
            </p>
          </div>

          {/* Styling Engine */}
          <div className="bg-black/40 border border-neutral-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-mono text-neutral-500 line-through decoration-red-500/50">Ace Step 1.5</div>
              <ArrowRight className="w-4 h-4 text-cyan-500" />
              <div className="text-sm font-mono text-cyan-400 font-bold">EMSS Dynamic Weaver</div>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Decoupled Styling</h3>
            <p className="text-sm text-neutral-400">
              Instead of static genre fine-tunes, the EMSS Weaver treats rhythm, melody, and emotion as separate layers. It procedurally applies "Late-Pocket Drums" and "Warm Analog Textures" across any genre.
            </p>
          </div>

          {/* The Codec */}
          <div className="bg-black/40 border border-neutral-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-mono text-neutral-500 line-through decoration-red-500/50">HeartCodec</div>
              <ArrowRight className="w-4 h-4 text-cyan-500" />
              <div className="text-sm font-mono text-cyan-400 font-bold">Resonance-X Codec</div>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Multi-Stem & Biometric Math</h3>
            <p className="text-sm text-neutral-400">
              Beyond basic 48kHz stereo, Resonance-X natively generates <span className="text-cyan-300">separated stems</span> while embedding DNA watermarks, biometric artifacts (vocal fry, inhales), and dynamic spatial proximity.
            </p>
          </div>

          {/* The Interface */}
          <div className="bg-black/40 border border-neutral-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-mono text-neutral-500 line-through decoration-red-500/50">HeartMuLa Studio</div>
              <ArrowRight className="w-4 h-4 text-cyan-500" />
              <div className="text-sm font-mono text-cyan-400 font-bold">Sonance Pro + SL Universal</div>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">The Two-Sided Ecosystem</h3>
            <p className="text-sm text-neutral-400">
              Replaces a basic "Suno clone" UI with a dual-threat platform: granular biometric control for professionals (Sonance Pro) and a frictionless, viral "Vibe Bar" for consumers (SL Universal).
            </p>
          </div>
        </div>
      </section>

      {/* AI Model Interdependencies */}
      <section className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-8">
          <Workflow className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-semibold text-white">AI Model Pipeline</h2>
        </div>
        
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-neutral-800 hidden md:block" />

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="relative flex flex-col md:flex-row gap-6 items-start">
              <div className="hidden md:flex w-16 h-16 shrink-0 rounded-2xl bg-neutral-950 border border-neutral-800 items-center justify-center z-10 relative">
                <Cpu className="w-6 h-6 text-neutral-400" />
              </div>
              <div className="bg-black/40 border border-neutral-800 p-6 rounded-2xl flex-1 w-full">
                <h3 className="text-lg font-medium text-white mb-2">1. NLP Intent Parsing (Vibe Bar)</h3>
                <p className="text-sm text-neutral-400 mb-4">Translates natural language into structured JSON payloads for the EMSS Composer.</p>
                <div className="bg-neutral-950 p-3 rounded-lg font-mono text-xs text-neutral-500 overflow-x-auto">
                  {`{
  "intent": "late_night_drive",
  "emotion": "mutual_breakup_acceptance",
  "style_reference": "90s_rnb_duo"
}`}
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col md:flex-row gap-6 items-start">
              <div className="hidden md:flex w-16 h-16 shrink-0 rounded-2xl bg-neutral-950 border border-neutral-800 items-center justify-center z-10 relative">
                <Layers className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="bg-black/40 border border-neutral-800 p-6 rounded-2xl flex-1 w-full">
                <h3 className="text-lg font-medium text-white mb-2">2. EMSS Composer (Creative Director)</h3>
                <p className="text-sm text-neutral-400 mb-4">Hybrid Neural-Symbolic Affective Engine maps qualitative intent to quantitative musical parameters.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
                    <div className="text-xs font-medium text-neutral-300 mb-1">Lyrical Ghostwriter</div>
                    <div className="text-xs text-neutral-500">Applies "Cracks Rule" & Vocab Filter</div>
                  </div>
                  <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
                    <div className="text-xs font-medium text-neutral-300 mb-1">Arrangement Engine</div>
                    <div className="text-xs text-neutral-500">Juxtaposition Logic (Sad lyrics + Bright chords)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col md:flex-row gap-6 items-start">
              <div className="hidden md:flex w-16 h-16 shrink-0 rounded-2xl bg-neutral-950 border border-neutral-800 items-center justify-center z-10 relative">
                <Server className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="bg-black/40 border border-neutral-800 p-6 rounded-2xl flex-1 w-full">
                <h3 className="text-lg font-medium text-white mb-2">3. Rendering & Biometric Artifacts</h3>
                <p className="text-sm text-neutral-400 mb-4">Duo-Soul Engine generates vocals. Biometric Artifact Engine applies human-centric flaws. Spatial Soul applies proximity.</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-400">Adaptive Inhale</span>
                  <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-400">Vocal Fry</span>
                  <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-400">48kHz/24-bit Output</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conceptual APIs */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Code2 className="w-6 h-6 text-orange-400" />
            <h3 className="text-xl font-semibold text-white">Sonance Pro API (Studio)</h3>
          </div>
          <div className="space-y-4 font-mono text-sm">
            <div className="bg-black/50 p-4 rounded-xl border border-neutral-800">
              <div className="text-orange-400 mb-2">POST /v1/studio/generate</div>
              <div className="text-neutral-500 text-xs">
                Payload requires explicit parameter mapping for EMSS, Biometrics, and Duo-Soul scripting.
              </div>
            </div>
            <div className="bg-black/50 p-4 rounded-xl border border-neutral-800">
              <div className="text-orange-400 mb-2">PATCH /v1/studio/biometrics</div>
              <div className="text-neutral-500 text-xs">
                Real-time adjustment of breath_intensity, vocal_fry_saturation, emotional_break_freq.
              </div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Code2 className="w-6 h-6 text-pink-400" />
            <h3 className="text-xl font-semibold text-white">SL Universal API (Consumer)</h3>
          </div>
          <div className="space-y-4 font-mono text-sm">
            <div className="bg-black/50 p-4 rounded-xl border border-neutral-800">
              <div className="text-pink-400 mb-2">POST /v1/universal/vibe</div>
              <div className="text-neutral-500 text-xs">
                Accepts natural language string. Returns streaming audio URL and dynamic mood board metadata.
              </div>
            </div>
            <div className="bg-black/50 p-4 rounded-xl border border-neutral-800">
              <div className="text-pink-400 mb-2">POST /v1/universal/flip</div>
              <div className="text-neutral-500 text-xs">
                Accepts source asset_id and mutation instructions. Triggers Lane 01 billing event.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
