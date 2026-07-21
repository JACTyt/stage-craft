'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Collection, GameCharacter, Note } from '@/types/collection';

export default function LorePage() {
  const params = useParams<{ id: string }>();
  const collectionId = params.id;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [characters, setCharacters] = useState<GameCharacter[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/collections/${collectionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setCollection(data.collection);
        setNotes(data.notes ?? []);
        setCharacters(data.characters ?? []);
      })
      .catch(() => setError('Could not reach the collections API.'));
  }, [collectionId]);

  const save = async (nextCollection: Collection) => {
    setStatus(null);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: nextCollection, notes, characters }),
      });
      if (!res.ok) throw new Error();
      setStatus('Saved');
    } catch {
      setStatus('Save failed');
    }
  };

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!collection) return <div className="p-8 text-neutral-400">Loading…</div>;

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 bg-neutral-100 p-8 dark:bg-neutral-950">
      <header className="flex items-center justify-between">
        <div>
          <Link href={`/collections/${collectionId}`} className="text-xs text-neutral-400 hover:underline">
            ← {collection.name}
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Lore</h1>
        </div>
        <div className="flex items-center gap-2">
          {status && <span className="text-xs text-neutral-400">{status}</span>}
          <button
            type="button"
            onClick={() => save(collection)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Save
          </button>
        </div>
      </header>

      <textarea
        value={collection.lore}
        onChange={(e) => setCollection({ ...collection, lore: e.target.value })}
        onBlur={() => save(collection)}
        placeholder="World history, factions, locations, timelines — anything the AI Game Master should know about this campaign's world."
        className="min-h-[60vh] w-full flex-1 resize-none rounded-lg border border-neutral-300 bg-white p-4 text-sm leading-relaxed dark:border-neutral-700 dark:bg-neutral-900"
      />
    </div>
  );
}
