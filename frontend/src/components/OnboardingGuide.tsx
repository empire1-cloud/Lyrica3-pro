import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Fingerprint, DollarSign, Share2, ChevronRight } from 'lucide-react';

const STEPS = [
  {
    icon: Zap,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10 border-pink-500/20',
    title: 'Step 1 — Hit the Vibe Bar',
    subtitle: 'Choose your genre + mood.',
    body: 'Pick from SGV Oldies, Corridos, R&B, Trap Soul, and more. Your vibe is the seed — the Soulfire Engine handles everything else.',
  },
  {
    icon: Fingerprint,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    title: 'Step 2 — Emotional Math',
    subtitle: 'Dial in your vulnerability.',
    body: 'Use the Vulnerability Controls to set vocal fry, emotional fragility, and proximity. The higher the dial, the more the AI bleeds through the song.',
  },
  {
    icon: Fingerprint,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Step 3 — Your DNA Tag',
    subtitle: 'Every track gets a unique fingerprint.',
    body: 'When you generate, your track is minted on the Empire 1 Ledger with a SynthID DNA tag — ◈◉◇⟡◈. This is your proof of ownership. Forever.',
  },
  {
    icon: DollarSign,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'Step 4 — Revenue Is Yours',
    subtitle: 'Flip culture. Stack royalties.',
    body: 'Every stream pays $0.004. When someone flips your track, you keep 50-75% via the Bloodline Royalty Chain. Hit Share to spread your DNA.',
  },
];

export default function OnboardingGuide({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const finish = () => {
    localStorage.setItem('e1_onboarded', '1');
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/85 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-pink-500' : i < step ? 'w-3 bg-pink-500/40' : 'w-3 bg-neutral-800'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={finish}
              className="text-neutral-500 hover:text-white transition-colors"
              aria-label="Skip"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className={`inline-flex p-3 rounded-xl border ${current.bg}`}>
                  <Icon className={`w-6 h-6 ${current.color}`} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">{current.title}</h2>
                  <p className="text-pink-400 text-sm font-medium mt-0.5">{current.subtitle}</p>
                </div>
                <p className="text-neutral-300 text-sm leading-relaxed">{current.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 border border-neutral-700 text-neutral-300 text-sm font-bold rounded-xl hover:border-neutral-500 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={isLast ? finish : () => setStep(s => s + 1)}
              className="flex-1 py-3 bg-pink-500 hover:bg-pink-400 text-black text-sm font-black rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLast ? (
                <>
                  <Share2 className="w-4 h-4" />
                  Let's Create
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
