'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';

interface CollectionSummary {
  id: string;
  name: string;
  description: string;
  savedAt: string;
}

export default function Home() {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadCollections = () => {
    fetch('/api/collections')
      .then((res) => res.json())
      .then((data) => setCollections(data.collections ?? []))
      .catch(() => setError('Could not reach the collections API.'));
  };

  useEffect(loadCollections, []);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;

    const id = nanoid();
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection: { id, name, description: newDescription.trim(), lore: '', sessionMemory: '', houseRules: '' },
        notes: [],
        characters: [],
      }),
    });

    if (!res.ok) {
      setError('Could not create the collection.');
      return;
    }

    router.push(`/collections/${id}`);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-neutral-100 p-8 dark:bg-neutral-950">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">
          StageCraft
        </h1>
        <button
          type="button"
          onClick={() => setIsCreating((v) => !v)}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Collection
        </button>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isCreating && (
        <div className="space-y-2 rounded-lg border border-neutral-300 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Campaign name"
            className="w-full rounded border border-neutral-300 bg-transparent px-2 py-1.5 text-sm dark:border-neutral-700"
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Short description (optional)"
            rows={2}
            className="w-full resize-none rounded border border-neutral-300 bg-transparent px-2 py-1.5 text-sm dark:border-neutral-700"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {collections.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => router.push(`/collections/${c.id}`)}
            className="rounded-lg border border-neutral-300 bg-white p-4 text-left hover:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <h2 className="font-medium text-neutral-800 dark:text-neutral-100">{c.name}</h2>
            {c.description && (
              <p className="mt-1 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">
                {c.description}
              </p>
            )}
            <p className="mt-2 text-xs text-neutral-400">
              {new Date(c.savedAt).toLocaleString()}
            </p>
          </button>
        ))}
        {collections.length === 0 && !isCreating && (
          <p className="text-sm text-neutral-400">
            No campaigns yet — create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
