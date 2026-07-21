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
      <div className="w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900">
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
      <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
      <input
        type="number"
        value={Math.round(value * 100) / 100}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 rounded border border-neutral-300 bg-transparent px-1.5 py-0.5 text-right dark:border-neutral-700"
      />
    </label>
  );

  return (
    <div className="w-full space-y-3 rounded-lg border border-neutral-300 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
        Inspector
      </h2>
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
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
        <div className="space-y-1.5 border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
            Character
          </h3>
          <label className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Name</span>
            <input
              type="text"
              value={element.characterSheet.name}
              onChange={(e) => updateCharacterSheet(element.id, { name: e.target.value })}
              className="w-28 rounded border border-neutral-300 bg-transparent px-1.5 py-0.5 text-right dark:border-neutral-700"
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">Color</span>
            <input
              type="color"
              value={element.color ?? '#3f7d3f'}
              onChange={(e) => setElementColor(element.id, e.target.value)}
              className="h-6 w-10 cursor-pointer rounded border border-neutral-300 bg-transparent dark:border-neutral-700"
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
        className="w-full rounded-md bg-red-600 px-2 py-1.5 text-sm font-medium text-white hover:bg-red-700"
      >
        Delete
      </button>
    </div>
  );
}
