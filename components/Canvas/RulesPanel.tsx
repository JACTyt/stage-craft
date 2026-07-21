'use client';

import { useEffect, useState } from 'react';
import type { Collection, GameCharacter, Note } from '@/types/collection';
import { SRD_QUICK_REFERENCE } from '@/lib/rulesReference';
import PanelFrame from '@/components/Canvas/PanelFrame';

interface RulesPanelProps {
  collectionId: string;
}

export default function RulesPanel({ collectionId }: RulesPanelProps) {
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
      <PanelFrame title="Rules" defaultWidth={288}>
        <p className="text-xs text-neutral-400">Loading…</p>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Rules" defaultWidth={288}>
      {status && <span className="text-xs text-neutral-400">{status}</span>}
      <div className="space-y-2">
        {SRD_QUICK_REFERENCE.map((rule) => (
          <div key={rule.title} className="rounded-md border border-neutral-200 p-2 dark:border-neutral-700">
            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200">{rule.title}</p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{rule.body}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1 border-t border-neutral-200 pt-2 dark:border-neutral-700">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">House rules</p>
        <textarea
          value={collection.houseRules}
          onChange={(e) => setCollection({ ...collection, houseRules: e.target.value })}
          onBlur={() => persist(collection)}
          rows={4}
          placeholder="Campaign-specific house rules"
          className="w-full resize-none rounded border border-neutral-300 bg-transparent p-2 text-xs dark:border-neutral-700"
        />
      </div>
    </PanelFrame>
  );
}
