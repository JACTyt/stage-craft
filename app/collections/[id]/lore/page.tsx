'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Collection, GameCharacter, Note } from '@/types/collection';
import Button from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { ArrowLeft } from 'lucide-react';

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

  if (error) return <div className="p-8 text-danger">{error}</div>;
  if (!collection) return <div className="p-8 text-foreground-muted">Loading…</div>;

  return (
    <div className="mx-auto flex w-full min-h-screen max-w-7xl flex-col gap-4 bg-background p-8">
      <header className="flex items-center justify-between">
        <div>
          <Link href={`/collections/${collectionId}`} className="flex items-center gap-0.5 text-xs text-foreground-muted hover:underline">
            <ArrowLeft className="h-3 w-3" /> {collection.name}
          </Link>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">Lore</h1>
        </div>
        <div className="flex items-center gap-2">
          {status && <span className="text-xs text-foreground-muted">{status}</span>}
          <Button variant="secondary" onClick={() => save(collection)}>
            Save
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <TextArea
        value={collection.lore}
        onChange={(e) => setCollection({ ...collection, lore: e.target.value })}
        onBlur={() => save(collection)}
        placeholder="World history, factions, locations, timelines — anything the AI Game Master should know about this campaign's world."
        className="min-h-[60vh] w-full flex-1 rounded-lg bg-surface p-4 leading-relaxed"
      />
    </div>
  );
}
