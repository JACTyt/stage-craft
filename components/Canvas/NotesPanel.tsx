'use client';

import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import type { Collection, GameCharacter, Note } from '@/types/collection';
import PanelFrame from '@/components/Canvas/PanelFrame';
import { X } from 'lucide-react';

interface NotesPanelProps {
  collectionId: string;
}

export default function NotesPanel({ collectionId }: NotesPanelProps) {
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

  const persist = async (nextNotes: Note[]) => {
    if (!collection) return;
    setStatus(null);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection, notes: nextNotes, characters }),
      });
      if (!res.ok) throw new Error();
      setStatus('Saved');
    } catch {
      setStatus('Save failed');
    }
  };

  if (!collection) {
    return (
      <PanelFrame title="Notes" defaultWidth={288}>
        <p className="text-xs text-foreground-muted">Loading…</p>
      </PanelFrame>
    );
  }

  const addNote = () => {
    const note: Note = { id: nanoid(), title: 'New note', body: '', updatedAt: new Date().toISOString() };
    const next = [...notes, note];
    setNotes(next);
    persist(next);
  };

  const updateNote = (id: string, patch: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n)));
  };

  const deleteNote = (id: string) => {
    const next = notes.filter((n) => n.id !== id);
    setNotes(next);
    persist(next);
  };

  const characterName = (characterId?: string) => characters.find((c) => c.id === characterId)?.name;

  return (
    <PanelFrame
      title="Notes"
      defaultWidth={288}
      actions={
        <button type="button" onClick={addNote} className="text-xs text-foreground-muted hover:underline">
          + Note
        </button>
      }
    >
      {status && <span className="text-xs text-foreground-muted">{status}</span>}
      <div className="space-y-2">
        {notes.map((n) => (
          <div key={n.id} className="space-y-1 rounded-md border border-border p-2">
            <div className="flex items-center justify-between gap-2">
              <input
                value={n.title}
                onChange={(e) => updateNote(n.id, { title: e.target.value })}
                onBlur={() => persist(notes)}
                className="flex-1 rounded border border-border bg-transparent px-1.5 py-0.5 text-xs font-medium text-foreground"
              />
              <button type="button" onClick={() => deleteNote(n.id)} className="text-foreground-muted hover:text-danger">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            {n.characterId && (
              <p className="text-[11px] text-foreground-muted">Linked: {characterName(n.characterId) ?? 'Unknown character'}</p>
            )}
            <textarea
              value={n.body}
              onChange={(e) => updateNote(n.id, { body: e.target.value })}
              onBlur={() => persist(notes)}
              rows={2}
              className="w-full resize-none rounded border border-border bg-transparent px-1.5 py-1 text-xs text-foreground"
            />
          </div>
        ))}
        {notes.length === 0 && <p className="text-xs text-foreground-muted">No notes yet.</p>}
      </div>
    </PanelFrame>
  );
}
