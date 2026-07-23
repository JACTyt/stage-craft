'use client';

import { useRegistryEntry, useSceneStore } from '@/lib/sceneStore';

export default function Inspector() {
  const selectedElementId = useSceneStore((s) => s.selectedElementId);
  const element = useSceneStore((s) =>
    s.scene.elements.find((el) => el.id === s.selectedElementId)
  );
  const moveElement = useSceneStore((s) => s.moveElement);
  const rotateElement = useSceneStore((s) => s.rotateElement);
  const scaleElement = useSceneStore((s) => s.scaleElement);
  const deleteElement = useSceneStore((s) => s.deleteElement);
  const updateCharacterSheet = useSceneStore((s) => s.updateCharacterSheet);
  const setElementColor = useSceneStore((s) => s.setElementColor);
  const entry = useRegistryEntry(element?.registryId ?? '');

  if (!selectedElementId || !element) {
    return (
      <div className="w-full rounded-lg border border-border bg-surface p-3 text-sm text-foreground-muted">
        Select an element to edit its transform.
      </div>
    );
  }

  const field = (
    label: string,
    value: number,
    onChange: (v: number) => void,
    step = 1
  ) => (
    <label className="flex items-center justify-between text-sm">
      <span className="text-foreground-muted">{label}</span>
      <input
        type="number"
        value={Math.round(value * 100) / 100}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 rounded border border-border bg-transparent px-1.5 py-0.5 text-right text-foreground"
      />
    </label>
  );

  return (
    <div className="w-full space-y-3 rounded-lg border border-border bg-surface p-3">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground-muted">
        Inspector
      </h2>
      <p className="text-sm font-medium text-foreground">
        {entry?.visualBySkin.tactical.label ?? element.registryId}
      </p>
      <div className="space-y-1.5">
        {field('X', element.x, (v) => moveElement(element.id, v, element.y))}
        {field('Y', element.y, (v) => moveElement(element.id, element.x, v))}
        {field('Rotation', element.rotation, (v) => rotateElement(element.id, v))}
        {field('Scale X', element.scaleX, (v) => scaleElement(element.id, v, element.scaleY), 0.1)}
        {field('Scale Y', element.scaleY, (v) => scaleElement(element.id, element.scaleX, v), 0.1)}
      </div>

      {element.characterSheet && (
        <div className="space-y-1.5 border-t border-border pt-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Character
          </h3>
          <label className="flex items-center justify-between text-sm">
            <span className="text-foreground-muted">Name</span>
            <input
              type="text"
              value={element.characterSheet.name}
              onChange={(e) => updateCharacterSheet(element.id, { name: e.target.value })}
              className="w-28 rounded border border-border bg-transparent px-1.5 py-0.5 text-right text-foreground"
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="text-foreground-muted">Color</span>
            <input
              type="color"
              value={element.color ?? '#3f7d3f'}
              onChange={(e) => setElementColor(element.id, e.target.value)}
              className="h-6 w-10 cursor-pointer rounded border border-border bg-transparent"
            />
          </label>
          {field('HP', element.characterSheet.hp, (v) =>
            updateCharacterSheet(element.id, { hp: v })
          )}
          {field('Max HP', element.characterSheet.maxHp, (v) =>
            updateCharacterSheet(element.id, { maxHp: v })
          )}
          {field('AC', element.characterSheet.ac, (v) =>
            updateCharacterSheet(element.id, { ac: v })
          )}
          {field('Initiative', element.characterSheet.initiative, (v) =>
            updateCharacterSheet(element.id, { initiative: v })
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => deleteElement(element.id)}
        className="w-full rounded-md bg-danger px-2 py-1.5 text-sm font-medium text-accent-foreground hover:bg-danger-hover"
      >
        Delete
      </button>
    </div>
  );
}
