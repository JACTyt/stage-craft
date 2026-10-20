'use client';

import { useRef, useState } from 'react';
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
import { cropImageToSquareDataUrl } from '@/lib/imageUtils';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Input';
import { X } from 'lucide-react';

interface CharacterSheetFieldsProps {
  character: GameCharacter;
  /** Updates local state only (no persistence) — used for onChange of text/number fields. */
  onChange: (patch: Partial<GameCharacter>) => void;
  /** Persists. With a patch, applies it and persists immediately (avoids stale-state races on delete/select/checkbox). Without one, persists whatever onChange already applied (used on text-field blur). */
  onCommit: (patch?: Partial<GameCharacter>) => void;
}

const inputCls =
  'rounded border border-border bg-transparent px-2 py-1 text-sm text-foreground focus:border-accent focus:outline-none';
const labelCls = 'text-xs text-foreground-muted';

/** Full D&D 5e character sheet fields — shared by the dedicated character page and the in-scene Characters panel. */
export default function CharacterSheetFields({ character, onChange, onCommit }: CharacterSheetFieldsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleAvatarFile = async (file: File) => {
    setAvatarError(null);
    try {
      const dataUrl = await cropImageToSquareDataUrl(file);
      onCommit({ avatarUrl: dataUrl });
    } catch {
      setAvatarError('Could not process that image.');
    }
  };

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
    <div className="@container flex flex-col gap-4">
      {/* Identity */}
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 @3xl:flex-row @3xl:items-start">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Change avatar"
            className="h-20 w-20 overflow-hidden rounded-full border-2 border-accent/50 bg-surface-raised ring-1 ring-border"
          >
            {character.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- dynamic user-uploaded data URL, not a static asset
              <img src={character.avatarUrl} alt={character.name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-foreground-muted">
                {character.name.slice(0, 2).toUpperCase() || '?'}
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarFile(file);
              e.target.value = '';
            }}
          />
          <div className="flex gap-1">
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-xs">
              Upload
            </Button>
            {character.avatarUrl && (
              <Button variant="secondary" onClick={() => onCommit({ avatarUrl: undefined })} className="text-xs">
                Remove
              </Button>
            )}
          </div>
          {avatarError && <p className="text-xs text-danger">{avatarError}</p>}
        </div>

        <div className="grid flex-1 grid-cols-2 gap-3 @3xl:grid-cols-4">
          <label className="space-y-1">
            <span className={labelCls}>Kind</span>
            <Select
              value={character.kind}
              onChange={(e) => onCommit({ kind: e.target.value as 'pc' | 'npc' })}
              className="w-full"
            >
              <option value="pc">PC</option>
              <option value="npc">NPC</option>
            </Select>
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
        </div>
      </section>

      {/* Ability scores */}
      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground-muted">Ability Scores</h2>
        <div className="grid grid-cols-3 gap-3 @3xl:grid-cols-6">
          {ABILITY_NAMES.map((ability) => (
            <div key={ability} className="rounded-lg border border-border p-2 text-center">
              <span className="text-xs text-foreground-muted">{ABILITY_LABELS[ability]}</span>
              <input
                type="number"
                value={character.abilities[ability]}
                onChange={(e) => onChange({ abilities: { ...character.abilities, [ability]: Number(e.target.value) } })}
                onBlur={() => onCommit()}
                className="w-full rounded border border-border bg-transparent py-1 text-center text-lg font-semibold text-foreground"
              />
              <span className="text-xs text-foreground-muted">
                {formatModifier(abilityModifier(character.abilities[ability]))}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Combat stats */}
      <section className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-surface p-4 @3xl:grid-cols-6">
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
      <section className="grid grid-cols-1 gap-4 @3xl:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground-muted">Saving Throws</h2>
          <div className="space-y-1">
            {ABILITY_NAMES.map((ability) => (
              <label key={ability} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Checkbox
                    checked={character.savingThrowProficiencies.includes(ability)}
                    onChange={() => toggleSavingThrow(ability)}
                  />
                  {ABILITY_LABELS[ability]}
                </span>
                <span className="text-foreground-muted">{formatModifier(savingThrowBonus(character, ability))}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground-muted">Skills</h2>
          <div className="space-y-1">
            {SKILL_NAMES.map((skill) => (
              <label key={skill} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Checkbox
                    checked={character.skillProficiencies.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                  />
                  {SKILL_LABELS[skill]}
                </span>
                <span className="text-foreground-muted">{formatModifier(skillBonus(character, skill))}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Weapons */}
      <section className="space-y-2 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground-muted">Weapons &amp; Attacks</h2>
          <button
            type="button"
            onClick={() =>
              onCommit({ weapons: [...character.weapons, { id: nanoid(), name: '', damage: '', damageType: '', properties: '' }] })
            }
            className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground-muted hover:bg-surface-raised"
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
              className="text-foreground-muted hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {character.weapons.length === 0 && <p className="text-sm text-foreground-muted">No weapons yet.</p>}
      </section>

      {/* Inventory */}
      <section className="space-y-2 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground-muted">Inventory</h2>
          <button
            type="button"
            onClick={() =>
              onCommit({ inventory: [...character.inventory, { id: nanoid(), name: '', quantity: 1, description: '' }] })
            }
            className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground-muted hover:bg-surface-raised"
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
              className="text-foreground-muted hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {character.inventory.length === 0 && <p className="text-sm text-foreground-muted">No items yet.</p>}
      </section>

      {/* Spellcasting */}
      <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold text-foreground-muted">Spellcasting</h2>
        <div>
          <p className={`${labelCls} mb-1`}>Spell Slots</p>
          <div className="grid grid-cols-9 gap-1">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((level) => (
              <label key={level} className="text-center">
                <span className="block text-[10px] text-foreground-muted">Lv{level}</span>
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
            className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground-muted hover:bg-surface-raised"
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
              <Checkbox
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
              className="text-foreground-muted hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {character.spells.length === 0 && <p className="text-sm text-foreground-muted">No spells yet.</p>}
      </section>

      {/* Personality & background */}
      <section className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface p-4 @3xl:grid-cols-2">
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
        <label className="space-y-1 @3xl:col-span-2">
          <span className={labelCls}>Features &amp; Traits</span>
          <textarea
            value={character.featuresAndTraits}
            onChange={(e) => onChange({ featuresAndTraits: e.target.value })}
            onBlur={() => onCommit()}
            rows={3}
            className={`${inputCls} w-full resize-none`}
          />
        </label>
        <label className="space-y-1 @3xl:col-span-2">
          <span className={labelCls}>Proficiencies &amp; Languages</span>
          <textarea
            value={character.proficienciesAndLanguages}
            onChange={(e) => onChange({ proficienciesAndLanguages: e.target.value })}
            onBlur={() => onCommit()}
            rows={2}
            className={`${inputCls} w-full resize-none`}
          />
        </label>
        <label className="space-y-1 @3xl:col-span-2">
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
