import Matter from 'matter-js';
import { Beyblade, BEYBLADE_CONFIGS } from './beyblade';
import { Settings } from './settings';
import { getRandomLaunchPosition } from './physics';
import { AudioManager } from './audio';
import { ParticleSystem } from './particles';

const BEYBLADE_IMAGES = [
  '/src/assets/beyblades/beyblade-1.png',
  '/src/assets/beyblades/beyblade-2.png',
  '/src/assets/beyblades/beyblade-3.png',
  '/src/assets/beyblades/beyblade-4.png',
  '/src/assets/beyblades/beyblade-5.png',
  '/src/assets/beyblades/beyblade-6.png',
];

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private settings: Settings;
  private beyblades: Beyblade[] = [];
  private loadedImages: HTMLImageElement[] = [];
  private audio: AudioManager;
  private particles: ParticleSystem;
  
  // Matter.js
  private engine: Matter.Engine;
  private world: Matter.World;
  private walls: Matter.Body[] = [];
  
  private isRunning: boolean = false;
  private battleInProgress: boolean = false;
  private winner: Beyblade | null = null;
  
  private arenaWidth: number = 0;
  private arenaHeight: number = 0;
  private centerX: number = 0;
  private centerY: number = 0;

  constructor(canvas: HTMLCanvasElement, settings: Settings) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.settings = settings;
    this.audio = new AudioManager(settings);
    this.particles = new ParticleSystem();
    
    // Create Matter.js engine
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
    });
    this.world = this.engine.world;
    
    // Set up collision events
    Matter.Events.on(this.engine, 'collisionStart', (event: Matter.IEventCollision<Matter.Engine>) => {
      this.handleCollisions(event.pairs);
    });
    
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  async init(): Promise<void> {
    this.resizeCanvas();
    await this.loadImages();
    this.createWalls();
    this.startGameLoop();
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.arenaWidth = this.canvas.width;
    this.arenaHeight = this.canvas.height - this.settings.taskbarHeight;
    this.centerX = this.arenaWidth / 2;
    this.centerY = this.arenaHeight / 2;
    
    // Recreate walls on resize
    if (this.walls.length > 0) {
      Matter.Composite.remove(this.world, this.walls);
      this.createWalls();
    }
  }
  
  private createWalls(): void {
    const thickness = 50;
    const taskbarY = this.canvas.height - this.settings.taskbarHeight;
    
    this.walls = [
      // Top
      Matter.Bodies.rectangle(this.arenaWidth / 2, -thickness / 2, this.arenaWidth, thickness, { 
        isStatic: true, 
        restitution: 0.8,
        label: 'wall-top'
      }),
      // Bottom (taskbar)
      Matter.Bodies.rectangle(this.arenaWidth / 2, taskbarY + thickness / 2, this.arenaWidth, thickness, { 
        isStatic: true, 
        restitution: 0.8,
        label: 'wall-bottom'
      }),
      // Left
      Matter.Bodies.rectangle(-thickness / 2, taskbarY / 2, thickness, taskbarY, { 
        isStatic: true, 
        restitution: 0.8,
        label: 'wall-left'
      }),
      // Right
      Matter.Bodies.rectangle(this.arenaWidth + thickness / 2, taskbarY / 2, thickness, taskbarY, { 
        isStatic: true, 
        restitution: 0.8,
        label: 'wall-right'
      }),
    ];
    
    Matter.Composite.add(this.world, this.walls);
  }

  private handleCollisions(pairs: Matter.Pair[]): void {
    for (const pair of pairs) {
      const labelA = pair.bodyA.label;
      const labelB = pair.bodyB.label;
      
      // Check if both are beyblades
      if (labelA.startsWith('beyblade-') && labelB.startsWith('beyblade-')) {
        const idA = parseInt(labelA.split('-')[1]);
        const idB = parseInt(labelB.split('-')[1]);
        
        const beybladeA = this.beyblades.find(b => b.id === idA);
        const beybladeB = this.beyblades.find(b => b.id === idB);
        
        if (beybladeA && beybladeB && beybladeA.isAlive && beybladeB.isAlive) {
          this.onBeybladeCollision(beybladeA, beybladeB, pair);
        }
      }
      
      // Wall collision sound
      if (labelA.startsWith('wall-') || labelB.startsWith('wall-')) {
        const beyblade = labelA.startsWith('beyblade-') 
          ? this.beyblades.find(b => b.id === parseInt(labelA.split('-')[1]))
          : this.beyblades.find(b => b.id === parseInt(labelB.split('-')[1]));
        
        if (beyblade && beyblade.isAlive) {
          this.audio.playBounce();
          const contact = pair.collision.supports[0];
          if (contact) {
            this.particles.spawnWallHitEffect(contact.x, contact.y, { x: 0, y: -1 });
          }
        }
      }
    }
  }
  
  private onBeybladeCollision(a: Beyblade, b: Beyblade, pair: Matter.Pair): void {
    const relVelX = a.vx - b.vx;
    const relVelY = a.vy - b.vy;
    const relSpeed = Math.sqrt(relVelX * relVelX + relVelY * relVelY);
    const intensity = Math.min(3, relSpeed / 5);
    
    // Collision point
    const contact = pair.collision.supports[0] || { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    
    // Check for critical hit
    const isCritical = Math.random() < this.settings.criticalHitChance;
    
    // Check for burst
    const isBurst = relSpeed > 12 && Math.random() < this.settings.burstChance;
    
    // Apply spin transfer
    a.applyCollisionEffects(b, this.settings);
    
    // Particles and audio
    if (isBurst) {
      const loser = a.spinSpeed < b.spinSpeed ? a : b;
      loser.burst();
      this.audio.playBurst();
      this.particles.spawnBurstExplosion(loser.x, loser.y);
    } else if (isCritical) {
      this.audio.playCritical();
      this.particles.spawnCriticalHitEffect(contact.x, contact.y);
    } else if (intensity > 1.5) {
      this.audio.playClash(intensity);
      this.particles.spawnClashEffect(contact.x, contact.y, intensity);
    } else {
      this.audio.playCollision(intensity);
      this.particles.spawnCollisionSparks(contact, { x: 0, y: 0 }, intensity);
    }
    
    // Screen shake on big hits
    if (intensity > 1.5) {
      this.screenShake(intensity * 2);
    }
  }

  async reloadImages(): Promise<void> {
    await this.loadImages();
  }

  private async loadImages(): Promise<void> {
    const defaultPromises = BEYBLADE_IMAGES.map((src) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(this.createPlaceholderImage(Math.random()));
        img.src = src;
      });
    });

    const defaultImages = await Promise.all(defaultPromises);
    
    const customPromises = this.settings.customImages.map((base64, index) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(this.createPlaceholderImage(index * 0.1));
        img.src = base64;
      });
    });
    
    const customImages = await Promise.all(customPromises);
    this.loadedImages = [...customImages, ...defaultImages];
  }

  private createPlaceholderImage(seed: number): HTMLImageElement {
    const size = 200;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const hue = Math.floor(seed * 360);
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, `hsl(${hue}, 70%, 50%)`);
    gradient.addColorStop(0.5, `hsl(${(hue + 40) % 360}, 70%, 35%)`);
    gradient.addColorStop(1, `hsl(${(hue + 180) % 360}, 70%, 60%)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 4;
    const bladeCount = 3 + Math.floor(seed * 4);
    for (let i = 0; i < bladeCount; i++) {
      const angle = (i / bladeCount) * Math.PI * 2 + seed;
      ctx.beginPath();
      ctx.moveTo(size / 2 + Math.cos(angle) * 20, size / 2 + Math.sin(angle) * 20);
      ctx.lineTo(
        size / 2 + Math.cos(angle + 0.3) * (size / 2 - 15),
        size / 2 + Math.sin(angle + 0.3) * (size / 2 - 15)
      );
      ctx.stroke();
    }

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 20, 0, Math.PI * 2);
    ctx.fill();

    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }

  launchBattle(): void {
    this.audio.init();
    
    // Clear old beyblades from physics world
    for (const beyblade of this.beyblades) {
      Matter.Composite.remove(this.world, beyblade.body);
    }
    
    this.beyblades = [];
    this.particles.clear();
    this.winner = null;
    this.battleInProgress = true;

    const winnerBanner = document.getElementById('winner-banner');
    winnerBanner?.classList.add('hidden');

    const count = Math.min(this.settings.beybladeCount, this.settings.maxBeyblades);
    const shuffledConfigs = [...BEYBLADE_CONFIGS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < count; i++) {
      const imageIndex = i % this.loadedImages.length;
      const config = shuffledConfigs[i % shuffledConfigs.length];
      
      const launch = getRandomLaunchPosition(
        this.arenaWidth,
        this.canvas.height,
        this.settings.taskbarHeight,
        100,
        i,
        count
      );
      
      const beyblade = new Beyblade(
        i,
        this.loadedImages[imageIndex],
        config,
        this.settings,
        launch.x,
        launch.y
      );

      // Add to physics world
      Matter.Composite.add(this.world, beyblade.body);

      // Launch with delay
      setTimeout(() => {
        beyblade.launch(launch.vx, launch.vy);
        this.audio.playLaunch();
        this.particles.spawnLaunchEffect(launch.x, launch.y, { x: launch.vx, y: launch.vy });
      }, i * 150);

      this.beyblades.push(beyblade);
    }
  }

  private startGameLoop(): void {
    this.isRunning = true;
    let lastTime = performance.now();
    
    const loop = () => {
      if (!this.isRunning) return;
      
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;
      
      this.update(delta);
      this.render();
      
      requestAnimationFrame(loop);
    };
    
    loop();
  }

  private update(delta: number): void {
    // Update physics
    Matter.Engine.update(this.engine, Math.min(delta, 32));
    
    if (!this.battleInProgress) return;

    // Update all beyblades
    for (const beyblade of this.beyblades) {
      beyblade.update(this.settings, this.centerX, this.centerY);
    }

    // Update particles
    this.particles.update(delta / 1000);

    // Check for winner
    const aliveBeyblades = this.beyblades.filter(b => b.isAlive);
    const hasLaunched = this.beyblades.some(b => b.state !== 'launching');
    
    if (aliveBeyblades.length <= 1 && this.beyblades.length > 0 && hasLaunched) {
      this.endBattle(aliveBeyblades[0] || null);
    }
  }

  private screenShake(intensity: number): void {
    const duration = 100;
    const startTime = performance.now();
    
    const shake = () => {
      const elapsed = performance.now() - startTime;
      if (elapsed > duration) {
        this.canvas.style.transform = '';
        return;
      }
      
      const progress = elapsed / duration;
      const currentIntensity = intensity * (1 - progress);
      const offsetX = (Math.random() - 0.5) * currentIntensity;
      const offsetY = (Math.random() - 0.5) * currentIntensity;
      
      this.canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      requestAnimationFrame(shake);
    };
    
    shake();
  }

  private endBattle(winner: Beyblade | null): void {
    if (!this.battleInProgress) return;
    
    this.battleInProgress = false;
    this.winner = winner;

    if (winner) {
      this.audio.playVictory();
      this.particles.spawnVictoryBurst(winner.x, winner.y);
    }

    setTimeout(() => {
      const winnerBanner = document.getElementById('winner-banner');
      const winnerText = winnerBanner?.querySelector('.winner-text');
      
      if (winnerText) {
        winnerText.textContent = winner 
          ? `🏆 ${winner.name} Wins! 🏆`
          : "💥 It's a Draw! 💥";
      }
      winnerBanner?.classList.remove('hidden');
    }, 800);
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.draw(this.ctx);

    for (const beyblade of this.beyblades) {
      beyblade.draw(this.ctx);
    }

    // Winner glow
    if (this.winner && this.winner.isAlive) {
      this.ctx.save();
      
      const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
      
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 4;
      this.ctx.shadowColor = '#FFD700';
      this.ctx.shadowBlur = 30 * pulse;
      this.ctx.globalAlpha = pulse;
      
      this.ctx.beginPath();
      this.ctx.arc(this.winner.x, this.winner.y, this.winner.radius + 15, 0, Math.PI * 2);
      this.ctx.stroke();
      
      this.ctx.restore();
    }
  }

  stop(): void {
    this.isRunning = false;
  }
}