import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  ChatMessage,
  CharacterSheet,
  ElementInstance,
  Layer,
  RegistryEntry,
  Scene,
  Skin,
  Theme,
} from '@/types/scene';
import { elementRegistry, getRegistryEntry as getStaticRegistryEntry } from '@/lib/elementRegistry';

const DEFAULT_LAYERS: Layer[] = [
  { id: 'layer-terrain', name: 'Terrain', visible: true, locked: false, zIndex: 0 },
  { id: 'layer-objects', name: 'Objects', visible: true, locked: false, zIndex: 1 },
  { id: 'layer-fog', name: 'Fog / Lighting', visible: true, locked: false, zIndex: 2 },
  { id: 'layer-grid', name: 'Grid / Tokens', visible: true, locked: false, zIndex: 3 },
];

export function createDefaultScene(collectionId?: string): Scene {
  return {
    id: nanoid(),
    name: 'Untitled Scene',
    collectionId,
    activeSkin: 'tactical',
    gridSize: 50,
    layers: DEFAULT_LAYERS,
    elements: [],
    chatMessages: [],
  };
}

interface SceneStore {
  scene: Scene;
  selectedElementId: string | null;
  activeLayerId: string;
  activeTheme: Theme;
  snapToGrid: boolean;
  snapToSockets: boolean;
  keepRatio: boolean;
  customEntries: RegistryEntry[];

  addElement: (registryId: string, position: { x: number; y: number }) => void;
  addElementFromCharacter: (
    character: { id: string; name: string; kind: 'pc' | 'npc'; hp: number; maxHp: number; ac: number },
    position: { x: number; y: number }
  ) => void;
  addQuickCharacterToken: () => void;
  moveElement: (id: string, x: number, y: number) => void;
  rotateElement: (id: string, rotation: number) => void;
  scaleElement: (id: string, scaleX: number, scaleY: number) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  moveElementToLayer: (id: string, layerId: string) => void;
  reorderElement: (draggedId: string, targetId: string) => void;
  updateCharacterSheet: (id: string, patch: Partial<CharacterSheet>) => void;
  setElementColor: (id: string, color: string) => void;

  renameScene: (name: string) => void;
  setActiveSkin: (skin: Skin) => void;
  setActiveTheme: (theme: Theme) => void;
  setActiveLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  addLayer: (name: string) => void;
  renameLayer: (layerId: string, name: string) => void;
  deleteLayer: (layerId: string) => void;
  toggleSnapToGrid: () => void;
  toggleSnapToSockets: () => void;
  toggleKeepRatio: () => void;
  addCustomEntries: (entries: RegistryEntry[]) => void;
  renameCustomEntry: (registryId: string, label: string) => void;
  replaceScene: (scene: Scene, customEntries: RegistryEntry[]) => void;
  appendChatMessages: (messages: ChatMessage[]) => void;
  clearChat: () => void;
}

