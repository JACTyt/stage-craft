'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import type { Collection, GameCharacter, Note } from '@/types/collection';
import { createDefaultScene } from '@/lib/sceneStore';
import { createBlankCharacter } from '@/lib/dnd5e';

interface SceneSummary {
  id: string;
  name: string;
  savedAt: string;
  lastPlayedAt?: string;
}

export default function CollectionHubPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const collectionId = params.id;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [characters, setCharacters] = useState<GameCharacter[]>([]);
  const [scenes, setScenes] = useState<SceneSummary[]>([]);
  const mostRecentlyPlayed = scenes
    .filter((s): s is SceneSummary & { lastPlayedAt: string } => Boolean(s.lastPlayedAt))
    .sort((a, b) => b.lastPlayedAt.localeCompare(a.lastPlayedAt))[0];
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

    fetch(`/api/scenes?collectionId=${collectionId}`)
      .then((res) => res.json())
      .then((data) => setScenes(data.scenes ?? []))
      .catch(() => {});
  }, [collectionId]);

  const persist = async (nextCollection: Collection, nextNotes: Note[], nextCharacters: GameCharacter[]) => {
    setStatus(null);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: nextCollection, notes: nextNotes, characters: nextCharacters }),
      });
      if (!res.ok) throw new Error();
      setStatus('Saved');
    } catch {
      setStatus('Save failed');
    }
  };

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  if (!collection) {
    return <div className="p-8 text-neutral-400">Loading…</div>;
  }

  const handleNewScene = async () => {
    const scene = createDefaultScene(collectionId);
    const res = await fetch('/api/scenes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene, customEntries: [] }),
    });
    if (!res.ok) {
      setError('Could not create a new scene.');
      return;
    }
    router.push(`/editor?scene=${scene.id}`);
  };

  const addNote = () => {
    const note: Note = { id: nanoid(), title: 'New note', body: '', updatedAt: new Date().toISOString() };
    const next = [...notes, note];
    setNotes(next);
    persist(collection, next, characters);
  };

  const updateNote = (id: string, patch: Partial<Note>) => {
    const next = notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n));
    setNotes(next);
  };

  const deleteNote = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    persist(collection, next, characters);
  };

  const addCharacter = async () => {
    const character = createBlankCharacter(nanoid());
    const next = [...characters, character];
    setCharacters(next);
    await persist(collection, notes, next);
    router.push(`/collections/${collectionId}/characters/${character.id}`);
  };

  const deleteCharacter = (id: string) => {
    const next = characters.filter((c) => c.id !== id);
    setCharacters(next);
    persist(collection, notes, next);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 bg-neutral-100 p-8 dark:bg-neutral-950">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-xs text-neutral-400 hover:underline">
            ← All campaigns
          </Link>
          <input
            value={collection.name}
            onChange={(e) => setCollection({ ...collection, name: e.target.value })}
            onBlur={() => persist(collection, notes, characters)}
            className="block rounded border border-transparent bg-transparent px-1 text-2xl font-semibold text-neutral-800 hover:border-neutral-300 focus:border-blue-400 focus:outline-none dark:text-neutral-100"
          />
        </div>
        <div className="flex items-center gap-2">
          {status && <span className="text-xs text-neutral-400">{status}</span>}
          <button
            type="button"
            onClick={() => persist(collection, notes, characters)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Save
          </button>
          <Link
            href={`/collections/${collectionId}/lore`}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Lore →
          </Link>
        </div>
      </header>

      <textarea
        value={collection.description}
        onChange={(e) => setCollection({ ...collection, description: e.target.value })}
        onBlur={() => persist(collection, notes, characters)}
        placeholder="Campaign description"
        rows={2}
        className="w-full resize-none rounded-lg border border-neutral-300 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />

      {mostRecentlyPlayed && (
        <div className="flex items-center justify-between rounded-lg border border-blue-300 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
              Continue where you left off
            </p>
            <p className="text-sm text-neutral-700 dark:text-neutral-200">
              {mostRecentlyPlayed.name} · last played{' '}
              {new Date(mostRecentlyPlayed.lastPlayedAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/editor?scene=${mostRecentlyPlayed.id}`)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Continue →
          </button>
        </div>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Scenes</h2>
          <button
            type="button"
            onClick={handleNewScene}
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            + New Scene
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {scenes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => router.push(`/editor?scene=${s.id}`)}
              className="rounded-lg border border-neutral-300 bg-white p-3 text-left hover:border-blue-400 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{s.name}</p>
              <p className="text-xs text-neutral-400">{new Date(s.savedAt).toLocaleDateString()}</p>
            </button>
          ))}
          {scenes.length === 0 && (
            <p className="col-span-full text-sm text-neutral-400">No scenes yet.</p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Characters
          </h2>
          <button
            type="button"
            onClick={addCharacter}
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            + New Character
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {characters.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-neutral-300 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <Link href={`/collections/${collectionId}/characters/${c.id}`} className="flex-1">
                <p className="font-medium text-neutral-800 dark:text-neutral-100">{c.name}</p>
                <p className="text-xs text-neutral-400">
                  {c.kind.toUpperCase()}
                  {c.race || c.className ? ` · ${[c.race, c.className].filter(Boolean).join(' ')}` : ''}
                  {c.level ? ` (Lvl ${c.level})` : ''} · HP {c.hp}/{c.maxHp} · AC {c.ac}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => deleteCharacter(c.id)}
                className="ml-2 text-neutral-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          {characters.length === 0 && <p className="text-sm text-neutral-400">No characters yet.</p>}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Notes</h2>
          <button
            type="button"
            onClick={addNote}
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            + New Note
          </button>
        </div>
        <div className="space-y-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className="space-y-1 rounded-lg border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <div className="flex items-center justify-between">
                <input
                  value={n.title}
                  onChange={(e) => updateNote(n.id, { title: e.target.value })}
                  onBlur={() => persist(collection, notes, characters)}
                  className="flex-1 rounded border border-neutral-300 bg-transparent px-1.5 py-0.5 text-sm font-medium dark:border-neutral-700"
                />
                <button
                  type="button"
                  onClick={() => deleteNote(n.id)}
                  className="ml-2 text-neutral-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
              <textarea
                value={n.body}
                onChange={(e) => updateNote(n.id, { body: e.target.value })}
                onBlur={() => persist(collection, notes, characters)}
                rows={2}
                className="w-full resize-none rounded border border-neutral-300 bg-transparent px-1.5 py-1 text-sm dark:border-neutral-700"
              />
            </div>
          ))}
          {notes.length === 0 && <p className="text-sm text-neutral-400">No notes yet.</p>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          Session Memory
        </h2>
        <textarea
          value={collection.sessionMemory}
          onChange={(e) => setCollection({ ...collection, sessionMemory: e.target.value })}
          onBlur={() => persist(collection, notes, characters)}
          placeholder="What happened last session, ongoing plot threads, etc. Fed to the AI Game Master as context."
          rows={4}
          className="w-full resize-none rounded-lg border border-neutral-300 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </section>
    </div>
  );
}
