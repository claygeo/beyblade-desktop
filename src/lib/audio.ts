import { Settings } from './settings';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private settings: Settings;
  private initialized: boolean = false;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  init(): void {
    if (this.initialized) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3,
    attack: number = 0.01,
    decay: number = 0.1
  ): void {
    if (!this.audioContext || !this.settings.soundEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume * this.settings.collisionVolume, now + attack);
    gainNode.gain.linearRampToValueAtTime(volume * 0.3 * this.settings.collisionVolume, now + attack + decay);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);

    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  private playNoise(duration: number, volume: number = 0.2): void {
    if (!this.audioContext || !this.settings.soundEnabled) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    gainNode.gain.setValueAtTime(volume * this.settings.collisionVolume, this.audioContext.currentTime);

    source.start();
  }

  playCollision(intensity: number = 1): void {
    const baseFreq = 150 + intensity * 50;
    this.playTone(baseFreq, 0.15, 'triangle', 0.4 * intensity, 0.005, 0.05);
    this.playTone(baseFreq * 1.5, 0.1, 'square', 0.2 * intensity, 0.005, 0.03);
    this.playNoise(0.08, 0.15 * intensity);
  }

  playClash(intensity: number = 1): void {
    // Dramatic clash sound - multiple tones
    this.playTone(200, 0.2, 'sawtooth', 0.5 * intensity, 0.005, 0.1);
    this.playTone(400, 0.15, 'square', 0.3 * intensity, 0.01, 0.05);
    this.playTone(100, 0.25, 'triangle', 0.4 * intensity, 0.01, 0.15);
    this.playNoise(0.12, 0.3 * intensity);
  }

  playCritical(): void {
    // High-pitched critical hit
    this.playTone(800, 0.1, 'sine', 0.5, 0.005, 0.02);
    this.playTone(1200, 0.08, 'sine', 0.4, 0.01, 0.02);
    this.playTone(600, 0.15, 'triangle', 0.3, 0.02, 0.05);
    this.playNoise(0.1, 0.25);
  }

  playBurst(): void {
    // Explosion-like burst
    this.playTone(80, 0.4, 'sawtooth', 0.6, 0.01, 0.2);
    this.playTone(120, 0.35, 'square', 0.5, 0.02, 0.15);
    this.playTone(60, 0.5, 'triangle', 0.4, 0.01, 0.3);
    this.playNoise(0.3, 0.5);
    
    // Secondary rumble
    setTimeout(() => {
      this.playTone(50, 0.3, 'sine', 0.3, 0.05, 0.2);
      this.playNoise(0.2, 0.2);
    }, 100);
  }

  playBounce(): void {
    this.playTone(300, 0.08, 'triangle', 0.25, 0.005, 0.03);
    this.playTone(200, 0.1, 'sine', 0.15, 0.01, 0.05);
  }

  playLaunch(): void {
    // Whoosh sound
    if (!this.audioContext || !this.settings.soundEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    
    const now = this.audioContext.currentTime;
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.2);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3 * this.settings.collisionVolume, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.25);

    oscillator.start(now);
    oscillator.stop(now + 0.25);

    this.playNoise(0.15, 0.2);
  }

  playDeath(): void {
    // Sad descending tone
    if (!this.audioContext || !this.settings.soundEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'sine';
    
    const now = this.audioContext.currentTime;
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);

    gainNode.gain.setValueAtTime(0.3 * this.settings.collisionVolume, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }

  playVictory(): void {
    // Victory fanfare
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.4, 0.01, 0.1);
        this.playTone(freq * 0.5, 0.3, 'triangle', 0.2, 0.01, 0.15);
      }, i * 150);
    });
  }
}
