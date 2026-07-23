'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Collection, GameCharacter, Note } from '@/types/collection';
import CharacterSheetFields from '@/components/CharacterSheetFields';
import Button from '@/components/ui/Button';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { ArrowLeft } from 'lucide-react';

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

  if (error) return <div className="p-8 text-danger">{error}</div>;
  if (!collection || !character) return <div className="p-8 text-foreground-muted">Loading…</div>;

  return (
    <div className="mx-auto flex w-full min-h-screen max-w-4xl flex-col gap-6 bg-background p-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-accent/50 bg-surface-raised ring-1 ring-border">
            {character.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- dynamic user-uploaded data URL, not a static asset
              <img src={character.avatarUrl} alt={character.name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-foreground-muted">
                {character.name.slice(0, 2).toUpperCase() || '?'}
              </span>
            )}
          </span>
          <div>
            <Link href={`/collections/${collectionId}`} className="flex items-center gap-0.5 text-xs text-foreground-muted hover:underline">
              <ArrowLeft className="h-3 w-3" /> {collection.name}
            </Link>
            <input
              value={character.name}
              onChange={(e) => update({ name: e.target.value })}
              onBlur={save}
              className="block rounded border border-transparent bg-transparent px-1 font-display text-2xl font-extrabold uppercase tracking-wide text-foreground hover:border-border focus:border-accent focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status && <span className="text-xs text-foreground-muted">{status}</span>}
          <Button variant="secondary" onClick={save}>
            Save
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <CharacterSheetFields character={character} onChange={update} onCommit={handleCommit} />
    </div>
  );
}
