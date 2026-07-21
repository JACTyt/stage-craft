'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Collection, GameCharacter, Note } from '@/types/collection';
import CharacterSheetFields from '@/components/CharacterSheetFields';

export default function CharacterSheetPage() {
  const params = useParams<{ id: string; characterId: string }>();
  const collectionId = params.id;
  const characterId = params.characterId;

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

  const character = characters.find((c) => c.id === characterId);

  const persist = async (nextCharacters: GameCharacter[]) => {
    if (!collection) return;
    setStatus(null);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection, notes, characters: nextCharacters }),
      });
      if (!res.ok) throw new Error();
      setStatus('Saved');
    } catch {
      setStatus('Save failed');
    }
  };

  const update = (patch: Partial<GameCharacter>) => {
    if (!character) return;
    setCharacters(characters.map((c) => (c.id === character.id ? { ...c, ...patch } : c)));
  };

  const save = () => persist(characters);

  const handleCommit = (patch?: Partial<GameCharacter>) => {
    if (!character) return;
    if (patch) {
      const next = characters.map((c) => (c.id === character.id ? { ...c, ...patch } : c));
      setCharacters(next);
      persist(next);
    } else {
      save();
    }
  };

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!collection || !character) return <div className="p-8 text-neutral-400">Loading…</div>;

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-neutral-100 p-8 dark:bg-neutral-950">
      <header className="flex items-center justify-between">
        <div>
          <Link href={`/collections/${collectionId}`} className="text-xs text-neutral-400 hover:underline">
            ← {collection.name}
          </Link>
          <input
            value={character.name}
            onChange={(e) => update({ name: e.target.value })}
            onBlur={save}
            className="block rounded border border-transparent bg-transparent px-1 text-2xl font-semibold text-neutral-800 hover:border-neutral-300 focus:border-blue-400 focus:outline-none dark:text-neutral-100"
          />
        </div>
        <div className="flex items-center gap-2">
          {status && <span className="text-xs text-neutral-400">{status}</span>}
          <button
            type="button"
            onClick={save}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Save
          </button>
        </div>
      </header>

      <CharacterSheetFields character={character} onChange={update} onCommit={handleCommit} />
    </div>
  );
}
