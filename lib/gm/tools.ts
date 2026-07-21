/**
 * Tool schemas the AI Game Master can call, in Anthropic's tool-use format.
 * Shared between the server route (passed to the Messages API as `tools`)
 * and the client executor (lib/gm/executeToolCall.ts), which is the only
 * place these calls actually touch the scene — the server never mutates
 * app state directly, it only decides what the model wants to do.
 */
export const GM_TOOLS = [
  {
    name: 'get_scene_state',
    description:
      "Returns the current scene's layers and every placed element (id, category, label, position, rotation, and character sheet if it's a token). Call this before referencing anything already on the map, since the player may have edited it outside the chat.",
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'add_element',
    description:
      'Places a new element on the map from the registry (terrain, wall, furniture, nature, fx, or token). Use get_scene_state first if you need to know what registry ids are available or avoid overlapping something.',
    input_schema: {
      type: 'object',
      properties: {
        registryId: { type: 'string', description: 'Registry entry id, e.g. "token-monster" or "wall-stone".' },
        x: { type: 'number' },
        y: { type: 'number' },
      },
      required: ['registryId', 'x', 'y'],
    },
  },
  {
    name: 'move_element',
    description: 'Moves an existing element to a new position.',
    input_schema: {
      type: 'object',
      properties: {
        elementId: { type: 'string' },
        x: { type: 'number' },
        y: { type: 'number' },
      },
      required: ['elementId', 'x', 'y'],
    },
  },
  {
    name: 'rotate_element',
    description: 'Rotates an existing element to an absolute angle in degrees.',
    input_schema: {
      type: 'object',
      properties: {
        elementId: { type: 'string' },
        rotation: { type: 'number' },
      },
      required: ['elementId', 'rotation'],
    },
  },
  {
    name: 'scale_element',
    description: 'Resizes an existing element by setting its scale factors (1 = default size).',
    input_schema: {
      type: 'object',
      properties: {
        elementId: { type: 'string' },
        scaleX: { type: 'number' },
        scaleY: { type: 'number' },
      },
      required: ['elementId', 'scaleX', 'scaleY'],
    },
  },
  {
    name: 'delete_element',
    description: 'Removes an element from the scene entirely.',
    input_schema: {
      type: 'object',
      properties: {
        elementId: { type: 'string' },
      },
      required: ['elementId'],
    },
  },
  {
    name: 'update_character',
    description:
      "Updates a token's character sheet (name, hp, maxHp, ac, initiative). Only fields provided are changed. Use this to apply damage/healing (adjust hp) or set initiative order.",
    input_schema: {
      type: 'object',
      properties: {
        elementId: { type: 'string' },
        name: { type: 'string' },
        hp: { type: 'number' },
        maxHp: { type: 'number' },
        ac: { type: 'number' },
        initiative: { type: 'number' },
      },
      required: ['elementId'],
    },
  },
  {
    name: 'roll_dice',
    description:
      'Rolls dice using standard D&D notation (e.g. "1d20+5", "2d6", "1d8-1") and returns the true random result. Always use this instead of inventing a number for attack rolls, checks, saves, or damage.',
    input_schema: {
      type: 'object',
      properties: {
        notation: { type: 'string', description: 'Dice notation like "1d20+5".' },
        reason: { type: 'string', description: 'What this roll is for, e.g. "goblin attack roll".' },
      },
      required: ['notation'],
    },
  },
] as const;

export interface DiceRollResult {
  notation: string;
  rolls: number[];
  modifier: number;
  total: number;
}

const DICE_PATTERN = /^(\d+)d(\d+)([+-]\d+)?$/i;

export function rollDice(notation: string): DiceRollResult {
  const match = DICE_PATTERN.exec(notation.trim());
  if (!match) {
    throw new Error(`Invalid dice notation: "${notation}". Expected format like "1d20+5".`);
  }

  const count = Math.min(100, parseInt(match[1], 10));
  const sides = Math.max(1, parseInt(match[2], 10));
  const modifier = match[3] ? parseInt(match[3], 10) : 0;

  const rolls = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
  const total = rolls.reduce((sum, r) => sum + r, 0) + modifier;

  return { notation, rolls, modifier, total };
}
