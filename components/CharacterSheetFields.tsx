'use client';

import { nanoid } from 'nanoid';
import type { AbilityName, GameCharacter, SkillName } from '@/types/collection';
import {
  ABILITY_LABELS,
  ABILITY_NAMES,
  SKILL_LABELS,
  SKILL_NAMES,
  abilityModifier,
  formatModifier,
  passivePerception,
  proficiencyBonusForLevel,
  savingThrowBonus,
  skillBonus,
} from '@/lib/dnd5e';

interface CharacterSheetFieldsProps {
  character: GameCharacter;
  /** Updates local state only (no persistence) — used for onChange of text/number fields. */
  onChange: (patch: Partial<GameCharacter>) => void;
  /** Persists. With a patch, applies it and persists immediately (avoids stale-state races on delete/select/checkbox). Without one, persists whatever onChange already applied (used on text-field blur). */
  onCommit: (patch?: Partial<GameCharacter>) => void;
}

const inputCls =
  'rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700';
const labelCls = 'text-xs text-neutral-500 dark:text-neutral-400';

/** Full D&D 5e character sheet fields — shared by the dedicated character page and the in-scene Characters panel. */
export default function CharacterSheetFields({ character, onChange, onCommit }: CharacterSheetFieldsProps) {
  const toggleSavingThrow = (ability: AbilityName) => {
    const has = character.savingThrowProficiencies.includes(ability);
    const savingThrowProficiencies = has
      ? character.savingThrowProficiencies.filter((a) => a !== ability)
      : [...character.savingThrowProficiencies, ability];
    onCommit({ savingThrowProficiencies });
  };

  const toggleSkill = (skill: SkillName) => {
    const has = character.skillProficiencies.includes(skill);
    const skillProficiencies = has
      ? character.skillProficiencies.filter((s) => s !== skill)
      : [...character.skillProficiencies, skill];
    onCommit({ skillProficiencies });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Identity */}
      <section className="grid grid-cols-2 gap-3 rounded-lg border border-neutral-300 bg-white p-4 sm:grid-cols-4 dark:border-neutral-700 dark:bg-neutral-900">
        <label className="space-y-1">
          <span className={labelCls}>Kind</span>
          <select
            value={character.kind}
            onChange={(e) => onCommit({ kind: e.target.value as 'pc' | 'npc' })}
            className={`${inputCls} w-full`}
          >
            <option value="pc">PC</option>
            <option value="npc">NPC</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Race</span>
          <input value={character.race} onChange={(e) => onChange({ race: e.target.value })} onBlur={() => onCommit()} className={`${inputCls} w-full`} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Class</span>
          <input value={character.className} onChange={(e) => onChange({ className: e.target.value })} onBlur={() => onCommit()} className={`${inputCls} w-full`} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Level</span>
          <input
            type="number"
            value={character.level}
            onChange={(e) => onChange({ level: Number(e.target.value) })}
            onBlur={() => onCommit()}
            className={`${inputCls} w-full`}
          />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Background</span>
          <input value={character.background} onChange={(e) => onChange({ background: e.target.value })} onBlur={() => onCommit()} className={`${inputCls} w-full`} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Alignment</span>
          <input value={character.alignment} onChange={(e) => onChange({ alignment: e.target.value })} onBlur={() => onCommit()} className={`${inputCls} w-full`} />
        </label>
        <div className="space-y-1">
          <span className={labelCls}>Proficiency Bonus</span>
          <p className="px-2 py-1 text-sm font-medium">{formatModifier(proficiencyBonusForLevel(character.level))}</p>
        </div>
        <div className="space-y-1">
          <span className={labelCls}>Passive Perception</span>
          <p className="px-2 py-1 text-sm font-medium">{passivePerception(character)}</p>
        </div>
      </section>

      {/* Ability scores */}
      <section className="rounded-lg border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="mb-3 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Ability Scores</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {ABILITY_NAMES.map((ability) => (
            <div key={ability} className="rounded-lg border border-neutral-200 p-2 text-center dark:border-neutral-700">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">{ABILITY_LABELS[ability]}</span>
              <input
                type="number"
                value={character.abilities[ability]}
                onChange={(e) => onChange({ abilities: { ...character.abilities, [ability]: Number(e.target.value) } })}
                onBlur={() => onCommit()}
                className="w-full rounded border border-neutral-300 bg-transparent py-1 text-center text-lg font-semibold dark:border-neutral-700"
              />
              <span className="text-xs text-neutral-400">
                {formatModifier(abilityModifier(character.abilities[ability]))}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Combat stats */}
      <section className="grid grid-cols-3 gap-3 rounded-lg border border-neutral-300 bg-white p-4 sm:grid-cols-6 dark:border-neutral-700 dark:bg-neutral-900">
        <label className="space-y-1">
          <span className={labelCls}>HP</span>
          <input type="number" value={character.hp} onChange={(e) => onChange({ hp: Number(e.target.value) })} onBlur={() => onCommit()} className={`${inputCls} w-full`} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Max HP</span>
          <input type="number" value={character.maxHp} onChange={(e) => onChange({ maxHp: Number(e.target.value) })} onBlur={() => onCommit()} className={`${inputCls} w-full`} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Temp HP</span>
          <input type="number" value={character.tempHp} onChange={(e) => onChange({ tempHp: Number(e.target.value) })} onBlur={() => onCommit()} className={`${inputCls} w-full`} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>AC</span>
          <input type="number" value={character.ac} onChange={(e) => onChange({ ac: Number(e.target.value) })} onBlur={() => onCommit()} className={`${inputCls} w-full`} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Speed</span>
          <input type="number" value={character.speed} onChange={(e) => onChange({ speed: Number(e.target.value) })} onBlur={() => onCommit()} className={`${inputCls} w-full`} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Hit Dice</span>
          <input value={character.hitDice} onChange={(e) => onChange({ hitDice: e.target.value })} onBlur={() => onCommit()} className={`${inputCls} w-full`} />
        </label>
        <div className="space-y-1">
          <span className={labelCls}>Initiative</span>
          <p className="px-2 py-1 text-sm font-medium">{formatModifier(abilityModifier(character.abilities.dex))}</p>
        </div>
      </section>

      {/* Saving throws + skills */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Saving Throws</h2>
          <div className="space-y-1">
            {ABILITY_NAMES.map((ability) => (
              <label key={ability} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={character.savingThrowProficiencies.includes(ability)}
                    onChange={() => toggleSavingThrow(ability)}
                  />
                  {ABILITY_LABELS[ability]}
                </span>
                <span className="text-neutral-400">{formatModifier(savingThrowBonus(character, ability))}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Skills</h2>
          <div className="space-y-1">
            {SKILL_NAMES.map((skill) => (
              <label key={skill} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={character.skillProficiencies.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                  />
                  {SKILL_LABELS[skill]}
                </span>
                <span className="text-neutral-400">{formatModifier(skillBonus(character, skill))}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Weapons */}
      <section className="space-y-2 rounded-lg border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Weapons &amp; Attacks</h2>
          <button
            type="button"
            onClick={() =>
              onCommit({ weapons: [...character.weapons, { id: nanoid(), name: '', damage: '', damageType: '', properties: '' }] })
            }
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            + Weapon
          </button>
        </div>
        {character.weapons.map((w) => (
          <div key={w.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-2 text-sm">
            <input
              value={w.name}
              placeholder="Name"
              onChange={(e) => onChange({ weapons: character.weapons.map((x) => (x.id === w.id ? { ...x, name: e.target.value } : x)) })}
              onBlur={() => onCommit()}
              className={inputCls}
            />
            <input
              value={w.damage}
              placeholder="Damage"
              onChange={(e) => onChange({ weapons: character.weapons.map((x) => (x.id === w.id ? { ...x, damage: e.target.value } : x)) })}
              onBlur={() => onCommit()}
              className={inputCls}
            />
            <input
              value={w.damageType}
              placeholder="Type"
              onChange={(e) => onChange({ weapons: character.weapons.map((x) => (x.id === w.id ? { ...x, damageType: e.target.value } : x)) })}
              onBlur={() => onCommit()}
              className={inputCls}
            />
            <input
              value={w.properties}
              placeholder="Properties"
              onChange={(e) => onChange({ weapons: character.weapons.map((x) => (x.id === w.id ? { ...x, properties: e.target.value } : x)) })}
              onBlur={() => onCommit()}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => onCommit({ weapons: character.weapons.filter((x) => x.id !== w.id) })}
              className="text-neutral-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
        {character.weapons.length === 0 && <p className="text-sm text-neutral-400">No weapons yet.</p>}
      </section>

      {/* Inventory */}
      <section className="space-y-2 rounded-lg border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Inventory</h2>
          <button
            type="button"
            onClick={() =>
              onCommit({ inventory: [...character.inventory, { id: nanoid(), name: '', quantity: 1, description: '' }] })
            }
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            + Item
          </button>
        </div>
        {character.inventory.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_auto_2fr_auto] items-center gap-2 text-sm">
            <input
              value={item.name}
              placeholder="Name"
              onChange={(e) => onChange({ inventory: character.inventory.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)) })}
              onBlur={() => onCommit()}
              className={inputCls}
            />
            <input
              type="number"
              value={item.quantity}
              onChange={(e) =>
                onChange({
                  inventory: character.inventory.map((x) =>
                    x.id === item.id ? { ...x, quantity: Number(e.target.value) } : x
                  ),
                })
              }
              onBlur={() => onCommit()}
              className={`${inputCls} w-16`}
            />
            <input
              value={item.description}
              placeholder="Description"
              onChange={(e) =>
                onChange({
                  inventory: character.inventory.map((x) =>
                    x.id === item.id ? { ...x, description: e.target.value } : x
                  ),
                })
              }
              onBlur={() => onCommit()}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => onCommit({ inventory: character.inventory.filter((x) => x.id !== item.id) })}
              className="text-neutral-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
        {character.inventory.length === 0 && <p className="text-sm text-neutral-400">No items yet.</p>}
      </section>

      {/* Spellcasting */}
      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Spellcasting</h2>
        <div>
          <p className={`${labelCls} mb-1`}>Spell Slots</p>
          <div className="grid grid-cols-9 gap-1">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((level) => (
              <label key={level} className="text-center">
                <span className="block text-[10px] text-neutral-400">Lv{level}</span>
                <input
                  type="number"
                  min={0}
                  value={character.spellSlots[level] ?? 0}
                  onChange={(e) => onChange({ spellSlots: { ...character.spellSlots, [level]: Number(e.target.value) } })}
                  onBlur={() => onCommit()}
                  className={`${inputCls} w-full px-1 text-center`}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className={labelCls}>Spells</p>
          <button
            type="button"
            onClick={() =>
              onCommit({ spells: [...character.spells, { id: nanoid(), name: '', level: 0, prepared: false, description: '' }] })
            }
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            + Spell
          </button>
        </div>
        {character.spells.map((spell) => (
          <div key={spell.id} className="grid grid-cols-[2fr_auto_auto_3fr_auto] items-center gap-2 text-sm">
            <input
              value={spell.name}
              placeholder="Name"
              onChange={(e) => onChange({ spells: character.spells.map((x) => (x.id === spell.id ? { ...x, name: e.target.value } : x)) })}
              onBlur={() => onCommit()}
              className={inputCls}
            />
            <input
              type="number"
              value={spell.level}
              title="Level (0 = cantrip)"
              onChange={(e) => onChange({ spells: character.spells.map((x) => (x.id === spell.id ? { ...x, level: Number(e.target.value) } : x)) })}
              onBlur={() => onCommit()}
              className={`${inputCls} w-14`}
            />
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={spell.prepared}
                onChange={(e) =>
                  onCommit({ spells: character.spells.map((x) => (x.id === spell.id ? { ...x, prepared: e.target.checked } : x)) })
                }
              />
              Prep
            </label>
            <input
              value={spell.description}
              placeholder="Description"
              onChange={(e) =>
                onChange({
                  spells: character.spells.map((x) => (x.id === spell.id ? { ...x, description: e.target.value } : x)),
                })
              }
              onBlur={() => onCommit()}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => onCommit({ spells: character.spells.filter((x) => x.id !== spell.id) })}
              className="text-neutral-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
        {character.spells.length === 0 && <p className="text-sm text-neutral-400">No spells yet.</p>}
      </section>

      {/* Personality & background */}
      <section className="grid grid-cols-1 gap-3 rounded-lg border border-neutral-300 bg-white p-4 sm:grid-cols-2 dark:border-neutral-700 dark:bg-neutral-900">
        <label className="space-y-1">
          <span className={labelCls}>Personality Traits</span>
          <textarea value={character.personalityTraits} onChange={(e) => onChange({ personalityTraits: e.target.value })} onBlur={() => onCommit()} rows={2} className={`${inputCls} w-full resize-none`} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Ideals</span>
          <textarea value={character.ideals} onChange={(e) => onChange({ ideals: e.target.value })} onBlur={() => onCommit()} rows={2} className={`${inputCls} w-full resize-none`} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Bonds</span>
          <textarea value={character.bonds} onChange={(e) => onChange({ bonds: e.target.value })} onBlur={() => onCommit()} rows={2} className={`${inputCls} w-full resize-none`} />
        </label>
        <label className="space-y-1">
          <span className={labelCls}>Flaws</span>
          <textarea value={character.flaws} onChange={(e) => onChange({ flaws: e.target.value })} onBlur={() => onCommit()} rows={2} className={`${inputCls} w-full resize-none`} />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className={labelCls}>Features &amp; Traits</span>
          <textarea
            value={character.featuresAndTraits}
            onChange={(e) => onChange({ featuresAndTraits: e.target.value })}
            onBlur={() => onCommit()}
            rows={3}
            className={`${inputCls} w-full resize-none`}
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className={labelCls}>Proficiencies &amp; Languages</span>
          <textarea
            value={character.proficienciesAndLanguages}
            onChange={(e) => onChange({ proficienciesAndLanguages: e.target.value })}
            onBlur={() => onCommit()}
            rows={2}
            className={`${inputCls} w-full resize-none`}
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className={labelCls}>Appearance / Description</span>
          <textarea
            value={character.description}
            onChange={(e) => onChange({ description: e.target.value })}
            onBlur={() => onCommit()}
            rows={3}
            className={`${inputCls} w-full resize-none`}
          />
        </label>
      </section>
    </div>
  );
}
