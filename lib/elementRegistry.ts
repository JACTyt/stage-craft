import type { RegistryEntry, SnapPoint } from '@/types/scene';

/** Sockets on all four edge-midpoints of a square tile, for edge-to-edge terrain snapping. */
const TILE_SNAP_POINTS: SnapPoint[] = [
  { x: 0, y: -50, direction: 'north' },
  { x: 0, y: 50, direction: 'south' },
  { x: -50, y: 0, direction: 'west' },
  { x: 50, y: 0, direction: 'east' },
];

/** Sockets on the left/right ends of a horizontal wall segment, for wall-to-wall snapping. */
function wallSnapPoints(width: number): SnapPoint[] {
  return [
    { x: -width / 2, y: 0, direction: 'west' },
    { x: width / 2, y: 0, direction: 'east' },
  ];
}

/**
 * Data-driven asset catalog. Each entry's `visualBySkin` is a placeholder
 * shape/color/label spec standing in for real art (see VisualSpec in
 * types/scene.ts) — swapping in real sprites later means editing entries
 * here, not touching canvas or rendering code. `theme` groups entries into
 * asset packs (fantasy dungeon vs sci-fi spaceship); it's independent of
 * `visualBySkin`, which controls tactical-vs-illustrated rendering within
 * whichever theme is active.
 */
