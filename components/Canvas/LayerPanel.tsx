'use client';

import { useState } from 'react';
import { resolveRegistryEntry, useSceneStore } from '@/lib/sceneStore';
import { Eye, EyeOff, X } from 'lucide-react';

export default function LayerPanel() {
  const layers = useSceneStore((s) => s.scene.layers);
  const elements = useSceneStore((s) => s.scene.elements);
  const activeLayerId = useSceneStore((s) => s.activeLayerId);
  const selectedElementId = useSceneStore((s) => s.selectedElementId);
  const customEntries = useSceneStore((s) => s.customEntries);
  const setActiveLayer = useSceneStore((s) => s.setActiveLayer);
  const selectElement = useSceneStore((s) => s.selectElement);
  const toggleLayerVisibility = useSceneStore((s) => s.toggleLayerVisibility);
  const addLayer = useSceneStore((s) => s.addLayer);
  const renameLayer = useSceneStore((s) => s.renameLayer);
  const deleteLayer = useSceneStore((s) => s.deleteLayer);
  const moveElementToLayer = useSceneStore((s) => s.moveElementToLayer);
  const reorderElement = useSceneStore((s) => s.reorderElement);

  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [dragOverElementId, setDragOverElementId] = useState<string | null>(null);

  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const commitRename = () => {
    if (editingLayerId) renameLayer(editingLayerId, editingValue.trim() || 'Untitled Layer');
    setEditingLayerId(null);
  };

  const handleDrop = (e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    setDragOverLayerId(null);
    const elementId = e.dataTransfer.getData('text/element-id');
    if (elementId) moveElementToLayer(elementId, layerId);
  };

  const handleDropOnElement = (e: React.DragEvent, targetElementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverLayerId(null);
    setDragOverElementId(null);
    const draggedId = e.dataTransfer.getData('text/element-id');
    if (draggedId) reorderElement(draggedId, targetElementId);
  };

  return (
    <div className="w-full space-y-2 overflow-y-auto rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          Layers
        </h2>
        <button
          type="button"
          onClick={() => addLayer(`Layer ${layers.length + 1}`)}
          title="Add layer"
          className="rounded border border-border px-1.5 text-xs text-foreground-muted hover:bg-surface-raised"
        >
          + Layer
        </button>
      </div>

      <ul className="space-y-2">
        {sortedLayers.map((layer) => {
          const layerElements = elements
            .filter((el) => el.layerId === layer.id)
            .sort((a, b) => b.zIndex - a.zIndex);
          return (
            <li
              key={layer.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverLayerId(layer.id);
              }}
              onDragLeave={() => setDragOverLayerId(null)}
              onDrop={(e) => handleDrop(e, layer.id)}
              className={`rounded-md border ${
                dragOverLayerId === layer.id
                  ? 'border-accent bg-accent/10'
                  : 'border-transparent'
              }`}
            >
              <div
                onClick={() => setActiveLayer(layer.id)}
                className={`flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                  layer.id === activeLayerId
                    ? 'bg-accent/20 text-accent'
                    : 'hover:bg-surface-raised'
                }`}
              >
                {editingLayerId === layer.id ? (
                  <input
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={commitRename}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setEditingLayerId(null);
                    }}
                    className="w-full rounded border border-accent bg-transparent px-1 text-sm text-foreground"
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingLayerId(layer.id);
                      setEditingValue(layer.name);
                    }}
                    title="Double-click to rename"
                  >
                    {layer.name}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                    title={layer.visible ? 'Hide layer' : 'Show layer'}
                    className="text-foreground-muted hover:text-foreground"
                  >
                    {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  {layers.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                      }}
                      title="Delete layer"
                      className="text-foreground-muted hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </span>
              </div>

              <ul className="space-y-0.5 px-1 py-1">
                {layerElements.length === 0 && (
                  <li className="px-2 py-0.5 text-[11px] text-foreground-muted">
                    No objects
                  </li>
                )}
                {layerElements.map((el) => {
                  const entry = resolveRegistryEntry(el.registryId, customEntries);
                  const label = entry?.visualBySkin.tactical.label ?? el.registryId;
                  return (
                    <li
                      key={el.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/element-id', el.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverElementId(el.id);
                      }}
                      onDragLeave={() => setDragOverElementId(null)}
                      onDrop={(e) => handleDropOnElement(e, el.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectElement(el.id);
                      }}
                      title="Drag to reorder within this layer, or onto another layer to move it there"
                      className={`cursor-grab truncate rounded px-2 py-0.5 text-xs active:cursor-grabbing ${
                        dragOverElementId === el.id
                          ? 'bg-accent/20'
                          : el.id === selectedElementId
                            ? 'bg-accent/10 text-accent'
                            : 'text-foreground-muted hover:bg-surface-raised'
                      }`}
                    >
                      {label}
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-foreground-muted">
        New elements are placed on the highlighted layer. Drag an object onto another one to reorder
        it (top of list renders in front), or onto another layer to move it there.
      </p>
    </div>
  );
}
