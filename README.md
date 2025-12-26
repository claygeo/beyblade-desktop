# 🌀 Beyblade Arena

A desktop Beyblade battle simulator! Watch Beyblades spin, collide, and fight on your Windows desktop.

## Features

- **Transparent Overlay**: Beyblades battle directly on your desktop
- **Physics-Based Combat**: Realistic collision detection and knockback
- **Unique Beyblades**: 12 different Beyblades with unique stats (Attack, Defense, Stamina)
- **Visual Effects**: Sparks, particles, and impact effects
- **Sound Effects**: Procedurally generated audio (no external files needed)
- **Customizable**: Adjust Beyblade count, size, battle duration, and add custom images

## Requirements

- **Windows 10/11** (or macOS/Linux)
- **Node.js 18+**
- **Rust** (for Tauri compilation)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Your Beyblade Images

Place your Beyblade PNG images (top-down view, transparent background) in:

```
src/assets/beyblades/
├── beyblade-1.png
├── beyblade-2.png
├── beyblade-3.png
├── beyblade-4.png
├── beyblade-5.png
└── beyblade-6.png
```

### 3. Run in Development

```bash
npm run tauri dev
```

### 4. Build for Production

```bash
npm run tauri build
```

## Controls

- **Space** or **⚔️ Button**: Launch a new battle
- **⚙️ Button**: Open settings
- **✕ Button**: Exit app
- **Escape**: Close settings

## Settings

- **Beyblade Count**: 2-12 beyblades per battle
- **Battle Duration**: Quick (~15s), Normal (~30s), Extended (~60s), Endless
- **Beyblade Size**: Small, Normal, Large, Giant
- **Sound Effects**: Toggle on/off
- **Custom Images**: Upload your own beyblade images (up to 20)

## Customization

### Beyblade Stats

Edit `src/lib/beyblade.ts` to modify Beyblade configurations:

```typescript
export const BEYBLADE_CONFIGS: BeybladeStats[] = [
  { name: 'Storm Phoenix', attack: 8, defense: 4, stamina: 6, weight: 0.95 },
  // Add more...
];
```

### Physics

Edit `src/lib/settings.ts` to tweak physics:

```typescript
readonly friction: number = 0.9992;     // Spin decay rate
readonly bounceDamping: number = 0.7;   // Wall bounce energy loss
readonly baseKnockback: number = 2.5;   // Collision knockback
```

## License

Proprietary - All rights reserved.
