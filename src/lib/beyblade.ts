import Matter from 'matter-js';
import { Settings } from './settings';

export interface BeybladeStats {
  name: string;
  attack: number;
  defense: number;
  stamina: number;
  weight: number;
}

export const BEYBLADE_CONFIGS: BeybladeStats[] = [
  { name: 'Storm Phoenix', attack: 8, defense: 4, stamina: 6, weight: 0.95 },
  { name: 'Shadow Hydra', attack: 5, defense: 8, stamina: 7, weight: 1.2 },
  { name: 'Frost Dragon', attack: 7, defense: 5, stamina: 7, weight: 1.0 },
  { name: 'Solar Lion', attack: 4, defense: 7, stamina: 9, weight: 1.1 },
  { name: 'Venom Serpent', attack: 10, defense: 3, stamina: 4, weight: 0.85 },
  { name: 'Thunder Eagle', attack: 6, defense: 6, stamina: 8, weight: 1.0 },
  { name: 'Crimson Wolf', attack: 9, defense: 5, stamina: 5, weight: 0.9 },
  { name: 'Jade Turtle', attack: 3, defense: 10, stamina: 8, weight: 1.3 },
  { name: 'Azure Phoenix', attack: 7, defense: 6, stamina: 6, weight: 0.95 },
  { name: 'Obsidian Wyvern', attack: 8, defense: 7, stamina: 4, weight: 1.15 },
  { name: 'Golden Pegasus', attack: 6, defense: 5, stamina: 10, weight: 1.0 },
  { name: 'Silver Cerberus', attack: 7, defense: 7, stamina: 5, weight: 1.05 },
];

export type BeybladeState = 'launching' | 'spinning' | 'wobbling' | 'dying' | 'dead' | 'burst';

export class Beyblade {
  id: number;
  name: string;
  body: Matter.Body;
  rotation: number;
  spinSpeed: number;
  maxSpinSpeed: number;
  image: HTMLImageElement;
  stats: BeybladeStats;
  isAlive: boolean;
  radius: number;
  state: BeybladeState;
  
  wobblePhase: number;
  wobbleIntensity: number;
  deathAnimation: number;
  
  hadStaminaSurge: boolean;
  burstPieces: BurstPiece[];
  
  trail: { x: number; y: number }[];
  maxTrailLength: number;
  
  orbitDirection: number;
  
  constructor(
    id: number,
    image: HTMLImageElement,
    stats: BeybladeStats,
    settings: Settings,
    x: number,
    y: number
  ) {
    this.id = id;
    this.name = stats.name;
    this.radius = settings.beybladeSize_pixels / 2;
    
    this.body = Matter.Bodies.circle(x, y, this.radius * 0.85, {
      restitution: settings.restitution,
      friction: settings.friction,
      frictionAir: settings.frictionAir,
      density: settings.density * stats.weight,
      label: `beyblade-${id}`,
    });
    
    this.rotation = Math.random() * 360;
    this.maxSpinSpeed = settings.maxRotationSpeed * settings.spinSpeedMultiplier;
    this.spinSpeed = this.maxSpinSpeed;
    this.image = image;
    this.stats = stats;
    this.isAlive = true;
    this.state = 'launching';
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.wobbleIntensity = 0;
    this.deathAnimation = 0;
    this.hadStaminaSurge = false;
    this.burstPieces = [];
    this.trail = [];
    this.maxTrailLength = 15;
    this.orbitDirection = Math.random() > 0.5 ? 1 : -1;
    
    setTimeout(() => {
      if (this.isAlive) this.state = 'spinning';
    }, 300);
  }
  
  get x(): number {
    return this.body.position.x;
  }
  
  get y(): number {
    return this.body.position.y;
  }
  
  get vx(): number {
    return this.body.velocity.x;
  }
  
  get vy(): number {
    return this.body.velocity.y;
  }

