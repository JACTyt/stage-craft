'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import Link from 'next/link';
import { Copy, Settings } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';

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

  const lastEditedId = collections.length
    ? [...collections].sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0].id
    : undefined;

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

  const handleDuplicate = async (id: string, event: MouseEvent) => {
    event.stopPropagation();
    const res = await fetch(`/api/collections/${id}/duplicate`, { method: 'POST' });
    if (!res.ok) {
      setError('Could not duplicate the campaign.');
      return;
    }
    const data = await res.json();
    router.push(`/collections/${data.collection.id}`);
  };

  return (
    <div className="mx-auto flex w-full min-h-screen max-w-3xl flex-col gap-6 bg-background p-8">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-foreground">
          StageCraft
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setIsCreating((v) => !v)}>
            + New Collection
          </Button>
          <Link
            href="/settings"
            title="Settings"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted hover:bg-surface-raised"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {error && <p className="text-sm text-danger">{error}</p>}

      {isCreating && (
        <div className="space-y-2 rounded-lg border border-border bg-surface p-4">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Campaign name"
            className="w-full"
          />
          <TextArea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Short description (optional)"
            rows={2}
            className="w-full"
          />
          <Button variant="primary" onClick={handleCreate} disabled={!newName.trim()}>
            Create
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {collections.map((c) => {
          const isLastEdited = c.id === lastEditedId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => router.push(`/collections/${c.id}`)}
              className={`rounded-lg border p-4 text-left shadow-sm hover:border-accent ${
                isLastEdited ? 'border-accent bg-surface-raised' : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display font-semibold uppercase tracking-wide text-foreground">{c.name}</h2>
                <div className="flex shrink-0 items-center gap-1.5">
                  {isLastEdited && (
                    <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                      Last edited
                    </span>
                  )}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleDuplicate(c.id, e)}
                    title="Duplicate campaign"
                    className="rounded p-1 text-foreground-muted hover:bg-surface-raised hover:text-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
              {c.description && (
                <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">
                  {c.description}
                </p>
              )}
              <p className="mt-2 text-xs text-foreground-muted">
                {new Date(c.savedAt).toLocaleString()}
              </p>
            </button>
          );
        })}
        {collections.length === 0 && !isCreating && (
          <p className="text-sm text-foreground-muted">
            No campaigns yet — create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
