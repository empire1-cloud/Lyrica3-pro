/**
 * EMPIRE 1 LEDGER — TypeScript contracts
 * Immutable royalty split pinned per DNA Tag (SynthID).
 * When a flip streams, split propagates back to the parent DNA.
 */

export type StemName =
  | "Raw Human Pipes"
  | "Late-Pocket Drums"
  | "Sub Bass / Acoustic Requinto"
  | "Analog Melody";

export type CulturalMatrix =
  | "LA SGV Chicano Heritage"
  | "Raw Spanish Corridos"
  | "Art Laboe Oldies"
  | "Late-Pocket Street Bounce"
  | "Late Night Cruising Melancholy"
  | "Street-Soft Resilience";

export interface RoyaltySplit {
  beat_maker: number; // 0.50
  vocalist:   number; // 0.30
  lyricist:   number; // 0.20
}

export interface Stem {
  name: StemName;
  level: number; // 0..1 fader
  peak:  number; // 0..1 meter
}

export interface Biometrics {
  vulnerability_index: number;
  phonation_type: string;
  swing_delay_ms: number;
  lung_capacity: number;
  throat_resonance: number;
  emotional_cracks: number;
  aether_voice_map: string;
}

export interface Track {
  id: string;
  dna_tag: string;            // SynthID — e.g. trk_alpha_006_elmonte
  title: string;
  creator: string;
  cultural_matrix: CulturalMatrix | string;
  stems: Stem[];
  biometrics: Biometrics;
  splits: RoyaltySplit;
  streams: number;
  flips: number;
  earnings_usd: number;
  stream_rate_usd: number;    // per stream (e.g. 0.004)
  parent_dna: string | null;  // set when child of a flip
  created_at: string;
}

export interface LedgerEvent {
  id: string;
  kind: "mint" | "flip" | "stream" | "payout";
  dna_tag: string;
  actor: string;
  amount_usd: number;
  note: string;
  timestamp: string;
}

/**
 * Stream payout resolver.
 * For a stream of `amount_usd`, the split is routed to 3 roles.
 * For a FLIP (child), parent DNA receives a residual of the split
 * (enforced by Empire 1 smart contract; front-end mirrors the math).
 */
export function resolvePayout(
  amount: number,
  splits: RoyaltySplit,
  flipResidual = 0.35 // parent cut when a flip streams
): { beat_maker: number; vocalist: number; lyricist: number; parent: number } {
  const parent = +(amount * flipResidual).toFixed(6);
  const remaining = amount - parent;
  return {
    beat_maker: +(remaining * splits.beat_maker).toFixed(6),
    vocalist:   +(remaining * splits.vocalist).toFixed(6),
    lyricist:   +(remaining * splits.lyricist).toFixed(6),
    parent,
  };
}