export const useSceneStore = create<SceneStore>((set) => ({
  scene: createDefaultScene(),
  selectedElementId: null,
  activeLayerId: 'layer-objects',
  activeTheme: 'fantasy',
  snapToGrid: true,
  snapToSockets: true,
  keepRatio: false,
  customEntries: [],

  addElement: (registryId, position) =>
    set((state) => {
      const entry =
        getStaticRegistryEntry(registryId) ??
        state.customEntries.find((e) => e.id === registryId);
      if (!entry) return state;

      const newElement: ElementInstance = {
        id: nanoid(),
        registryId,
        layerId: state.activeLayerId,
        x: position.x,
        y: position.y,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: state.scene.elements.length,
        characterSheet:
          entry.category === 'token'
            ? {
                name: entry.visualBySkin.tactical.label,
                hp: 10,
                maxHp: 10,
                ac: 10,
                initiative: 0,
              }
            : undefined,
      };

      return {
        scene: { ...state.scene, elements: [...state.scene.elements, newElement] },
        selectedElementId: newElement.id,
      };
    }),

  addElementFromCharacter: (character, position) =>
    set((state) => {
      const registryId = character.kind === 'pc' ? 'token-pc' : 'token-npc';
      const entry = getStaticRegistryEntry(registryId);
      if (!entry) return state;

      const newElement: ElementInstance = {
        id: nanoid(),
        registryId,
        layerId: state.activeLayerId,
        x: position.x,
        y: position.y,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: state.scene.elements.length,
        characterId: character.id,
        characterSheet: {
          name: character.name,
          hp: character.hp,
          maxHp: character.maxHp,
          ac: character.ac,
          initiative: 0,
        },
      };

      return {
        scene: { ...state.scene, elements: [...state.scene.elements, newElement] },
        selectedElementId: newElement.id,
      };
    }),

  addQuickCharacterToken: () =>
    set((state) => {
      const entry = getStaticRegistryEntry('token-npc');
      if (!entry) return state;

      const newElement: ElementInstance = {
        id: nanoid(),
        registryId: 'token-npc',
        layerId: state.activeLayerId,
        x: 180 + Math.random() * 80,
        y: 180 + Math.random() * 80,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        zIndex: state.scene.elements.length,
        characterSheet: {
          name: 'New NPC',
          hp: 10,
          maxHp: 10,
          ac: 10,
          initiative: 0,
        },
      };

      return {
        scene: { ...state.scene, elements: [...state.scene.elements, newElement] },
        selectedElementId: newElement.id,
      };
    }),

  moveElement: (id, x, y) =>
    set((state) => ({
      scene: {
        ...state.scene,
        elements: state.scene.elements.map((el) => (el.id === id ? { ...el, x, y } : el)),
      },
    })),

  rotateElement: (id, rotation) =>
    set((state) => ({
      scene: {
        ...state.scene,
        elements: state.scene.elements.map((el) => (el.id === id ? { ...el, rotation } : el)),
      },
    })),

  scaleElement: (id, scaleX, scaleY) =>
    set((state) => ({
      scene: {
        ...state.scene,
        elements: state.scene.elements.map((el) =>
          el.id === id ? { ...el, scaleX, scaleY } : el
        ),
      },
    })),

  deleteElement: (id) =>
    set((state) => ({
      scene: {
        ...state.scene,
        elements: state.scene.elements.filter((el) => el.id !== id),
      },
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    })),

  selectElement: (id) => set({ selectedElementId: id }),

  updateCharacterSheet: (id, patch) =>
    set((state) => ({
      scene: {
        ...state.scene,
        elements: state.scene.elements.map((el) =>
          el.id === id && el.characterSheet
            ? { ...el, characterSheet: { ...el.characterSheet, ...patch } }
            : el
        ),
      },
    })),

  setElementColor: (id, color) =>
    set((state) => ({
      scene: {
        ...state.scene,
        elements: state.scene.elements.map((el) => (el.id === id ? { ...el, color } : el)),
      },
    })),

  moveElementToLayer: (id, layerId) =>
    set((state) => {
      const maxZIndex = state.scene.elements
        .filter((el) => el.layerId === layerId && el.id !== id)
        .reduce((max, el) => Math.max(max, el.zIndex), -1);

      return {
        scene: {
          ...state.scene,
          elements: state.scene.elements.map((el) =>
            el.id === id ? { ...el, layerId, zIndex: maxZIndex + 1 } : el
          ),
        },
      };
    }),

  /**
   * Drops `draggedId` into `targetId`'s layer, positioned immediately before it,
   * and renumbers zIndex within that layer to match the new order. Handles both
   * reordering within a layer and moving between layers with one code path.
   */
  reorderElement: (draggedId, targetId) =>
    set((state) => {
      if (draggedId === targetId) return state;
      const dragged = state.scene.elements.find((el) => el.id === draggedId);
      const target = state.scene.elements.find((el) => el.id === targetId);
      if (!dragged || !target) return state;

      const targetLayerId = target.layerId;
      const siblings = state.scene.elements
        .filter((el) => el.layerId === targetLayerId && el.id !== draggedId)
        .sort((a, b) => a.zIndex - b.zIndex);

      const targetIndex = siblings.findIndex((el) => el.id === targetId);
      siblings.splice(targetIndex, 0, dragged);

      const newZIndex = new Map(siblings.map((el, i) => [el.id, i]));

      return {
        scene: {
          ...state.scene,
          elements: state.scene.elements.map((el) => {
            const zIndex = newZIndex.get(el.id);
            if (zIndex === undefined) return el;
            return el.id === draggedId ? { ...el, layerId: targetLayerId, zIndex } : { ...el, zIndex };
          }),
        },
      };
    }),

  renameScene: (name) => set((state) => ({ scene: { ...state.scene, name } })),

  setActiveSkin: (skin) =>
    set((state) => ({ scene: { ...state.scene, activeSkin: skin } })),

  setActiveTheme: (theme) => set({ activeTheme: theme }),

  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),

  toggleLayerVisibility: (layerId) =>
    set((state) => ({
      scene: {
        ...state.scene,
        layers: state.scene.layers.map((layer) =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
        ),
      },
    })),

  addLayer: (name) =>
    set((state) => {
      const maxZIndex = state.scene.layers.reduce((max, l) => Math.max(max, l.zIndex), -1);
      const newLayer: Layer = {
        id: nanoid(),
        name,
        visible: true,
        locked: false,
        zIndex: maxZIndex + 1,
      };
      return { scene: { ...state.scene, layers: [...state.scene.layers, newLayer] } };
    }),

  renameLayer: (layerId, name) =>
    set((state) => ({
      scene: {
        ...state.scene,
        layers: state.scene.layers.map((layer) =>
          layer.id === layerId ? { ...layer, name } : layer
        ),
      },
    })),

  deleteLayer: (layerId) =>
    set((state) => {
      const remaining = state.scene.layers.filter((l) => l.id !== layerId);
      if (remaining.length === 0) return state; // always keep at least one layer

      const fallback = [...remaining].sort((a, b) => a.zIndex - b.zIndex)[0];
      return {
        scene: {
          ...state.scene,
          layers: remaining,
          elements: state.scene.elements.map((el) =>
            el.layerId === layerId ? { ...el, layerId: fallback.id } : el
          ),
        },
        activeLayerId: state.activeLayerId === layerId ? fallback.id : state.activeLayerId,
      };
    }),

  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  toggleSnapToSockets: () => set((state) => ({ snapToSockets: !state.snapToSockets })),
  toggleKeepRatio: () => set((state) => ({ keepRatio: !state.keepRatio })),

  addCustomEntries: (entries) =>
    set((state) => ({ customEntries: [...state.customEntries, ...entries] })),

  renameCustomEntry: (registryId, label) =>
    set((state) => ({
      customEntries: state.customEntries.map((entry) =>
        entry.id === registryId
          ? {
              ...entry,
              visualBySkin: {
                tactical: { ...entry.visualBySkin.tactical, label },
                illustrated: { ...entry.visualBySkin.illustrated, label },
              },
            }
          : entry
      ),
    })),

  replaceScene: (scene, customEntries) =>
    set(() => ({
      scene: { ...scene, chatMessages: scene.chatMessages ?? [] },
      customEntries,
      selectedElementId: null,
      activeLayerId: scene.layers[0]?.id ?? 'layer-objects',
    })),

  appendChatMessages: (messages) =>
    set((state) => ({
      scene: { ...state.scene, chatMessages: [...state.scene.chatMessages, ...messages] },
    })),

  clearChat: () => set((state) => ({ scene: { ...state.scene, chatMessages: [] } })),
}));

/** Resolves a registry entry across both the static catalog and user-imported custom entries. */
export function resolveRegistryEntry(
  registryId: string,
  customEntries: RegistryEntry[]
): RegistryEntry | undefined {
  return getStaticRegistryEntry(registryId) ?? customEntries.find((e) => e.id === registryId);
}

export function useRegistryEntry(registryId: string): RegistryEntry | undefined {
  const customEntries = useSceneStore((s) => s.customEntries);
  return resolveRegistryEntry(registryId, customEntries);
}

export function useRegistryEntriesByCategory(theme: Theme): Record<string, RegistryEntry[]> {
  const customEntries = useSceneStore((s) => s.customEntries);
  const entries = [...elementRegistry, ...customEntries].filter((e) => e.theme === theme);
  return entries.reduce<Record<string, RegistryEntry[]>>((acc, entry) => {
    (acc[entry.category] ??= []).push(entry);
    return acc;
  }, {});
}
