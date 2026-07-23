'use client';

import { useEffect, useState } from 'react';
import { useSceneStore } from '@/lib/sceneStore';
import type { RegistryEntry, Scene } from '@/types/scene';
import { X } from 'lucide-react';

interface SceneSummary {
  id: string;
  name: string;
  savedAt: string;
}

export default function SaveLoadControls() {
  const scene = useSceneStore((s) => s.scene);
  const customEntries = useSceneStore((s) => s.customEntries);
  const replaceScene = useSceneStore((s) => s.replaceScene);

  const [status, setStatus] = useState<string | null>(null);
  const [isLoadOpen, setIsLoadOpen] = useState(false);
  const [savedScenes, setSavedScenes] = useState<SceneSummary[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(null), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  const handleSave = async () => {
    setIsBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene, customEntries }),
      });
      if (!res.ok) throw new Error('save failed');
      setStatus('Saved');
    } catch {
      setStatus('Save failed');
    } finally {
      setIsBusy(false);
    }
  };

  const openLoad = async () => {
    setIsLoadOpen(true);
    setError(null);
    try {
      const res = await fetch('/api/scenes');
      const data = await res.json();
      setSavedScenes(data.scenes ?? []);
    } catch {
      setError('Could not reach the scenes API.');
    }
  };

  const handleLoad = async (id: string) => {
    setIsBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/scenes/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not load that scene.');
        return;
      }
      replaceScene(data.scene as Scene, (data.customEntries as RegistryEntry[]) ?? []);
      setIsLoadOpen(false);
    } catch {
      setError('Could not reach the scenes API.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy}
          className="rounded-md border border-border px-3 py-1 text-sm text-foreground-muted hover:bg-surface-raised disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={openLoad}
          className="rounded-md border border-border px-3 py-1 text-sm text-foreground-muted hover:bg-surface-raised"
        >
          Load
        </button>
        {status && <span className="text-xs text-foreground-muted">{status}</span>}
      </div>

      {isLoadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[70vh] w-full max-w-md flex-col gap-3 overflow-hidden rounded-lg bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
                Load Scene
              </h2>
              <button
                type="button"
                onClick={() => setIsLoadOpen(false)}
                className="text-foreground-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}
            {!error && savedScenes.length === 0 && (
              <p className="text-sm text-foreground-muted">No saved scenes yet.</p>
            )}

            <ul className="flex-1 space-y-1 overflow-y-auto">
              {savedScenes.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleLoad(s.id)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-surface-raised disabled:opacity-50"
                  >
                    <span className="text-foreground">{s.name}</span>
                    <span className="text-xs text-foreground-muted">
                      {new Date(s.savedAt).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
