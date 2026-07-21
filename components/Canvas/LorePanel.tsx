'use client';

import { useEffect, useState } from 'react';
import type { Collection, GameCharacter, Note } from '@/types/collection';
import PanelFrame from '@/components/Canvas/PanelFrame';

interface LorePanelProps {
  collectionId: string;
}

export default function LorePanel({ collectionId }: LorePanelProps) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [characters, setCharacters] = useState<GameCharacter[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/collections/${collectionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        setCollection(data.collection);
        setNotes(data.notes ?? []);
        setCharacters(data.characters ?? []);
      })
      .catch(() => {});
  }, [collectionId]);

  const persist = async (nextCollection: Collection) => {
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

  if (!collection) {
    return (
      <PanelFrame title="Lore" defaultWidth={288}>
        <p className="text-xs text-neutral-400">Loading…</p>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Lore" defaultWidth={288}>
      {status && <span className="text-xs text-neutral-400">{status}</span>}
      <textarea
        value={collection.lore}
        onChange={(e) => setCollection({ ...collection, lore: e.target.value })}
        onBlur={() => persist(collection)}
        rows={14}
        className="w-full flex-1 resize-none rounded border border-neutral-300 bg-transparent p-2 text-xs dark:border-neutral-700"
      />
    </PanelFrame>
  );
}