  launch(vx: number, vy: number): void {
    Matter.Body.setVelocity(this.body, { x: vx, y: vy });
    this.isAlive = true;
    this.spinSpeed = this.maxSpinSpeed;
    this.state = 'launching';
    this.deathAnimation = 0;
    this.wobbleIntensity = 0;
    this.hadStaminaSurge = false;
    this.burstPieces = [];
    this.trail = [];
  }

  update(settings: Settings, centerX: number, centerY: number): void {
    if (this.state === 'dead') return;
    
    if (this.state === 'burst') {
      this.updateBurstPieces();
      return;
    }

    if (!this.isAlive) return;

    // Update trail
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.pop();
    }

    // Calculate distance to center
    const toCenterX = centerX - this.x;
    const toCenterY = centerY - this.y;
    const distToCenter = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
    
    const spinFactor = this.spinSpeed / this.maxSpinSpeed;

    if (distToCenter > 30) {
      // Bowl gravity
      const pullStrength = settings.centerPull * spinFactor * (distToCenter / 200);
      const forceX = (toCenterX / distToCenter) * pullStrength;
      const forceY = (toCenterY / distToCenter) * pullStrength;
      Matter.Body.applyForce(this.body, this.body.position, { x: forceX, y: forceY });
      
      // Orbital motion
      const perpX = -toCenterY / distToCenter * this.orbitDirection;
      const perpY = toCenterX / distToCenter * this.orbitDirection;
      const orbitStrength = settings.orbitForce * spinFactor;
      Matter.Body.applyForce(this.body, this.body.position, { 
        x: perpX * orbitStrength, 
        y: perpY * orbitStrength 
      });
    }

    // Visual rotation - keep spinning visually based on speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const minVisualSpin = Math.max(5, speed * 0.5);
    const visualSpin = Math.max(minVisualSpin, this.spinSpeed);
    this.rotation += visualSpin;

    // Decay spin speed
    const staminaBonus = 1 + (this.stats.stamina - 5) * 0.0001;
    this.spinSpeed *= settings.spinDecay * staminaBonus;

    // Update state based on spin ratio
    const spinRatio = this.spinSpeed / this.maxSpinSpeed;
    if (spinRatio > 0.5) {
      this.state = 'spinning';
      this.wobbleIntensity = 0;
    } else if (spinRatio > 0.2) {
      this.state = 'wobbling';
      this.wobbleIntensity = (0.5 - spinRatio) * 10;
    } else if (this.isAlive) {
      this.state = 'dying';
      this.wobbleIntensity = (0.2 - spinRatio) * 25;
    }
    
    this.wobblePhase += 0.15 + (1 - spinRatio) * 0.1;
    this.hadStaminaSurge = false;

