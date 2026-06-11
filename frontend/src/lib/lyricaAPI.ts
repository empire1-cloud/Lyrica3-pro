/**
 * Lyrica 3 Pro - API Integration Layer
 * Connects frontend studio to Suno/Lyrica3 backend inference engines
 */

import type { Track, GenerationRequest, RemixRequest, ExportRequest } from '@/types/music';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://api.lyrica3pro.com';
const SUNO_API_KEY = process.env.REACT_APP_SUNO_API_KEY;

interface APIError {
  status: number;
  message: string;
  code: string;
}

class LyricaAPI {
  /**
   * Generate music from emotional parameters
   * Maps Soulfire Engine controls to inference API
   */
  async generateTrack(request: GenerationRequest): Promise<Track> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        },
        body: JSON.stringify({
          // Emotional Mapping
          emotion: {
            type: request.emotion,
            intensity: request.intensity,
          },
          // Biometric Realism
          vocals: {
            breathIntensity: request.vocals.breathIntensity,
            vocalFryAmount: request.vocals.vocalFryAmount,
            emotionalBreakFreq: request.vocals.emotionalBreakFreq,
            proximityEffect: request.vocals.proximityEffect,
            closedMouthResonance: request.vocals.closedMouthResonance,
          },
          // Rhythm
          drums: {
            swing: request.drums.swing,
            snareDrag: request.drums.snareDrag,
            grooveType: request.drums.grooveType,
          },
          // Instrumentation
          instrumentation: {
            chordQuality: request.instrumentation.chordQuality,
            warmthBoost: request.instrumentation.warmthBoost,
            analogSaturation: request.instrumentation.analogSaturation,
            frequencyBump: request.instrumentation.frequencyBump,
          },
          // Session
          bpm: request.bpm,
          key: request.key,
          vocalPersona: request.vocalPersona,
        }),
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      const data = await response.json();

      // Attach DNA Tag
      return {
        ...data,
        dnaTag: {
          assetId: data.id,
          creatorId: request.userId,
          parentAssetId: null,
          trackHash: this.generateHash(data.audio),
          createdAt: new Date().toISOString(),
          royaltyRule: 'exponential_decay',
        },
      };
    } catch (error) {
      console.error('Generation failed:', error);
      throw error;
    }
  }

  /**
   * Flip emotion to opposite
   * Regenerate with inverted emotional parameters
   */
  async flipEmotion(trackId: string, newEmotion: string): Promise<Track> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/remix/flip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        },
        body: JSON.stringify({
          sourceTrackId: trackId,
          targetEmotion: newEmotion,
        }),
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Flip failed:', error);
      throw error;
    }
  }

  /**
   * Remix track with specified parameters
   * Options: keep-lyrics, stem-isolate, variations, tempo-shift
   */
  async remixTrack(trackId: string, remixType: string): Promise<Track[]> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/remix/${remixType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        },
        body: JSON.stringify({
          sourceTrackId: trackId,
        }),
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Remix failed:', error);
      throw error;
    }
  }

  /**
   * Blend two versions with ratio control
   * Real-time morph between tracks
   */
  async blendTracks(
    trackA: string,
    trackB: string,
    ratio: number
  ): Promise<Track> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/blend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        },
        body: JSON.stringify({
          trackAId: trackA,
          trackBId: trackB,
          ratio,
        }),
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Blend failed:', error);
      throw error;
    }
  }

  /**
   * Export track as 48KHz/24-bit WAV
   * Attach DNA tag to metadata
   */
  async exportTrack(trackId: string, format: 'wav' | 'mp3' = 'wav'): Promise<Blob> {
    try {
      const response = await fetch(`${API_BASE}/api/v1/export/${trackId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
        },
        body: JSON.stringify({ format }),
      });

      if (!response.ok) {
        throw await this.handleError(response);
      }

      return await response.blob();
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * Get DNA-tagged remix history
   * Shows creator attribution and royalty trails
   */
  async getRemixHistory(trackId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/tracks/${trackId}/history`,
        {
          headers: {
            'Authorization': `Bearer ${SUNO_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw await this.handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('History fetch failed:', error);
      return [];
    }
  }

  /**
   * Calculate micro-royalties for remix
   * Based on DNA tag lineage and exponential decay
   */
  async calculateRoyalties(trackId: string): Promise<{
    originalCreator: number;
    remixers: Array<{ id: string; amount: number }>;
  }> {
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/tracks/${trackId}/royalties`,
        {
          headers: {
            'Authorization': `Bearer ${SUNO_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw await this.handleError(response);
      }

      return await response.json();
    } catch (error) {
      console.error('Royalty calculation failed:', error);
      return { originalCreator: 0, remixers: [] };
    }
  }

  // ===== Helper Methods =====

  private async handleError(response: Response): Promise<APIError> {
    const data = await response.json().catch(() => ({}));
    return {
      status: response.status,
      message: data.message || response.statusText,
      code: data.code || 'UNKNOWN_ERROR',
    };
  }

  private generateHash(audio: ArrayBuffer | string): string {
    // Simple hash for now - replace with proper SHA256 in production
    const str = typeof audio === 'string' ? audio : JSON.stringify(audio);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }
}

export const lyricaAPI = new LyricaAPI();

/**
 * Web Audio API Integration
 * Real-time waveform visualization and playback
 */
export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private oscillators: OscillatorNode[] = [];

  async initialize(): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
    }
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(128);
    }
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getWaveformData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(128);
    }
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    try {
      const decoded = await this.audioContext!.decodeAudioData(audioBuffer);
      const source = this.audioContext!.createBufferSource();
      source.buffer = decoded;
      source.connect(this.analyser!);
      this.analyser!.connect(this.audioContext!.destination);
      source.start(0);
    } catch (error) {
      console.error('Audio playback failed:', error);
    }
  }

  stop(): void {
    this.oscillators.forEach(osc => osc.stop());
    this.oscillators = [];
  }
}

export const audioEngine = new AudioEngine();
