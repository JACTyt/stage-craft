'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import type { Collection, GameCharacter, Note } from '@/types/collection';
import { createDefaultScene } from '@/lib/sceneStore';
import { createBlankCharacter } from '@/lib/dnd5e';
import Button from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

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
  const mostRecentlyEditedId = scenes.length
    ? [...scenes].sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0].id
    : undefined;
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
    return <div className="p-8 text-danger">{error}</div>;
  }

  if (!collection) {
    return <div className="p-8 text-foreground-muted">Loading…</div>;
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
    <div className="mx-auto flex w-full min-h-screen max-w-4xl flex-col gap-6 bg-background p-8">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/" className="flex items-center gap-0.5 text-xs text-foreground-muted hover:underline">
            <ArrowLeft className="h-3 w-3" /> All campaigns
          </Link>
          <input
            value={collection.name}
            onChange={(e) => setCollection({ ...collection, name: e.target.value })}
            onBlur={() => persist(collection, notes, characters)}
            className="block rounded border border-transparent bg-transparent px-1 font-display text-2xl font-extrabold uppercase tracking-wide text-foreground hover:border-border focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          {status && <span className="text-xs text-foreground-muted">{status}</span>}
          <Button variant="secondary" onClick={() => persist(collection, notes, characters)}>
            Save
          </Button>
          <Link
            href={`/collections/${collectionId}/lore`}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-foreground-muted hover:bg-surface-raised"
          >
            Lore <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <TextArea
        value={collection.description}
        onChange={(e) => setCollection({ ...collection, description: e.target.value })}
        onBlur={() => persist(collection, notes, characters)}
        placeholder="Campaign description"
        rows={2}
        className="w-full rounded-lg bg-surface p-3"
      />

      {mostRecentlyPlayed && (
        <div className="flex items-center justify-between rounded-lg border border-accent bg-surface-raised p-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              Continue where you left off
            </p>
            <p className="text-sm text-foreground">
              {mostRecentlyPlayed.name} · last played{' '}
              {new Date(mostRecentlyPlayed.lastPlayedAt).toLocaleString()}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push(`/editor?scene=${mostRecentlyPlayed.id}`)}
            className="flex items-center gap-1"
          >
            Continue <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground-muted">Scenes</h2>
          <Button variant="secondary" onClick={handleNewScene} className="text-xs">
            + New Scene
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {scenes.map((s) => {
            const isLastPlayed = s.id === mostRecentlyPlayed?.id;
            const isLastEdited = s.id === mostRecentlyEditedId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => router.push(`/editor?scene=${s.id}`)}
                className={`rounded-lg border p-3 text-left shadow-sm hover:border-accent ${
                  isLastPlayed ? 'border-accent bg-surface-raised' : 'border-border bg-surface'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-foreground-muted">{new Date(s.savedAt).toLocaleDateString()}</p>
                {(isLastPlayed || isLastEdited) && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {isLastPlayed && (
                      <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                        Last played
                      </span>
                    )}
                    {isLastEdited && (
                      <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-foreground-muted">
                        Last edited
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
          {scenes.length === 0 && (
            <p className="col-span-full text-sm text-foreground-muted">No scenes yet.</p>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground-muted">
            Characters
          </h2>
          <Button variant="secondary" onClick={addCharacter} className="text-xs">
            + New Character
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {characters.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 text-sm shadow-sm"
            >
              <Link href={`/collections/${collectionId}/characters/${c.id}`} className="flex flex-1 items-center gap-2.5">
                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-accent/50 bg-surface-raised ring-1 ring-border">
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- dynamic user-uploaded data URL, not a static asset
                    <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground-muted">
                      {c.name.slice(0, 2).toUpperCase() || '?'}
                    </span>
                  )}
                </span>
                <div>
                  <p className="font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-foreground-muted">
                    {c.kind.toUpperCase()}
                    {c.race || c.className ? ` · ${[c.race, c.className].filter(Boolean).join(' ')}` : ''}
                    {c.level ? ` (Lvl ${c.level})` : ''} · HP {c.hp}/{c.maxHp} · AC {c.ac}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => deleteCharacter(c.id)}
                className="ml-2 text-foreground-muted hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {characters.length === 0 && <p className="text-sm text-foreground-muted">No characters yet.</p>}
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground-muted">Notes</h2>
          <Button variant="secondary" onClick={addNote} className="text-xs">
            + New Note
          </Button>
        </div>
        <div className="space-y-2">
          {notes.map((n) => (
            <div
              key={n.id}
              className="space-y-1 rounded-lg border border-border bg-surface p-2"
            >
              <div className="flex items-center justify-between">
                <input
                  value={n.title}
                  onChange={(e) => updateNote(n.id, { title: e.target.value })}
                  onBlur={() => persist(collection, notes, characters)}
                  className="flex-1 rounded border border-border bg-transparent px-1.5 py-0.5 text-sm font-medium text-foreground"
                />
                <button
                  type="button"
                  onClick={() => deleteNote(n.id)}
                  className="ml-2 text-foreground-muted hover:text-danger"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <TextArea
                value={n.body}
                onChange={(e) => updateNote(n.id, { body: e.target.value })}
                onBlur={() => persist(collection, notes, characters)}
                rows={2}
                className="w-full text-sm"
              />
            </div>
          ))}
          {notes.length === 0 && <p className="text-sm text-foreground-muted">No notes yet.</p>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          Session Memory
        </h2>
        <TextArea
          value={collection.sessionMemory}
          onChange={(e) => setCollection({ ...collection, sessionMemory: e.target.value })}
          onBlur={() => persist(collection, notes, characters)}
          placeholder="What happened last session, ongoing plot threads, etc. Fed to the AI Game Master as context."
          rows={4}
          className="w-full rounded-lg bg-surface p-3"
        />
      </section>
    </div>
  );
}
