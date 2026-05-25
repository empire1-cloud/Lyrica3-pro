import React, { useState } from 'react';
import { Waves, Loader2, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { generate } from '../../lib/api';

const AMBIENT_PRESETS = [
  { label: 'Derelict Starship', genre: 'Ambient Techno', mood: 'Cruising Melancholy', description: 'Low-frequency hums, intermittent static, gravitational ripples inside a silent starship.' },
  { label: 'Cyberpunk Rain', genre: 'Trap Soul', mood: 'Soft Menace', description: 'Heavy rain on neon pavement, distant sirens, flying vehicle hum.' },
  { label: 'Ancient Forest', genre: 'SGV Oldies', mood: 'Porch-Light Grief', description: 'Dense old-growth forest at twilight — wind, owl hoots, rustling.' },
  { label: 'Haunted Asylum', genre: 'Drill', mood: 'Late-Night Honesty', description: 'Metallic scraping, dripping water, faint whispers in abandoned halls.' },
  { label: 'Zen Garden', genre: 'Bossa Nova', mood: 'After-Hours Prayer', description: 'Bamboo water fountain, gentle wind chimes, singing bowl resonance.' },
];

export function AmbientEngine() {
  const [selectedPreset, setSelectedPreset] = useState(AMBIENT_PRESETS[0]);
  const [customDescription, setCustomDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateAmbient = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    const description = customDescription.trim() || selectedPreset.description;

    try {
      const data = await generate({
        lyrics: description,
        genre: selectedPreset.genre,
        mood: selectedPreset.mood,
        title: `Ambient: ${selectedPreset.label}`,
        vulnerability_override: 0.2,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Ambient generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <Waves className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Ambient Engine</h3>
          <p className="text-xs text-slate-500">Continuous soundscape generation via Soulfire backend</p>
        </div>
      </div>

      {/* Preset selector */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-white/50 uppercase tracking-wider">Soundscape Preset</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AMBIENT_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setSelectedPreset(p); setCustomDescription(''); setResult(null); setError(null); }}
              className={`text-left p-3 rounded-xl border text-xs transition-all ${
                selectedPreset.label === p.label
                  ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="font-bold mb-1">{p.label}</div>
              <div className="text-[10px] text-slate-500 leading-relaxed">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom description */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-white/50 uppercase tracking-wider">Custom Soundscape Description (optional)</label>
        <textarea
          value={customDescription}
          onChange={(e) => setCustomDescription(e.target.value)}
          placeholder="Describe your ambient scene — environment, textures, loop elements..."
          className="w-full h-20 bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Ambient Minted — {result.dna_tag || result.title}
          </div>
          {result.audio_url && (
            <audio controls src={result.audio_url} className="w-full" />
          )}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generateAmbient}
        disabled={isGenerating}
        className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm tracking-widest uppercase"
      >
        {isGenerating ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Generating Soundscape...</>
        ) : (
          <><Waves className="w-5 h-5" /> Generate Ambient Layer</>
        )}
      </button>
    </div>
  );
}

export default AmbientEngine;
