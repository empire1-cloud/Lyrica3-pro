// High-End Generative Web Audio API Synth Engine for SL Universal Public Demo
// Synthesizes procedural music matching the track's Vibe, BPM, and Weather/Bio context.

export class SLUniversalSynth {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private schedulerTimer: number | null = null;
  private currentBpm: number = 72;
  private currentScale: 'major' | 'minor' = 'minor';
  private weatherNoise: AudioWorkletNode | ScriptProcessorNode | null = null;
  private weatherFilter: BiquadFilterNode | null = null;
  private masterVolume: GainNode | null = null;
  private currentAtmosphere: string = 'neutral';

  constructor() {
    // Lazy initialize context on user interaction to abide by browser security policies
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);
      this.setupWeatherChannel();
    } catch (e) {
      console.error("Web Audio API is not supported in this browser:", e);
    }
  }

  public setVolume(volume: number) {
    if (!this.ctx || !this.masterVolume) return;
    this.masterVolume.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.1);
  }

  private setupWeatherChannel() {
    if (!this.ctx || !this.masterVolume) return;

    // Create synthesized rain/atmospheric wind noise using white noise algorithm
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.weatherFilter = this.ctx.createBiquadFilter();
    this.weatherFilter.type = 'lowpass';
    this.weatherFilter.frequency.setValueAtTime(400, this.ctx.currentTime);

    const weatherGain = this.ctx.createGain();
    weatherGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // default muted until rain sync

    whiteNoise.connect(this.weatherFilter);
    this.weatherFilter.connect(weatherGain);
    weatherGain.connect(this.masterVolume);
    whiteNoise.start();

    this.weatherNoise = whiteNoise as any; // hold reference
    (this as any).weatherGain = weatherGain;
  }

  public updateAtmosphere(weather: string, bpm: number, emotionalMode: 'Pain' | 'Playful' | 'Mirror') {
    this.init();
    if (!this.ctx) return;

    this.currentBpm = bpm || 72;
    this.currentScale = emotionalMode === 'Playful' ? 'major' : 'minor';
    this.currentAtmosphere = weather?.toLowerCase() || 'neutral';

    const gainNode = (this as any).weatherGain as GainNode;
    if (gainNode && this.weatherFilter) {
      if (this.currentAtmosphere.includes('rain') || this.currentAtmosphere.includes('storm')) {
        gainNode.gain.setTargetAtTime(0.12, this.ctx.currentTime, 1.5);
        this.weatherFilter.frequency.setTargetAtTime(320, this.ctx.currentTime, 1.0);
      } else if (this.currentAtmosphere.includes('cosmic') || this.currentAtmosphere.includes('space')) {
        gainNode.gain.setTargetAtTime(0.08, this.ctx.currentTime, 2.0);
        this.weatherFilter.frequency.setTargetAtTime(800, this.ctx.currentTime, 2.0); // celestial wind sweep
      } else {
        gainNode.gain.setTargetAtTime(0.0, this.ctx.currentTime, 1.0);
      }
    }
  }

  public play() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.isRunning) return;
    this.isRunning = true;

    let nextNoteTime = this.ctx ? this.ctx.currentTime : 0;
    let step = 0;

    const notesMajor = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00]; // Pentatonic C Major
    const notesMinor = [116.54, 130.81, 138.59, 164.81, 185.00, 233.08, 261.63, 277.18, 329.63, 370.00]; // Pentatonic B-flat Minor (moody)

    const scheduleNextNotes = () => {
      if (!this.ctx || !this.isRunning) return;

      const secondsPerBeat = 60.0 / this.currentBpm;
      const stepDuration = secondsPerBeat / 2; // eighth notes

      while (nextNoteTime < this.ctx.currentTime + 0.1) {
        // Play generative textures
        if (step % 8 === 0) {
          // Lush chord pad
          this.triggerPadNote(notesMinor[0] / 2, nextNoteTime, stepDuration * 8);
          this.triggerPadNote(notesMinor[2], nextNoteTime, stepDuration * 8);
          this.triggerPadNote(notesMinor[4], nextNoteTime, stepDuration * 8);
        }

        // Random lead melodies
        if (Math.random() < 0.4 && (step % 2 === 0)) {
          const notes = this.currentScale === 'major' ? notesMajor : notesMinor;
          const randomNote = notes[Math.floor(Math.random() * notes.length)] * (Math.random() < 0.2 ? 2 : 1);
          this.triggerLeadNote(randomNote, nextNoteTime, stepDuration);
        }

        // Soft chillout pulse (Lofi kick)
        if (step % 4 === 0) {
          this.triggerKick(nextNoteTime);
        }

        // Ambient hihat on offbeats
        if (step % 4 === 2) {
          this.triggerHihat(nextNoteTime);
        }

        nextNoteTime += stepDuration;
        step = (step + 1) % 16;
      }

      this.schedulerTimer = window.setTimeout(scheduleNextNotes, 25);
    };

    scheduleNextNotes();
  }

  public stop() {
    this.isRunning = false;
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  private triggerPadNote(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.masterVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    // Warm soft warm envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.04, time + duration * 0.3);
    gain.gain.setValueAtTime(0.04, time + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    // Filter to sweeten sound
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    osc.start(time);
    osc.stop(time + duration);
  }

  private triggerLeadNote(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.masterVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Quick attack, gentle decay
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.05, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    // Tiny lowpass sweep
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1200, time);

    osc.connect(lp);
    lp.connect(gain);
    gain.connect(this.masterVolume);

    osc.start(time);
    osc.stop(time + duration);
  }

  private triggerKick(time: number) {
    if (!this.ctx || !this.masterVolume) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterVolume);

    osc.start(time);
    osc.stop(time + 0.15);
  }

  private triggerHihat(time: number) {
    if (!this.ctx || !this.masterVolume) return;

    // Create highpass-filtered synthesized metallic noise click
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.015, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterVolume);

    noise.start(time);
    noise.stop(time + 0.04);
  }
}

// Global instance to handle transitions across components easily
export const slSynth = new SLUniversalSynth();
