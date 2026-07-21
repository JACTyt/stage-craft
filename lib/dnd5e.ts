import type { AbilityName, GameCharacter, SkillName } from '@/types/collection';

export const ABILITY_NAMES: AbilityName[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const ABILITY_LABELS: Record<AbilityName, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export const SKILL_ABILITY: Record<SkillName, AbilityName> = {
  acrobatics: 'dex',
  animalHandling: 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  sleightOfHand: 'dex',
  stealth: 'dex',
  survival: 'wis',
};

export const SKILL_LABELS: Record<SkillName, string> = {
  acrobatics: 'Acrobatics',
  animalHandling: 'Animal Handling',
  arcana: 'Arcana',
  athletics: 'Athletics',
  deception: 'Deception',
  history: 'History',
  insight: 'Insight',
  intimidation: 'Intimidation',
  investigation: 'Investigation',
  medicine: 'Medicine',
  nature: 'Nature',
  perception: 'Perception',
  performance: 'Performance',
  persuasion: 'Persuasion',
  religion: 'Religion',
  sleightOfHand: 'Sleight of Hand',
  stealth: 'Stealth',
  survival: 'Survival',
};

export const SKILL_NAMES = Object.keys(SKILL_LABELS) as SkillName[];

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function proficiencyBonusForLevel(level: number): number {
  return Math.floor((Math.max(1, level) - 1) / 4) + 2;
}

export function skillBonus(character: GameCharacter, skill: SkillName): number {
  const mod = abilityModifier(character.abilities[SKILL_ABILITY[skill]]);
  const proficient = character.skillProficiencies.includes(skill);
  return mod + (proficient ? proficiencyBonusForLevel(character.level) : 0);
}

export function savingThrowBonus(character: GameCharacter, ability: AbilityName): number {
  const mod = abilityModifier(character.abilities[ability]);
  const proficient = character.savingThrowProficiencies.includes(ability);
  return mod + (proficient ? proficiencyBonusForLevel(character.level) : 0);
}

export function passivePerception(character: GameCharacter): number {
  return 10 + skillBonus(character, 'perception');
}

export function createBlankCharacter(id: string): GameCharacter {
  return {
    id,
    name: 'New Character',
    kind: 'npc',
    race: '',
    className: '',
    level: 1,
    background: '',
    alignment: '',
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrowProficiencies: [],
    skillProficiencies: [],
    hp: 10,
    maxHp: 10,
    tempHp: 0,
    ac: 10,
    speed: 30,
    hitDice: '1d8',
    weapons: [],
    inventory: [],
    spellSlots: {},
    spells: [],
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    featuresAndTraits: '',
    proficienciesAndLanguages: '',
    description: '',
  };
}
