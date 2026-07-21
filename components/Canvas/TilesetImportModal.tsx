'use client';

import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import type { ElementCategory, RegistryEntry } from '@/types/scene';
import { useSceneStore } from '@/lib/sceneStore';

const CATEGORIES: ElementCategory[] = [
  'terrain',
  'wall',
  'furniture',
  'nature',
  'fx',
  'token',
  'text',
];

const MAX_DEFAULT_DIMENSION = 160;

interface ApiSlice {
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
}

interface PendingPart {
  slice: ApiSlice;
  name: string;
  category: ElementCategory;
}

export default function TilesetImportModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [bundledFiles, setBundledFiles] = useState<string[]>([]);
  const [parts, setParts] = useState<PendingPart[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addCustomEntries = useSceneStore((s) => s.addCustomEntries);
  const setActiveTheme = useSceneStore((s) => s.setActiveTheme);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/tilesets')
      .then((res) => res.json())
      .then((data) => setBundledFiles(data.files ?? []))
      .catch(() => setBundledFiles([]));
  }, [isOpen]);

  const reset = () => {
    setParts([]);
    setError(null);
  };

  const applySlices = (slices: ApiSlice[]) => {
    if (slices.length === 0) {
      setError('No non-transparent regions found. Use a PNG with transparent gaps between pieces.');
      setParts([]);
      return;
    }
    setParts(
      slices.map((slice, i) => ({
        slice,
        name: `Part ${i + 1}`,
        category: 'terrain' as ElementCategory,
      }))
    );
  };

  const sliceViaApi = async (formData: FormData) => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/tilesets/slice', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not process that tileset.');
        setParts([]);
        return;
      }
      applySlices(data.slices ?? []);
    } catch {
      setError('Could not reach the tileset import API.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFile = (file: File) => {
    const formData = new FormData();
    formData.set('file', file);
    sliceViaApi(formData);
  };

  const handleBundled = (filename: string) => {
    const formData = new FormData();
    formData.set('filename', filename);
    sliceViaApi(formData);
  };

  const updatePart = (index: number, patch: Partial<PendingPart>) => {
    setParts((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const handleAddAll = () => {
    const entries: RegistryEntry[] = parts.map(({ slice, name, category }) => {
      const downscale = Math.min(1, MAX_DEFAULT_DIMENSION / Math.max(slice.width, slice.height));
      const defaultSize = {
        width: Math.round(slice.width * downscale),
        height: Math.round(slice.height * downscale),
      };
      const visual = {
        shape: 'rect' as const,
        fill: 'transparent',
        stroke: 'transparent',
        label: name,
        imageUrl: slice.dataUrl,
      };
      return {
        id: `custom-${nanoid()}`,
        category,
        theme: 'custom' as const,
        tags: ['custom'],
        visualBySkin: { tactical: visual, illustrated: visual },
        defaultSize,
      };
    });

    addCustomEntries(entries);
    setActiveTheme('custom');
    setIsOpen(false);
    reset();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md border border-neutral-300 px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        Import Tileset
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-4 overflow-hidden rounded-lg bg-white p-5 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                Import Tileset
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  reset();
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Slicing runs on the server: upload a PNG sprite sheet with transparent
              gaps between pieces, or pick one already bundled in{' '}
              <code>public/tilesets</code>. Each connected region of non-transparent
              pixels becomes one element you can rename, categorize, and place on the
              canvas.
            </p>

            {bundledFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bundledFiles.map((filename) => (
                  <button
                    key={filename}
                    type="button"
                    onClick={() => handleBundled(filename)}
                    className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {filename}
                  </button>
                ))}
              </div>
            )}

            <input
              type="file"
              accept="image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="text-sm text-neutral-600 dark:text-neutral-300"
            />

            {isProcessing && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Slicing tileset…
              </p>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {parts.length > 0 && (
              <div className="flex-1 space-y-2 overflow-y-auto">
                {parts.map((part, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-md border border-neutral-200 p-2 dark:border-neutral-700"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- dynamic data URL from the slicing API, not a static asset */}
                    <img
                      src={part.slice.dataUrl}
                      alt={part.name}
                      className="h-10 w-10 shrink-0 rounded border border-neutral-200 object-contain dark:border-neutral-700"
                    />
                    <input
                      type="text"
                      value={part.name}
                      onChange={(e) => updatePart(i, { name: e.target.value })}
                      className="flex-1 rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
                    />
                    <select
                      value={part.category}
                      onChange={(e) =>
                        updatePart(i, { category: e.target.value as ElementCategory })
                      }
                      className="rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <span className="w-16 shrink-0 text-right text-xs text-neutral-400">
                      {part.slice.width}×{part.slice.height}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {parts.length > 0 && (
              <button
                type="button"
                onClick={handleAddAll}
                className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add {parts.length} {parts.length === 1 ? 'part' : 'parts'} to Custom theme
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
