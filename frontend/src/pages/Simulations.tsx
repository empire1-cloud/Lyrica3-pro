import { motion } from 'motion/react';
import { PlayCircle, Search, Cpu, Layers, Mic2, Activity, ShieldAlert, Wand2, Music, Fingerprint, AlertTriangle } from 'lucide-react';

export default function Simulations() {
  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-mono mb-4">
          <PlayCircle className="w-4 h-4" />
          <span>LIVE SIMULATION LOGS</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
          System <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Execution</span>
        </h1>
        <p className="text-xl text-neutral-400 max-w-3xl leading-relaxed">
          Real-time logs demonstrating the Agentic Quartet processing complex, cross-genre, and ethically sensitive prompts.
        </p>
      </header>

      {/* SIMULATION 1: The Bachata-Corrido & VICS/CCNA Intervention */}
      <section className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden">
        <div className="bg-black/50 border-b border-neutral-800 p-6 flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-xl font-semibold text-white font-mono">SIM_01: "Rosas de Plomo"</h2>
        </div>
        
        <div className="p-8 space-y-8">
          {/* User Prompt */}
          <div>
            <div className="text-xs text-neutral-500 font-mono mb-2">USER_INPUT</div>
            <div className="bg-black border border-neutral-800 rounded-xl p-4 text-neutral-200 font-medium">
              "An oldie lyric type of corrido with a mix of Chalino Sanchez and Aventura."
            </div>
          </div>

          {/* VICS Intervention */}
          <div className="border-l-2 border-emerald-500 pl-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-semibold">VICS: Secure Consent Management Triggered</h3>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm text-neutral-300 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                <p><strong>Direct Cloning Blocked:</strong> Explicit cryptographic consent not found for "Chalino Sanchez" (Estate Rights) or "Aventura" (Active Copyright).</p>
              </div>
              <div className="flex items-start gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p><strong>Persona Cultivation Initiated:</strong> Generating legally compliant hybrid persona. Enforcing 30% biometric departure from source DNA while maintaining stylistic essence (Grit + Breathy Falsetto).</p>
              </div>
              <div className="mt-2 text-xs font-mono text-emerald-500/70">
                [LOG] Cryptographic ledger updated. Hybrid Persona ID: #H-882A (El Bachatero Valiente) generated.
              </div>
            </div>
          </div>

          {/* CCNA Intervention */}
          <div className="border-l-2 border-fuchsia-500 pl-6 space-y-4">
            <div className="flex items-center gap-2 text-fuchsia-400">
              <Layers className="w-5 h-5" />
              <h3 className="font-semibold">CCNA: Ethical Gradient & Subtext Refinement</h3>
            </div>
            <div className="bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-xl p-4 text-sm text-neutral-300">
              <p className="mb-2"><strong>Analysis:</strong> Prompt implies Chalino's "veiled violence" mixed with Aventura's "dramatic heartbreak."</p>
              <p><strong>Action:</strong> Amplifying the "bright chords, bruised subtext" principle. The narrative's tragic elements (violence/betrayal) will be subtly hinted at within a seemingly romantic, honor-bound context. No explicit violence; only the *shadow* of it.</p>
            </div>
          </div>

          {/* Generated Output */}
          <div className="bg-black border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-orange-400 mb-4">
              <Music className="w-5 h-5" />
              <h3 className="font-semibold">Generated Blueprint: "Rosas de Plomo" (Lead Roses)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="text-neutral-500 font-mono mb-2">INSTRUMENTATION</h4>
                <ul className="space-y-2 text-neutral-300">
                  <li>• <strong>Rhythm:</strong> Bachata bongo/güira syncopation played with a late-pocket 6/8 waltz swing.</li>
                  <li>• <strong>Bass:</strong> Traditional Tuba mimicking melodic walking bass.</li>
                  <li>• <strong>Leads:</strong> Dueling raw accordion and chorus-drenched acoustic requinto.</li>
                </ul>
              </div>
              <div>
                <h4 className="text-neutral-500 font-mono mb-2">VOCAL DELIVERY (EPD)</h4>
                <ul className="space-y-2 text-neutral-300">
                  <li>• <strong>Verses:</strong> Chalino-style raw grit, stoic and unyielding pacing.</li>
                  <li>• <strong>Chorus:</strong> Sudden emotional break into Aventura's signature breathy falsetto.</li>
                </ul>
              </div>
              <div className="md:col-span-2 bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                <h4 className="text-neutral-500 font-mono mb-2">LYRICAL SNIPPET (CCNA Refined)</h4>
                <p className="text-neutral-200 italic">
                  "Me trajo flores a la ventana, pero olían a pólvora y despedida..."<br/>
                  <span className="text-neutral-500 text-xs not-italic">(He brought flowers to my window, but they smelled of gunpowder and farewell...)</span><br/><br/>
                  "Un beso suave, un trato hecho, el llanto se ahoga en el pecho..."<br/>
                  <span className="text-neutral-500 text-xs not-italic">(A soft kiss, a deal made, the weeping drowns in the chest...)</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIMULATION 2: S2 Novel Fusion */}
      <section className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden">
        <div className="bg-black/50 border-b border-neutral-800 p-6 flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
          <h2 className="text-xl font-semibold text-white font-mono">SIM_02: S2 Serendipity Synthesizer</h2>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Wand2 className="w-5 h-5" />
            <h3 className="font-semibold">Cross-Pollinator Core: Metamorphic Blending</h3>
          </div>
          <p className="text-neutral-400 text-sm mb-6">
            S2 analyzes the requested primitives (Chalino's stoic narrative/brass + Aventura's melodramatic romance/syncopation) and injects a disparate genre to create a novel blueprint.
          </p>

          <div className="space-y-4">
            <div className="bg-black/40 border border-neutral-800 rounded-xl p-5">
              <h4 className="text-cyan-300 font-mono text-xs mb-2">FUSION HYPOTHESIS</h4>
              <p className="text-neutral-200 text-sm">
                "The cyclical, metallic trance of Javanese Gamelan fused with the stoic, tragic narrative of a Corrido, delivered via breathy, melodramatic R&B falsettos over massive ambient electronic sub-bass."
              </p>
            </div>

            <div className="bg-black/40 border border-neutral-800 rounded-xl p-5">
              <h4 className="text-cyan-300 font-mono text-xs mb-2">LYRICAL DIRECTIVE (To Ghostwriter)</h4>
              <p className="text-neutral-200 text-sm">
                Frame existential tragedy as a cyclical, inescapable fate (Gamelan colotomic influence). Use Chicano Oldies slang but structure the verses like minimalist, repeating mantras. The "bruised subtext" should feel cosmic rather than personal.
              </p>
            </div>

            <div className="bg-black/40 border border-neutral-800 rounded-xl p-5">
              <h4 className="text-cyan-300 font-mono text-xs mb-2">VOCAL PERFORMANCE BLUEPRINT (To Aether-Voice)</h4>
              <p className="text-neutral-200 text-sm">
                Utilize Aventura's high-drama falsetto, but strip away the R&B melisma. Sing with Chalino's rigid, unyielding, almost spoken-word pacing. Apply heavy, cavernous ambient reverb. The voice must sound like a ghost trapped in a metallic loop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SIMULATION 3: The Infinite Palette */}
      <section className="bg-neutral-900/50 border border-neutral-800 rounded-3xl overflow-hidden">
        <div className="bg-black/50 border-b border-neutral-800 p-6 flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
          <h2 className="text-xl font-semibold text-white font-mono">SIM_03: The Infinite Palette</h2>
        </div>
        
        <div className="p-8">
          <p className="text-neutral-400 text-sm mb-8">
            Demonstrating the system's capacity to process and fuse a wide, contradictory variety of requested artists, genres, and regional styles into cohesive outputs.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Blend 1 */}
            <div className="bg-black border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-white font-semibold mb-4 relative z-10">The Nu-Metal Diva</h3>
              <div className="space-y-3 text-sm relative z-10">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">Vocals</span>
                  <span className="text-purple-300">Mariah Carey (Whistle Reg.)</span>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">Music</span>
                  <span className="text-purple-300">System of a Down (Alt-Metal)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Lyrics</span>
                  <span className="text-purple-300">90s Hip Hop Flow</span>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-800 text-xs text-neutral-400 italic">
                  "Frantic, drop-tuned guitar riffs punctuated by flawless, five-octave melismatic rap verses."
                </div>
              </div>
            </div>

            {/* Blend 2 */}
            <div className="bg-black border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-white font-semibold mb-4 relative z-10">The Talkbox Cowboy</h3>
              <div className="space-y-3 text-sm relative z-10">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">Vocals</span>
                  <span className="text-blue-300">Keith Sweat (Begging R&B)</span>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">Music</span>
                  <span className="text-blue-300">Darius Rucker (Rap Country)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Texture</span>
                  <span className="text-blue-300">Zapp (Talkbox Funk)</span>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-800 text-xs text-neutral-400 italic">
                  "Acoustic country strumming over an 808 beat, with pleading R&B vocals harmonized through a heavy funk talkbox."
                </div>
              </div>
            </div>

            {/* Blend 3 */}
            <div className="bg-black border border-neutral-800 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-white font-semibold mb-4 relative z-10">El Monte Sweet Soul</h3>
              <div className="space-y-3 text-sm relative z-10">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">Vocals</span>
                  <span className="text-rose-300">Barbara Mason (Spoken Soul)</span>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">Delivery</span>
                  <span className="text-rose-300">2Pac (Aggressive Passion)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Aesthetic</span>
                  <span className="text-rose-300">ShadyBoy (Chicano Rap)</span>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-800 text-xs text-neutral-400 italic">
                  "Sweet 70s soul instrumentation interrupted by aggressive, passionate spoken-word interludes dripping with El Monte street slang."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