    if (this.spinSpeed < settings.minSpinSpeed) {
      this.die();
    }
  }

  applyCollisionEffects(other: Beyblade, settings: Settings): void {
    // Both lose some spin on every collision
    this.spinSpeed *= (1 - settings.collisionSpinDrain);
    other.spinSpeed *= (1 - settings.collisionSpinDrain);
    
    // Spin transfer based on attack stats
    const attackDiff = this.stats.attack - other.stats.attack;
    const transfer = settings.spinTransferRate * Math.abs(attackDiff) / 10;
    
    if (attackDiff > 0) {
      other.spinSpeed = Math.max(0, other.spinSpeed * (1 - transfer));
      this.spinSpeed = Math.min(this.maxSpinSpeed, this.spinSpeed * (1 + transfer * 0.3));
    } else if (attackDiff < 0) {
      this.spinSpeed = Math.max(0, this.spinSpeed * (1 - transfer));
      other.spinSpeed = Math.min(other.maxSpinSpeed, other.spinSpeed * (1 + transfer * 0.3));
    }
    
    // Stamina surge chance
    if (Math.random() < settings.staminaSurgeChance) {
      if (this.spinSpeed < other.spinSpeed) {
        this.spinSpeed = Math.min(this.maxSpinSpeed, this.spinSpeed * 1.12);
        this.hadStaminaSurge = true;
      } else {
        other.spinSpeed = Math.min(other.maxSpinSpeed, other.spinSpeed * 1.12);
        other.hadStaminaSurge = true;
      }
    }
  }

  burst(): void {
    if (this.state === 'burst' || this.state === 'dead') return;
    
    this.isAlive = false;
    this.state = 'burst';
    
    const pieceCount = 8;
    for (let i = 0; i < pieceCount; i++) {
      const angle = (i / pieceCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 8 + Math.random() * 12;
      
      this.burstPieces.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed + this.vx * 0.5,
        vy: Math.sin(angle) * speed + this.vy * 0.5,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 30,
        scale: 0.3 + Math.random() * 0.4,
        alpha: 1,
      });
    }
  }

  private updateBurstPieces(): void {
    let allGone = true;
    
    for (const piece of this.burstPieces) {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += 0.5;
      piece.vx *= 0.98;
      piece.rotation += piece.rotationSpeed;
      piece.alpha -= 0.02;
      
      if (piece.alpha > 0) allGone = false;
    }
    
    if (allGone) {
      this.state = 'dead';
    }
  }

  die(): void {
    if (this.state === 'burst' || this.state === 'dead') return;
    
    this.isAlive = false;
    this.state = 'dying';
    this.spinSpeed = 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.state === 'burst') {
      this.drawBurstPieces(ctx);
      return;
    }
    
    if (this.state === 'dead') return;

    this.drawTrail(ctx);

    ctx.save();
    
    const wobbleX = Math.sin(this.wobblePhase) * this.wobbleIntensity;
    const wobbleY = Math.cos(this.wobblePhase * 1.3) * this.wobbleIntensity;
    
    ctx.translate(this.x + wobbleX, this.y + wobbleY);
    ctx.rotate((this.rotation * Math.PI) / 180);
    
    if (!this.isAlive && this.state === 'dying') {
      this.deathAnimation += 0.02;
      ctx.globalAlpha = Math.max(0, 1 - this.deathAnimation);
      
      if (this.deathAnimation >= 1) {
        this.state = 'dead';
      }
    }
    
    // Shadow
    ctx.save();
    ctx.globalAlpha *= 0.3;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.ellipse(5, 5, this.radius * 0.9, this.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Stamina surge glow
    if (this.hadStaminaSurge) {
      ctx.save();
      ctx.shadowColor = '#00FF00';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.fill();
      ctx.restore();
    }
    
    // Beyblade image
    ctx.drawImage(
      this.image,
      -this.radius,
      -this.radius,
      this.radius * 2,
      this.radius * 2
    );
    
    ctx.restore();
  }

  private drawTrail(ctx: CanvasRenderingContext2D): void {
    if (this.trail.length < 2) return;
    
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed < 2) return;
    
    ctx.save();
    ctx.lineCap = 'round';
    
    for (let i = 1; i < this.trail.length; i++) {
      const alpha = (1 - i / this.trail.length) * 0.3 * Math.min(1, speed / 10);
      const width = (1 - i / this.trail.length) * this.radius * 0.5;
      
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
      ctx.stroke();
    }
    
    ctx.restore();
  }

  private drawBurstPieces(ctx: CanvasRenderingContext2D): void {
    for (const piece of this.burstPieces) {
      if (piece.alpha <= 0) continue;
      
      ctx.save();
      ctx.globalAlpha = piece.alpha;
      ctx.translate(piece.x, piece.y);
      ctx.rotate((piece.rotation * Math.PI) / 180);
      ctx.scale(piece.scale, piece.scale);
      
      ctx.drawImage(
        this.image,
        -this.radius,
        -this.radius,
        this.radius * 2,
        this.radius * 2
      );
      
      ctx.restore();
    }
  }

  getCollisionCircle(): { x: number; y: number; radius: number } {
    return {
      x: this.x,
      y: this.y,
      radius: this.radius * 0.85,
    };
  }
}

interface BurstPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  alpha: number;
}