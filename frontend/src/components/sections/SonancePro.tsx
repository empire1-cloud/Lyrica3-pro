import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mic2, Activity, Fingerprint, Users, Box, Settings2, Terminal, Cpu, ShieldCheck, Layers } from 'lucide-react';
import { Track } from '../../types';
import QuickStartGenerator from '../studio/QuickStartGenerator';
import VoiceAuditionGallery from '../studio/VoiceAuditionGallery';
import AssetLibrary from '../studio/AssetLibrary';
import BeatSelector from '../studio/BeatSelector';
import QualityOptions from '../studio/QualityOptions';
import LeyModeler from '../studio/LeyModeler';
import AmbientMaster from '../studio/AmbientMaster';
import MixerConsole from '../studio/MixerConsole';
import SSLVConsole from '../studio/SSLVConsole';
import VulnerabilityPanel from '../studio/VulnerabilityPanel';
import DuoSoulEngine from '../studio/DuoSoulEngine';
import S2Synthesizer from '../studio/S2Synthesizer';
import FlipItRemixInterface from '../studio/FlipItRemixInterface';

export default function SonancePro({ 
  onTrackGenerated,
  sampleRate,
  setSampleRate,
  bitDepth,
  setBitDepth
}: { 
  onTrackGenerated?: (track: Track) => void;
  sampleRate?: string;
  setSampleRate?: (val: any) => void;
  bitDepth?: string;
  setBitDepth?: (val: any) => void;
}) {
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('zephyr');

  return (
    <div className="space-y-24 pb-32 max-w-7xl mx-auto">
      <header className="relative pt-12">
        <div className="architectural-grid absolute inset-0 opacity-[0.03] pointer-events-none" />
        
        <div className="space-y-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="p-2 bg-velvet-purple/10 rounded-lg border border-velvet-purple/20">
              <Sparkles className="w-5 h-5 text-velvet-purple" />
            </div>
            <span className="micro-label !text-velvet-purple tracking-[0.3em]">Phase II: SL Audio Studio</span>
          </motion.div>
          
          <div className="space-y-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-serif font-bold italic tracking-tighter text-white leading-[0.9]"
            >
              The High-Control <br/>
              <span className="premium-gradient-text">Factory</span>
            </motion.h1>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-slate-500 max-w-3xl leading-relaxed font-serif italic"
          >
            A professional-grade studio environment for artists and producers, offering granular control over every aspect of AI-generated music.
          </motion.p>
        </div>

        {/* Decorative Element */}
        <div className="absolute top-0 right-0 w-1/2 aspect-square bg-velvet-purple/5 blur-[160px] rounded-full -z-10 animate-pulse" />
      </header>

      {/* Quick Start Generator */}
      <section className="relative group">
        <div className="absolute -inset-4 bg-gradient-to-r from-velvet-purple/5 to-transparent rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <QuickStartGenerator selectedVoiceName={selectedVoiceName} onTrackGenerated={onTrackGenerated} />
      </section>

      {/* Flip It Remix Interface (SL Universal) */}
      <section className="relative">
        <div className="flex items-center gap-4 mb-12">
          <div className="h-[1px] w-12 bg-white/10" />
          <h2 className="micro-label !text-slate-600">Remix Interface</h2>
        </div>
        <FlipItRemixInterface />
      </section>

      {/* Voice Audition Gallery */}
      <section className="space-y-12">
        <div className="flex items-end justify-between border-b border-white/5 pb-8">
          <div className="space-y-2">
            <h2 className="micro-label !text-slate-600">Vocal Synthesis</h2>
            <p className="text-3xl font-serif font-bold italic text-white">Voice Audition Gallery</p>
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-velvet-purple animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-velvet-purple/40" />
            <div className="w-2 h-2 rounded-full bg-velvet-purple/20" />
          </div>
        </div>
        <VoiceAuditionGallery selectedVoiceName={selectedVoiceName} onVoiceSelect={setSelectedVoiceName} />
      </section>

      {/* New Studio Components */}
      <section className="grid grid-cols-1 gap-24">
        <BeatSelector />
        <AssetLibrary />
        <QualityOptions 
          sampleRate={sampleRate} 
          setSampleRate={setSampleRate} 
          bitDepth={bitDepth} 
          setBitDepth={setBitDepth} 
        />
      </section>
      
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <LeyModeler />
        <AmbientMaster />
      </section>

      <section className="relative">
        <div className="absolute -inset-8 bg-velvet-purple/5 blur-[100px] rounded-full opacity-30 pointer-events-none" />
        <MixerConsole />
      </section>

      <section className="pt-24 border-t border-white/5">
        <SSLVConsole />
      </section>

      {/* Legacy Engine Info (condensed) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-24 border-t border-white/5">
        <motion.div 
          whileHover={{ y: -10 }}
          className="bg-obsidian-900/40 border border-white/5 p-12 rounded-[3rem] backdrop-blur-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
            <Cpu className="w-32 h-32 text-velvet-purple" />
          </div>
          <div className="flex items-center gap-6 mb-10">
            <div className="p-4 bg-velvet-purple/10 rounded-2xl border border-velvet-purple/20 group-hover:scale-110 transition-transform">
              <Activity className="w-7 h-7 text-velvet-purple" />
            </div>
            <h2 className="text-3xl font-serif font-bold italic text-white tracking-tight">EMSS Composer</h2>
          </div>
          <p className="text-xl text-slate-500 mb-10 leading-relaxed font-serif italic">
            The 'El Monte Soul-Somatic' (EMSS) Composer acts as the Creative Director, utilizing a Hybrid Neural-Symbolic Affective Engine.
          </p>
          <div className="space-y-6">
            <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 group-hover:border-velvet-purple/20 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <Terminal className="w-4 h-4 text-velvet-purple" />
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Qualitative Mapping</h4>
              </div>
              <div className="font-mono text-xs text-slate-500 space-y-4">
                <div className="flex justify-between border-b border-white/5 pb-4 group/item">
                  <span className="text-velvet-purple group-hover/item:text-fuchsia-400 transition-colors">"Warm Souldies Chords"</span>
                  <span className="text-slate-600">Maj7/Min9, 200-500Hz bump</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-4 group/item">
                  <span className="text-velvet-purple group-hover/item:text-fuchsia-400 transition-colors">"Cruising Drums"</span>
                  <span className="text-slate-600">72-84 BPM, 10-15ms snare drag</span>
                </div>
                <div className="flex justify-between group/item">
                  <span className="text-velvet-purple group-hover/item:text-fuchsia-400 transition-colors">"Hurt-Girl Mirror Energy"</span>
                  <span className="text-slate-600">"closed-mouth" resonance</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -10 }}
          className="bg-obsidian-900/40 border border-white/5 p-12 rounded-[3rem] backdrop-blur-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
            <ShieldCheck className="w-32 h-32 text-velvet-purple" />
          </div>
          <div className="flex items-center gap-6 mb-10">
            <div className="p-4 bg-velvet-purple/10 rounded-2xl border border-velvet-purple/20 group-hover:scale-110 transition-transform">
              <Fingerprint className="w-7 h-7 text-velvet-purple" />
            </div>
            <h2 className="text-3xl font-serif font-bold italic text-white tracking-tight">Ethical & Authentic</h2>
          </div>
          <div className="space-y-8">
            <div className="space-y-3">
              <h3 className="text-xl font-serif font-bold italic text-white tracking-tight">Originality Guardrails</h3>
              <p className="text-slate-500 leading-relaxed font-serif italic">Similarity Scrubber enforces a strict 30% departure from training data to ensure unique compositions.</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-serif font-bold italic text-white tracking-tight">Provenance Watermarking</h3>
              <p className="text-slate-500 leading-relaxed font-serif italic">Immutable DNA Signature injected into metadata for ethical and legally compliant output tracking.</p>
            </div>
            <div className="pt-8 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-velvet-purple" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Output Quality</span>
                </div>
                <span className="font-mono text-[10px] text-velvet-purple bg-velvet-purple/10 px-3 py-1.5 rounded-lg border border-velvet-purple/20">48kHz / 24-bit</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Human-Centric Feature Set */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-24 border-t border-white/5">
        <VulnerabilityPanel />
        <DuoSoulEngine />
      </section>

      {/* S2 Synthesizer */}
      <section className="pt-24 border-t border-white/5 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-velvet-purple/50 to-transparent" />
        <S2Synthesizer />
      </section>

    </div>
  );
}
