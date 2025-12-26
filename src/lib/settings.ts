export type BattleDuration = 'quick' | 'normal' | 'extended' | 'endless';
export type BeybladeSize = 'small' | 'normal' | 'large' | 'giant';

export class Settings {
  // User configurable - NEW DEFAULTS
  beybladeCount: number = 5;
  soundEnabled: boolean = true;
  battleDuration: BattleDuration = 'endless';  // Changed from 'normal'
  beybladeSize: BeybladeSize = 'large';        // Changed from 'normal'
  customImages: string[] = [];
  
  // Spin settings
  readonly maxRotationSpeed: number = 25;
  readonly spinSpeedMultiplier: number = 1.0;
  readonly minSpinSpeed: number = 0.5;
  
  // How fast spin decays
  get spinDecay(): number {
    switch (this.battleDuration) {
      case 'quick': return 0.9985;
      case 'normal': return 0.9993;
      case 'extended': return 0.9997;
      case 'endless': return 0.9999;
    }
  }
  
  get beybladeSize_pixels(): number {
    switch (this.beybladeSize) {
      case 'small': return 60;
      case 'normal': return 100;
      case 'large': return 140;
      case 'giant': return 200;
    }
  }
  
  // Matter.js physics
  readonly restitution: number = 0.95;
  readonly friction: number = 0.0001;
  readonly frictionAir: number = 0.0002;
  readonly density: number = 0.01;
  
  // Arena forces
  readonly centerPull: number = 0.002;
  readonly orbitForce: number = 0.004;
  
  // Collision effects
  readonly knockbackMultiplier: number = 1.8;
  readonly spinTransferRate: number = 0.06;
  readonly collisionSpinDrain: number = 0.02;
  
  // Special events
  readonly criticalHitChance: number = 0.10;
  readonly burstChance: number = 0.02;
  readonly staminaSurgeChance: number = 0.08;
  
  // Arena
  readonly taskbarHeight: number = 48;
  
  // Audio
  readonly collisionVolume: number = 0.3;
  readonly spinVolume: number = 0.1;
  
  // Performance
  readonly maxBeyblades: number = 12;
  
  // Custom image limits
  readonly maxCustomImageSize: number = 500000;  // 500KB
  readonly maxCustomImages: number = 20;

  constructor() {
    this.loadSettings();
  }

  loadSettings(): void {
    try {
      const saved = localStorage.getItem('beyblade-settings');
      if (saved) {
        const data = JSON.parse(saved);
        this.beybladeCount = data.beybladeCount ?? this.beybladeCount;
        this.soundEnabled = data.soundEnabled ?? this.soundEnabled;
        this.battleDuration = data.battleDuration ?? this.battleDuration;
        this.beybladeSize = data.beybladeSize ?? this.beybladeSize;
        this.customImages = data.customImages ?? this.customImages;
      }
    } catch (e) {
      console.warn('Could not load settings:', e);
    }
  }

  saveSettings(): void {
    try {
      localStorage.setItem('beyblade-settings', JSON.stringify({
        beybladeCount: this.beybladeCount,
        soundEnabled: this.soundEnabled,
        battleDuration: this.battleDuration,
        beybladeSize: this.beybladeSize,
        customImages: this.customImages,
      }));
    } catch (e) {
      console.warn('Could not save settings:', e);
    }
  }
  
  addCustomImage(base64: string): void {
    if (this.customImages.length < this.maxCustomImages) {
      this.customImages.push(base64);
      this.saveSettings();
    }
  }
  
  removeCustomImage(index: number): void {
    this.customImages.splice(index, 1);
    this.saveSettings();
  }
  
  clearCustomImages(): void {
    this.customImages = [];
    this.saveSettings();
  }
}