/**
 * Procedural Web Audio soundscape for Hawa Mahal:
 * - Soft desert Venturi wind rushing gently through 953 honeycomb jharokhas
 * - Subtle courtyard lotus fountain murmur
 * - Warm harmonic drone chord (Sa–Pa tanpura fifth) when inside the palace
 * Zero external audio files required.
 */
export class HawaMahalSoundscape {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private running = false;

  public start(breezeKmh = 14): void {
    if (this.running || typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 1.2);
    master.connect(ctx.destination);
    this.masterGain = master;

    // Pink-noise buffer for jaali wind & fountain shimmer
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.12;
    }

    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buffer;
    noiseSrc.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 320 + breezeKmh * 16;
    windFilter.Q.value = 2.8;
    this.windFilter = windFilter;

    const windGain = ctx.createGain();
    windGain.gain.value = 0.35 + (breezeKmh / 28) * 0.45;
    this.windGain = windGain;

    noiseSrc.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(master);
    noiseSrc.start();

    // Gentle high fountain sparkle
    const fountainFilter = ctx.createBiquadFilter();
    fountainFilter.type = 'highpass';
    fountainFilter.frequency.value = 2200;
    const fountainGain = ctx.createGain();
    fountainGain.gain.value = 0.09;
    noiseSrc.connect(fountainFilter);
    fountainFilter.connect(fountainGain);
    fountainGain.connect(master);

    // Subtle Rajasthani Sa–Pa harmonic reed shimmer
    const oscSa = ctx.createOscillator();
    oscSa.type = 'sine';
    oscSa.frequency.value = 146.83; // D3
    const oscPa = ctx.createOscillator();
    oscPa.type = 'triangle';
    oscPa.frequency.value = 220.0; // A3
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 420;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.045;

    oscSa.connect(droneFilter);
    oscPa.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(master);
    oscSa.start();
    oscPa.start();

    this.running = true;
  }

  public setBreeze(breezeKmh: number): void {
    if (!this.ctx || !this.windFilter || !this.windGain) return;
    const now = this.ctx.currentTime;
    this.windFilter.frequency.setTargetAtTime(280 + breezeKmh * 18, now, 0.25);
    this.windGain.gain.setTargetAtTime(0.28 + (breezeKmh / 28) * 0.5, now, 0.25);
  }

  public stop(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
    }
    window.setTimeout(() => {
      ctx.close().catch(() => undefined);
    }, 220);
    this.ctx = null;
    this.masterGain = null;
    this.windFilter = null;
    this.windGain = null;
    this.running = false;
  }
}
