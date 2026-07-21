import type { ElementCategory, Scene } from '@/types/scene';
import { resolveRegistryEntry, useSceneStore } from '@/lib/sceneStore';
import { rollDice } from '@/lib/gm/tools';

const DEFAULT_LAYER_NAME_BY_CATEGORY: Record<ElementCategory, string> = {
  terrain: 'Terrain',
  wall: 'Objects',
  furniture: 'Objects',
  nature: 'Objects',
  fx: 'Fog / Lighting',
  token: 'Grid / Tokens',
  text: 'Objects',
};

function layerIdForCategory(category: ElementCategory, scene: Scene, fallbackLayerId: string): string {
  const preferredName = DEFAULT_LAYER_NAME_BY_CATEGORY[category];
  const match = scene.layers.find((l) => l.name === preferredName);
  if (match) return match.id;
  return scene.layers.some((l) => l.id === fallbackLayerId) ? fallbackLayerId : scene.layers[0].id;
}

/**
 * Executes one tool_use block against the live scene store and returns a
 * plain-string result to send back to the model as a tool_result block.
 * This is the only place GM tool calls actually touch app state — the
 * server that talks to the Anthropic API never mutates anything itself.
 */
export function executeToolCall(name: string, input: Record<string, unknown>): string {
  const store = useSceneStore.getState();
  const { scene, customEntries } = store;

  switch (name) {
    case 'get_scene_state': {
      const elements = scene.elements.map((el) => {
        const entry = resolveRegistryEntry(el.registryId, customEntries);
        return {
          id: el.id,
          registryId: el.registryId,
          category: entry?.category,
          label: entry?.visualBySkin[scene.activeSkin]?.label,
          x: el.x,
          y: el.y,
          rotation: el.rotation,
          layerId: el.layerId,
          characterSheet: el.characterSheet,
        };
      });
      return JSON.stringify({
        sceneName: scene.name,
        activeSkin: scene.activeSkin,
        layers: scene.layers.map((l) => ({ id: l.id, name: l.name, visible: l.visible })),
        elements,
      });
    }

    case 'add_element': {
      const registryId = String(input.registryId ?? '');
      const entry = resolveRegistryEntry(registryId, customEntries);
      if (!entry) return `Error: no registry entry with id "${registryId}".`;

      const layerId = layerIdForCategory(entry.category, scene, store.activeLayerId);
      const previousActiveLayer = store.activeLayerId;
      store.setActiveLayer(layerId);
      store.addElement(registryId, { x: Number(input.x), y: Number(input.y) });
      store.setActiveLayer(previousActiveLayer);

      const newElement = useSceneStore.getState().selectedElementId;
      return `Added ${entry.visualBySkin[scene.activeSkin]?.label ?? registryId} (elementId: ${newElement}) at (${input.x}, ${input.y}).`;
    }

    case 'move_element': {
      const elementId = String(input.elementId ?? '');
      if (!scene.elements.some((el) => el.id === elementId)) {
        return `Error: no element with id "${elementId}".`;
      }
      store.moveElement(elementId, Number(input.x), Number(input.y));
      return `Moved ${elementId} to (${input.x}, ${input.y}).`;
    }

    case 'rotate_element': {
      const elementId = String(input.elementId ?? '');
      if (!scene.elements.some((el) => el.id === elementId)) {
        return `Error: no element with id "${elementId}".`;
      }
      store.rotateElement(elementId, Number(input.rotation));
      return `Rotated ${elementId} to ${input.rotation} degrees.`;
    }

    case 'scale_element': {
      const elementId = String(input.elementId ?? '');
      if (!scene.elements.some((el) => el.id === elementId)) {
        return `Error: no element with id "${elementId}".`;
      }
      store.scaleElement(elementId, Number(input.scaleX), Number(input.scaleY));
      return `Scaled ${elementId} to (${input.scaleX}, ${input.scaleY}).`;
    }

    case 'delete_element': {
      const elementId = String(input.elementId ?? '');
      if (!scene.elements.some((el) => el.id === elementId)) {
        return `Error: no element with id "${elementId}".`;
      }
      store.deleteElement(elementId);
      return `Deleted ${elementId}.`;
    }

    case 'update_character': {
      const elementId = String(input.elementId ?? '');
      const element = scene.elements.find((el) => el.id === elementId);
      if (!element) return `Error: no element with id "${elementId}".`;
      if (!element.characterSheet) return `Error: element "${elementId}" is not a token with a character sheet.`;

      const patch: Record<string, unknown> = {};
      if (typeof input.name === 'string') patch.name = input.name;
      if (typeof input.hp === 'number') patch.hp = input.hp;
      if (typeof input.maxHp === 'number') patch.maxHp = input.maxHp;
      if (typeof input.ac === 'number') patch.ac = input.ac;
      if (typeof input.initiative === 'number') patch.initiative = input.initiative;

      store.updateCharacterSheet(elementId, patch);
      return `Updated character sheet for ${elementId}: ${JSON.stringify(patch)}.`;
    }

    case 'roll_dice': {
      try {
        const result = rollDice(String(input.notation ?? ''));
        const reason = input.reason ? ` (${input.reason})` : '';
        return `Rolled ${result.notation}${reason}: [${result.rolls.join(', ')}] ${
          result.modifier ? (result.modifier > 0 ? `+${result.modifier}` : result.modifier) : ''
        } = ${result.total}`;
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : 'invalid dice notation'}`;
      }
    }

    default:
      return `Error: unknown tool "${name}".`;
  }
}
