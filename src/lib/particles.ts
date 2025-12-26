import { Vector2 } from './physics';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'spark' | 'smoke' | 'ring' | 'star' | 'trail' | 'debris';
  rotation?: number;
  rotationSpeed?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private readonly maxParticles: number = 500;

  spawnCollisionSparks(point: Vector2, normal: Vector2, intensity: number = 1): void {
    const sparkCount = Math.floor(5 + intensity * 10);
    
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.atan2(normal.y, normal.x) + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 2 + Math.random() * 6 * intensity;
      
      this.addParticle({
        x: point.x + (Math.random() - 0.5) * 10,
        y: point.y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.15 + Math.random() * 0.15,
        size: 2 + Math.random() * 3 * intensity,
        color: this.getSparkColor(),
        type: 'spark',
      });
    }

    // Add impact ring
    this.addParticle({
      x: point.x,
      y: point.y,
      vx: 0,
      vy: 0,
      life: 1,
      maxLife: 0.1,
      size: 10 * intensity,
      color: 'rgba(255, 200, 50, 0.8)',
      type: 'ring',
    });
  }

  spawnClashEffect(x: number, y: number, intensity: number = 1): void {
    // Large shockwave ring
    this.addParticle({
      x, y,
      vx: 0, vy: 0,
      life: 1,
      maxLife: 0.2,
      size: 30 * intensity,
      color: 'rgba(255, 100, 50, 0.9)',
      type: 'ring',
    });

    // Secondary ring
    setTimeout(() => {
      this.addParticle({
        x, y,
        vx: 0, vy: 0,
        life: 1,
        maxLife: 0.15,
        size: 20 * intensity,
        color: 'rgba(255, 200, 100, 0.7)',
        type: 'ring',
      });
    }, 50);

    // Lots of sparks
    const sparkCount = Math.floor(15 + intensity * 15);
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 5 + Math.random() * 10 * intensity;
      
      this.addParticle({
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 15,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.2 + Math.random() * 0.2,
        size: 3 + Math.random() * 4,
        color: this.getSparkColor(),
        type: 'spark',
      });
    }

    // Stars
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 20;
      
      this.addParticle({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        life: 1,
        maxLife: 0.3,
        size: 8 + Math.random() * 6,
        color: '#FFFFFF',
        type: 'star',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 20,
      });
    }
  }

  spawnCriticalHitEffect(x: number, y: number): void {
    // Red flash ring
    this.addParticle({
      x, y,
      vx: 0, vy: 0,
      life: 1,
      maxLife: 0.15,
      size: 40,
      color: 'rgba(255, 50, 50, 0.9)',
      type: 'ring',
    });

    // White inner ring
    this.addParticle({
      x, y,
      vx: 0, vy: 0,
      life: 1,
      maxLife: 0.12,
      size: 25,
      color: 'rgba(255, 255, 255, 0.95)',
      type: 'ring',
    });

    // Red sparks
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 12;
      
      this.addParticle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.25,
        size: 4 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#FF3333' : '#FFAA00',
        type: 'spark',
      });
    }
  }

  spawnBurstExplosion(x: number, y: number): void {
    // Multiple expanding rings
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.addParticle({
          x, y,
          vx: 0, vy: 0,
          life: 1,
          maxLife: 0.3 - i * 0.05,
          size: 50 + i * 20,
          color: `rgba(255, ${150 - i * 30}, 50, ${0.9 - i * 0.2})`,
          type: 'ring',
        });
      }, i * 30);
    }

    // Debris
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 10 + Math.random() * 20;
      
      this.addParticle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.4 + Math.random() * 0.3,
        size: 5 + Math.random() * 8,
        color: this.getDebrisColor(),
        type: 'debris',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 30,
      });
    }

    // Smoke
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 30;
      
      this.addParticle({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 3,
        vy: -1 - Math.random() * 2,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.4,
        size: 15 + Math.random() * 20,
        color: 'rgba(80, 80, 80, 0.6)',
        type: 'smoke',
      });
    }
  }

  spawnLaunchEffect(x: number, y: number, velocity: Vector2): void {
    const angle = Math.atan2(velocity.y, velocity.x);
    
    // Launch trail
    for (let i = 0; i < 10; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      const trailAngle = angle + Math.PI + spread;
      const speed = 3 + Math.random() * 5;
      
      this.addParticle({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(trailAngle) * speed,
        vy: Math.sin(trailAngle) * speed,
        life: 1,
        maxLife: 0.2 + Math.random() * 0.15,
        size: 4 + Math.random() * 4,
        color: 'rgba(255, 200, 100, 0.8)',
        type: 'trail',
      });
    }

    // Ground dust
    for (let i = 0; i < 8; i++) {
      this.addParticle({
        x: x + (Math.random() - 0.5) * 40,
        y: y + 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -1 - Math.random() * 2,
        life: 1,
        maxLife: 0.3 + Math.random() * 0.2,
        size: 10 + Math.random() * 15,
        color: 'rgba(150, 140, 120, 0.5)',
        type: 'smoke',
      });
    }
  }

  spawnDeathSmoke(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 20;
      
      this.addParticle({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 2,
        vy: -0.5 - Math.random() * 1.5,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 12 + Math.random() * 18,
        color: 'rgba(100, 100, 100, 0.5)',
        type: 'smoke',
      });
    }
  }

  spawnGrindSparks(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
      const speed = 2 + Math.random() * 4;
      
      this.addParticle({
        x: x + (Math.random() - 0.5) * 10,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.1 + Math.random() * 0.1,
        size: 2 + Math.random() * 2,
        color: this.getSparkColor(),
        type: 'spark',
      });
    }
  }

  spawnWallHitEffect(x: number, y: number, normal: Vector2): void {
    const sparkCount = 8;
    
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.atan2(normal.y, normal.x) + (Math.random() - 0.5) * Math.PI * 0.6;
      const speed = 3 + Math.random() * 5;
      
      this.addParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.15,
        size: 2 + Math.random() * 2,
        color: this.getSparkColor(),
        type: 'spark',
      });
    }
  }

  spawnVictoryBurst(x: number, y: number): void {
    // Golden sparkles
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 10;
      
      this.addParticle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 1,
        maxLife: 0.8 + Math.random() * 0.5,
        size: 4 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#FFD700' : '#FFA500',
        type: 'star',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 15,
      });
    }

    // Celebratory ring
    this.addParticle({
      x, y,
      vx: 0, vy: 0,
      life: 1,
      maxLife: 0.4,
      size: 60,
      color: 'rgba(255, 215, 0, 0.8)',
      type: 'ring',
    });
  }

  private addParticle(particle: Particle): void {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }
    this.particles.push(particle);
  }

  private getSparkColor(): string {
    const colors = ['#FFD700', '#FFA500', '#FF6600', '#FFFF00', '#FFFFFF'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private getDebrisColor(): string {
    const colors = ['#888888', '#666666', '#999999', '#AAAAAA', '#777777'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.type === 'spark' || p.type === 'debris') {
        p.vy += 0.3; // Gravity
        p.vx *= 0.98;
      } else if (p.type === 'smoke') {
        p.vx *= 0.95;
        p.size += 0.5;
      } else if (p.type === 'ring') {
        p.size += 8;
      }
      
      if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
        p.rotation += p.rotationSpeed;
      }
      
      p.life -= deltaTime / p.maxLife;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      
      if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'star') {
        ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        this.drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
      } else if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'debris') {
        ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else {
        // Spark or trail
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(
        cx + Math.cos(rot) * outerRadius,
        cy + Math.sin(rot) * outerRadius
      );
      rot += step;
      ctx.lineTo(
        cx + Math.cos(rot) * innerRadius,
        cy + Math.sin(rot) * innerRadius
      );
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  clear(): void {
    this.particles = [];
  }
}