export const elementRegistry: RegistryEntry[] = [
  // --- Fantasy: terrain ---
  {
    id: 'terrain-grass',
    category: 'terrain',
    theme: 'fantasy',
    tags: ['ground', 'outdoor'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#3f7d3f', stroke: '#2c592c', label: 'Grass' },
      illustrated: { shape: 'rect', fill: '#5a9b5a', stroke: '#3f7d3f', label: 'Grass' },
    },
    defaultSize: { width: 100, height: 100 },
    flags: { snappable: true },
    snapPoints: TILE_SNAP_POINTS,
  },
  {
    id: 'terrain-stone-floor',
    category: 'terrain',
    theme: 'fantasy',
    tags: ['ground', 'indoor'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#8a8a8a', stroke: '#5f5f5f', label: 'Floor' },
      illustrated: { shape: 'rect', fill: '#a8a196', stroke: '#8a8172', label: 'Floor' },
    },
    defaultSize: { width: 100, height: 100 },
    flags: { snappable: true },
    snapPoints: TILE_SNAP_POINTS,
  },
  {
    id: 'terrain-water',
    category: 'terrain',
    theme: 'fantasy',
    tags: ['ground', 'hazard'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#3a6ea5', stroke: '#284b73', label: 'Water' },
      illustrated: { shape: 'rect', fill: '#4f8fc0', stroke: '#3a6ea5', label: 'Water' },
    },
    defaultSize: { width: 100, height: 100 },
    flags: { snappable: true },
    snapPoints: TILE_SNAP_POINTS,
  },

  // --- Fantasy: walls ---
  {
    id: 'wall-stone',
    category: 'wall',
    theme: 'fantasy',
    tags: ['structure', 'blocking'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#6b6b6b', stroke: '#3d3d3d', label: 'Wall' },
      illustrated: { shape: 'rect', fill: '#7c6f63', stroke: '#544a41', label: 'Wall' },
    },
    defaultSize: { width: 100, height: 20 },
    flags: { blocksLight: true, snappable: true },
    snapPoints: wallSnapPoints(100),
  },
  {
    id: 'wall-door',
    category: 'wall',
    theme: 'fantasy',
    tags: ['structure', 'openable'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#8a5a2b', stroke: '#5c3b1a', label: 'Door' },
      illustrated: { shape: 'rect', fill: '#9c6a35', stroke: '#6b481f', label: 'Door' },
    },
    defaultSize: { width: 40, height: 20 },
    flags: { snappable: true },
    snapPoints: wallSnapPoints(40),
  },

  // --- Fantasy: furniture ---
  {
    id: 'furniture-table',
    category: 'furniture',
    theme: 'fantasy',
    tags: ['indoor'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#a0733c', stroke: '#6e4e28', label: 'Table' },
      illustrated: { shape: 'rect', fill: '#b3854e', stroke: '#8a6136', label: 'Table' },
    },
    defaultSize: { width: 80, height: 50 },
    flags: { snappable: true, castsShadow: true },
  },
  {
    id: 'furniture-chair',
    category: 'furniture',
    theme: 'fantasy',
    tags: ['indoor'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#b58652', stroke: '#7d5a35', label: 'Chair' },
      illustrated: { shape: 'rect', fill: '#c49763', stroke: '#94693f', label: 'Chair' },
    },
    defaultSize: { width: 30, height: 30 },
    flags: { snappable: true, castsShadow: true },
  },
  {
    id: 'furniture-chest',
    category: 'furniture',
    theme: 'fantasy',
    tags: ['indoor', 'container'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#7a5230', stroke: '#4f341e', label: 'Chest' },
      illustrated: { shape: 'rect', fill: '#8c6238', stroke: '#5f421f', label: 'Chest' },
    },
    defaultSize: { width: 40, height: 30 },
    flags: { snappable: true, castsShadow: true },
  },

  // --- Fantasy: nature ---
  {
    id: 'nature-tree',
    category: 'nature',
    theme: 'fantasy',
    tags: ['outdoor', 'blocking'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#2f6b2f', stroke: '#1e461e', label: 'Tree' },
      illustrated: { shape: 'circle', fill: '#3f8a3f', stroke: '#2a5c2a', label: 'Tree' },
    },
    defaultSize: { width: 60, height: 60 },
    flags: { blocksLight: true, castsShadow: true },
  },
  {
    id: 'nature-rock',
    category: 'nature',
    theme: 'fantasy',
    tags: ['outdoor'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#7d7d70', stroke: '#54544a', label: 'Rock' },
      illustrated: { shape: 'circle', fill: '#8f8f80', stroke: '#65655a', label: 'Rock' },
    },
    defaultSize: { width: 40, height: 40 },
    flags: { castsShadow: true },
  },
  {
    id: 'nature-bush',
    category: 'nature',
    theme: 'fantasy',
    tags: ['outdoor'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#4a7a3a', stroke: '#335329', label: 'Bush' },
      illustrated: { shape: 'circle', fill: '#5c8f4a', stroke: '#426b34', label: 'Bush' },
    },
    defaultSize: { width: 35, height: 35 },
  },

  // --- Fantasy: fx ---
  {
    id: 'fx-torch',
    category: 'fx',
    theme: 'fantasy',
    tags: ['light'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#e8a13a', stroke: '#b3781f', label: 'Torch' },
      illustrated: { shape: 'circle', fill: '#f2b455', stroke: '#c98a2a', label: 'Torch' },
    },
    defaultSize: { width: 20, height: 20 },
  },
  {
    id: 'fx-fire',
    category: 'fx',
    theme: 'fantasy',
    tags: ['light', 'hazard'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#d9481f', stroke: '#a3350f', label: 'Fire' },
      illustrated: { shape: 'circle', fill: '#e8642f', stroke: '#b3481a', label: 'Fire' },
    },
    defaultSize: { width: 30, height: 30 },
  },

  // --- Fantasy: tokens ---
  {
    id: 'token-pc',
    category: 'token',
    theme: 'fantasy',
    tags: ['character', 'player'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#2a6fb0', stroke: '#173f66', label: 'PC' },
      illustrated: { shape: 'circle', fill: '#3f85c7', stroke: '#255a8f', label: 'PC' },
    },
    defaultSize: { width: 40, height: 40 },
    flags: { snappable: true },
  },
  {
    id: 'token-npc',
    category: 'token',
    theme: 'fantasy',
    tags: ['character', 'ally'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#3f9b5c', stroke: '#256e3d', label: 'NPC' },
      illustrated: { shape: 'circle', fill: '#54b073', stroke: '#357d4c', label: 'NPC' },
    },
    defaultSize: { width: 40, height: 40 },
    flags: { snappable: true },
  },
  {
    id: 'token-monster',
    category: 'token',
    theme: 'fantasy',
    tags: ['character', 'enemy'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#b02a2a', stroke: '#791b1b', label: 'Mob' },
      illustrated: { shape: 'circle', fill: '#c73f3f', stroke: '#932828', label: 'Mob' },
    },
    defaultSize: { width: 40, height: 40 },
    flags: { snappable: true },
  },

  // --- Fantasy: text ---
  {
    id: 'text-label',
    category: 'text',
    theme: 'fantasy',
    tags: ['annotation'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#ffffff', stroke: '#333333', label: 'Text' },
      illustrated: { shape: 'rect', fill: '#f4ecd8', stroke: '#8a7a5a', label: 'Text' },
    },
    defaultSize: { width: 80, height: 24 },
  },

  // --- Sci-fi: terrain ---
  {
    id: 'terrain-metal-floor',
    category: 'terrain',
    theme: 'sci-fi',
    tags: ['ground', 'indoor'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#6e7680', stroke: '#454b52', label: 'Deck' },
      illustrated: { shape: 'rect', fill: '#7f8894', stroke: '#575e66', label: 'Deck' },
    },
    defaultSize: { width: 100, height: 100 },
    flags: { snappable: true },
    snapPoints: TILE_SNAP_POINTS,
  },
  {
    id: 'terrain-cargo-floor',
    category: 'terrain',
    theme: 'sci-fi',
    tags: ['ground', 'indoor'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#5a6268', stroke: '#383e42', label: 'Cargo' },
      illustrated: { shape: 'rect', fill: '#6b747a', stroke: '#454c51', label: 'Cargo' },
    },
    defaultSize: { width: 100, height: 100 },
    flags: { snappable: true },
    snapPoints: TILE_SNAP_POINTS,
  },
  {
    id: 'terrain-space-void',
    category: 'terrain',
    theme: 'sci-fi',
    tags: ['ground', 'hazard', 'exterior'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#0b1024', stroke: '#1c2450', label: 'Void' },
      illustrated: { shape: 'rect', fill: '#0e1330', stroke: '#232c5c', label: 'Void' },
    },
    defaultSize: { width: 100, height: 100 },
    flags: { snappable: true },
    snapPoints: TILE_SNAP_POINTS,
  },

  // --- Sci-fi: walls ---
  {
    id: 'wall-hull',
    category: 'wall',
    theme: 'sci-fi',
    tags: ['structure', 'blocking'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#4a5560', stroke: '#2a3238', label: 'Hull' },
      illustrated: { shape: 'rect', fill: '#586570', stroke: '#333d44', label: 'Hull' },
    },
    defaultSize: { width: 100, height: 20 },
    flags: { blocksLight: true, snappable: true },
    snapPoints: wallSnapPoints(100),
  },
  {
    id: 'wall-airlock',
    category: 'wall',
    theme: 'sci-fi',
    tags: ['structure', 'openable'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#c9902f', stroke: '#8f651e', label: 'Airlock' },
      illustrated: { shape: 'rect', fill: '#d9a445', stroke: '#a3742a', label: 'Airlock' },
    },
    defaultSize: { width: 40, height: 20 },
    flags: { snappable: true },
    snapPoints: wallSnapPoints(40),
  },
  {
    id: 'wall-viewport',
    category: 'wall',
    theme: 'sci-fi',
    tags: ['structure', 'window'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#2a7a9b', stroke: '#1a4d61', label: 'Viewport' },
      illustrated: { shape: 'rect', fill: '#3a94b8', stroke: '#256278', label: 'Viewport' },
    },
    defaultSize: { width: 100, height: 20 },
    flags: { snappable: true },
    snapPoints: wallSnapPoints(100),
  },

  // --- Sci-fi: furniture (machinery) ---
  {
    id: 'furniture-console',
    category: 'furniture',
    theme: 'sci-fi',
    tags: ['indoor', 'machinery'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#3a4450', stroke: '#20262c', label: 'Console' },
      illustrated: { shape: 'rect', fill: '#485460', stroke: '#2b3339', label: 'Console' },
    },
    defaultSize: { width: 60, height: 40 },
    flags: { snappable: true, castsShadow: true },
  },
  {
    id: 'furniture-cargo-crate',
    category: 'furniture',
    theme: 'sci-fi',
    tags: ['indoor', 'container'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#8a7440', stroke: '#5c4d2a', label: 'Crate' },
      illustrated: { shape: 'rect', fill: '#9c8650', stroke: '#6e5d36', label: 'Crate' },
    },
    defaultSize: { width: 40, height: 40 },
    flags: { snappable: true, castsShadow: true },
  },

  // --- Sci-fi: furniture — bridge / command deck ---
  {
    id: 'furniture-monitor',
    category: 'furniture',
    theme: 'sci-fi',
    tags: ['indoor', 'bridge', 'machinery'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#182028', stroke: '#3fd9c4', label: 'Monitor' },
      illustrated: { shape: 'rect', fill: '#202a33', stroke: '#4fe6d0', label: 'Monitor' },
    },
    defaultSize: { width: 40, height: 30 },
    flags: { snappable: true, castsShadow: true },
  },
  {
    id: 'furniture-nav-screen',
    category: 'furniture',
    theme: 'sci-fi',
    tags: ['indoor', 'bridge', 'machinery'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#1a2a3a', stroke: '#2f8fd9', label: 'Nav Screen' },
      illustrated: { shape: 'rect', fill: '#233648', stroke: '#3fa0eb', label: 'Nav Screen' },
    },
    defaultSize: { width: 60, height: 30 },
    flags: { snappable: true, castsShadow: true },
  },

  // --- Sci-fi: furniture — living / medical ---
  {
    id: 'furniture-cryo-pod',
    category: 'furniture',
    theme: 'sci-fi',
    tags: ['indoor', 'medical'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#a8d8e8', stroke: '#4a90a8', label: 'Cryo Pod' },
      illustrated: { shape: 'rect', fill: '#b8e4f2', stroke: '#5aa0b8', label: 'Cryo Pod' },
    },
    defaultSize: { width: 40, height: 70 },
    flags: { snappable: true, castsShadow: true },
  },
  {
    id: 'furniture-crew-bed',
    category: 'furniture',
    theme: 'sci-fi',
    tags: ['indoor', 'medical'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#5a6472', stroke: '#38404a', label: 'Crew Bed' },
      illustrated: { shape: 'rect', fill: '#68727f', stroke: '#454e58', label: 'Crew Bed' },
    },
    defaultSize: { width: 30, height: 60 },
    flags: { snappable: true, castsShadow: true },
  },

  // --- Sci-fi: furniture — labs / engineering ---
  {
    id: 'furniture-tech-panel',
    category: 'furniture',
    theme: 'sci-fi',
    tags: ['indoor', 'lab', 'machinery'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#354a3a', stroke: '#1e2e22', label: 'Tech Panel' },
      illustrated: { shape: 'rect', fill: '#41573f', stroke: '#28381c', label: 'Tech Panel' },
    },
    defaultSize: { width: 50, height: 35 },
    flags: { snappable: true, castsShadow: true },
  },
  {
    id: 'furniture-sample-container',
    category: 'furniture',
    theme: 'sci-fi',
    tags: ['indoor', 'lab'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#7fd9a0', stroke: '#3a8a5a', label: 'Sample' },
      illustrated: { shape: 'circle', fill: '#8fe4ae', stroke: '#469968', label: 'Sample' },
    },
    defaultSize: { width: 20, height: 20 },
  },
  {
    id: 'furniture-biohack-station',
    category: 'furniture',
    theme: 'sci-fi',
    tags: ['indoor', 'lab', 'machinery'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#4a3a5a', stroke: '#2a1e38', label: 'Bio-Hack Station' },
      illustrated: { shape: 'rect', fill: '#5a4870', stroke: '#382a4a', label: 'Bio-Hack Station' },
    },
    defaultSize: { width: 60, height: 40 },
    flags: { snappable: true, castsShadow: true },
  },

  // --- Sci-fi: nature (hazards / environment) ---
  {
    id: 'nature-asteroid',
    category: 'nature',
    theme: 'sci-fi',
    tags: ['exterior', 'blocking'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#6b6259', stroke: '#413b34', label: 'Asteroid' },
      illustrated: { shape: 'circle', fill: '#7d7368', stroke: '#524a41', label: 'Asteroid' },
    },
    defaultSize: { width: 60, height: 60 },
    flags: { blocksLight: true, castsShadow: true },
  },
  {
    id: 'nature-debris',
    category: 'nature',
    theme: 'sci-fi',
    tags: ['exterior'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#565c62', stroke: '#34383c', label: 'Debris' },
      illustrated: { shape: 'circle', fill: '#666d73', stroke: '#40454a', label: 'Debris' },
    },
    defaultSize: { width: 30, height: 30 },
  },

  // --- Sci-fi: fx ---
  {
    id: 'fx-reactor-glow',
    category: 'fx',
    theme: 'sci-fi',
    tags: ['light'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#35c2c9', stroke: '#1f8a90', label: 'Reactor' },
      illustrated: { shape: 'circle', fill: '#4dd6dd', stroke: '#2aa3aa', label: 'Reactor' },
    },
    defaultSize: { width: 30, height: 30 },
  },
  {
    id: 'fx-warning-light',
    category: 'fx',
    theme: 'sci-fi',
    tags: ['light', 'hazard'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#e02f2f', stroke: '#9c1c1c', label: 'Warning' },
      illustrated: { shape: 'circle', fill: '#ec4949', stroke: '#b32828', label: 'Warning' },
    },
    defaultSize: { width: 20, height: 20 },
  },

  // --- Sci-fi: tokens ---
  {
    id: 'token-crew',
    category: 'token',
    theme: 'sci-fi',
    tags: ['character', 'player'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#2a6fb0', stroke: '#173f66', label: 'Crew' },
      illustrated: { shape: 'circle', fill: '#3f85c7', stroke: '#255a8f', label: 'Crew' },
    },
    defaultSize: { width: 40, height: 40 },
    flags: { snappable: true },
  },
  {
    id: 'token-alien',
    category: 'token',
    theme: 'sci-fi',
    tags: ['character', 'enemy'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#5c2a9b', stroke: '#3a1a66', label: 'Alien' },
      illustrated: { shape: 'circle', fill: '#7040b3', stroke: '#4d2a80', label: 'Alien' },
    },
    defaultSize: { width: 40, height: 40 },
    flags: { snappable: true },
  },
  {
    id: 'token-robot',
    category: 'token',
    theme: 'sci-fi',
    tags: ['character', 'ally'],
    visualBySkin: {
      tactical: { shape: 'circle', fill: '#8a919a', stroke: '#5c6169', label: 'Robot' },
      illustrated: { shape: 'circle', fill: '#9ba2ab', stroke: '#6b7078', label: 'Robot' },
    },
    defaultSize: { width: 40, height: 40 },
    flags: { snappable: true },
  },

  // --- Sci-fi: text ---
  {
    id: 'text-label-scifi',
    category: 'text',
    theme: 'sci-fi',
    tags: ['annotation'],
    visualBySkin: {
      tactical: { shape: 'rect', fill: '#0f1a1a', stroke: '#2fd9c4', label: 'Text' },
      illustrated: { shape: 'rect', fill: '#132424', stroke: '#3fe6d0', label: 'Text' },
    },
    defaultSize: { width: 80, height: 24 },
  },
];

export function getRegistryEntry(registryId: string): RegistryEntry | undefined {
  return elementRegistry.find((entry) => entry.id === registryId);
}
