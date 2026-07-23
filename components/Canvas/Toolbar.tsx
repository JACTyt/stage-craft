'use client';

import { useState } from 'react';
import { useRegistryEntriesByCategory, useSceneStore } from '@/lib/sceneStore';
import PanelFrame from '@/components/Canvas/PanelFrame';

const CATEGORY_LABELS: Record<string, string> = {
  terrain: 'Terrain',
  wall: 'Walls',
  furniture: 'Furniture',
  nature: 'Nature',
  fx: 'Lighting / FX',
  token: 'Tokens',
  text: 'Text',
};

export default function Toolbar() {
  const activeTheme = useSceneStore((s) => s.activeTheme);
  const entriesByCategory = useRegistryEntriesByCategory(activeTheme);
  const hasEntries = Object.keys(entriesByCategory).length > 0;
  const renameCustomEntry = useSceneStore((s) => s.renameCustomEntry);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const commitRename = () => {
    if (editingId) renameCustomEntry(editingId, editingValue.trim() || 'Untitled');
    setEditingId(null);
  };

  return (
    <PanelFrame title="Elements">
      {!hasEntries && (
        <p className="text-xs text-foreground-muted">
          No elements in this theme yet. Import a tileset to add some.
        </p>
      )}
      {Object.entries(entriesByCategory).map(([category, entries]) => (
        <div key={category}>
          <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
            {CATEGORY_LABELS[category] ?? category}
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {entries.map((entry) => {
              const visual = entry.visualBySkin.tactical;
              return (
                <div
                  key={entry.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/registry-id', entry.id)}
                  title={`Drag onto the canvas to place ${visual.label}`}
                  className="flex cursor-grab flex-col items-center gap-1 rounded-md border border-border p-1.5 text-center hover:bg-surface-raised active:cursor-grabbing"
                >
                  {visual.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- dynamic user-uploaded data URL, not a static asset
                    <img
                      src={visual.imageUrl}
                      alt={visual.label}
                      className="h-6 w-6 shrink-0 object-contain"
                    />
                  ) : (
                    <span
                      className="h-6 w-6 shrink-0"
                      style={{
                        backgroundColor: visual.fill,
                        border: `1.5px solid ${visual.stroke}`,
                        borderRadius: visual.shape === 'circle' ? '9999px' : '4px',
                      }}
                    />
                  )}
                  {editingId === entry.id ? (
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded border border-accent bg-transparent px-1 text-center text-[11px] leading-tight text-foreground"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => {
                        if (entry.theme !== 'custom') return;
                        setEditingId(entry.id);
                        setEditingValue(visual.label);
                      }}
                      title={entry.theme === 'custom' ? 'Double-click to rename' : undefined}
                      className="text-[11px] leading-tight text-foreground"
                    >
                      {visual.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </PanelFrame>
  );
}
