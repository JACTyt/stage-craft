export type Skin = 'tactical' | 'illustrated';

export type Theme = 'fantasy' | 'sci-fi' | 'custom';

export type ElementCategory =
  | 'terrain'
  | 'wall'
  | 'furniture'
  | 'nature'
  | 'fx'
  | 'token'
  | 'text';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

/** Combat-relevant data for token elements (PCs, NPCs, monsters). */
export interface CharacterSheet {
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  initiative: number;
}

export interface ElementInstance {
  id: string;
  registryId: string;
  layerId: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  characterSheet?: CharacterSheet;
  /** Links this token back to a full roster GameCharacter (types/collection.ts), if placed from the roster panel. */
  characterId?: string;
  /** Per-instance fill color override, used by ElementRenderer instead of the registry entry's default fill. */
  color?: string;
}

/** Mirrors the shape of Anthropic Messages API content blocks closely enough to pass through directly. */
export type ChatContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | ChatContentBlock[];
}

export interface Scene {
  id: string;
  name: string;
  collectionId?: string;
  activeSkin: Skin;
  gridSize: number;
  layers: Layer[];
  elements: ElementInstance[];
  chatMessages: ChatMessage[];
}

/**
 * Placeholder visual spec used until real art is wired into the registry.
 * A later pass can add an `imageUrl` field here without touching
 * ElementRenderer's resolution logic (registryId + skin -> visual).
 */
export interface VisualSpec {
  shape: 'rect' | 'circle';
  fill: string;
  stroke: string;
  label: string;
  /** Data URL for user-imported art. When set, this image renders instead of the placeholder shape. */
  imageUrl?: string;
}

export type SnapDirection = 'north' | 'south' | 'east' | 'west';

/**
 * A connection point on a registry entry, in local space relative to the
 * element's center (before rotation/scale are applied). `direction` is the
 * way the socket "faces" — two sockets connect when their world-space
 * directions point at each other.
 */
export interface SnapPoint {
  x: number;
  y: number;
  direction: SnapDirection;
}

export interface RegistryEntry {
  id: string;
  category: ElementCategory;
  theme: Theme;
  tags: string[];
  visualBySkin: Record<Skin, VisualSpec>;
  defaultSize: { width: number; height: number };
  flags?: { snappable?: boolean; castsShadow?: boolean; blocksLight?: boolean };
  snapPoints?: SnapPoint[];
}
