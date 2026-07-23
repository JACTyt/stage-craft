/** A campaign that groups scenes, a character roster, notes, and lore together. */
export interface Collection {
  id: string;
  name: string;
  description: string;
  lore: string;
  sessionMemory: string;
  houseRules: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
  /** Links this note to a specific character, if it's a per-character note rather than a general campaign note. */
  characterId?: string;
}

export type AbilityName = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export type SkillName =
  | 'acrobatics'
  | 'animalHandling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleightOfHand'
  | 'stealth'
  | 'survival';

export interface Weapon {
  id: string;
  name: string;
  damage: string;
  damageType: string;
  properties: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  description: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  prepared: boolean;
  description: string;
}

/** A full D&D 5th edition character sheet — the roster entry for a PC or NPC. */
export interface GameCharacter {
  id: string;
  /** Data URL of a 256x256 center-cropped avatar image, or unset for the initials fallback. */
  avatarUrl?: string;
  name: string;
  kind: 'pc' | 'npc';
  race: string;
  className: string;
  level: number;
  background: string;
  alignment: string;

  abilities: AbilityScores;
  savingThrowProficiencies: AbilityName[];
  skillProficiencies: SkillName[];

  hp: number;
  maxHp: number;
  tempHp: number;
  ac: number;
  speed: number;
  hitDice: string;

  weapons: Weapon[];
  inventory: InventoryItem[];
  /** Spell slots per level, e.g. { "1": 4, "2": 3 }. */
  spellSlots: Record<string, number>;
  spells: Spell[];

  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  featuresAndTraits: string;
  proficienciesAndLanguages: string;
  description: string;
}
