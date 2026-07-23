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
        <p className="text-xs text-foreground-muted">Loading…</p>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Rules" defaultWidth={288}>
      {status && <span className="text-xs text-foreground-muted">{status}</span>}
      <div className="space-y-2">
        {SRD_QUICK_REFERENCE.map((rule) => (
          <div key={rule.title} className="rounded-md border border-border p-2">
            <p className="text-xs font-medium text-foreground">{rule.title}</p>
            <p className="mt-0.5 text-xs text-foreground-muted">{rule.body}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1 border-t border-border pt-2">
        <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">House rules</p>
        <textarea
          value={collection.houseRules}
          onChange={(e) => setCollection({ ...collection, houseRules: e.target.value })}
          onBlur={() => persist(collection)}
          rows={4}
          placeholder="Campaign-specific house rules"
          className="w-full resize-none rounded border border-border bg-transparent p-2 text-xs text-foreground"
        />
      </div>
    </PanelFrame>
  );
}
