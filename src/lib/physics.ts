// Simplified - Matter.js handles most physics now

export interface Vector2 {
  x: number;
  y: number;
}

export interface CollisionResult {
  occurred: boolean;
  beybladeAId?: number;
  beybladeBId?: number;
  point?: Vector2;
  intensity?: number;
  isCritical?: boolean;
  isBurst?: boolean;
}

export function magnitude(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalize(v: Vector2): Vector2 {
  const len = magnitude(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Generate launch position and velocity
 */
export function getRandomLaunchPosition(
  width: number,
  height: number,
  taskbarHeight: number,
  padding: number = 100,
  index: number = 0,
  total: number = 5
): { x: number; y: number; vx: number; vy: number } {
  const arenaHeight = height - taskbarHeight;
  
  // Distribute evenly around edges
  const angle = (index / total) * Math.PI * 2 + Math.random() * 0.3;
  const edgeDistance = Math.min(width, arenaHeight) * 0.4;
  
  const centerX = width / 2;
  const centerY = arenaHeight / 2;
  
  let x = centerX + Math.cos(angle) * edgeDistance;
  let y = centerY + Math.sin(angle) * edgeDistance;
  
  x = Math.max(padding, Math.min(width - padding, x));
  y = Math.max(padding, Math.min(arenaHeight - padding, y));

  // Velocity toward center with some randomness
  const targetX = centerX + (Math.random() - 0.5) * 100;
  const targetY = centerY + (Math.random() - 0.5) * 100;
  
  const dx = targetX - x;
  const dy = targetY - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  const speed = 8 + Math.random() * 6;
  
  return {
    x,
    y,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
  };
}