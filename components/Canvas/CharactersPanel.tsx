'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { nanoid } from 'nanoid';
import type { Collection, GameCharacter, Note } from '@/types/collection';
import { useSceneStore } from '@/lib/sceneStore';
import PanelFrame from '@/components/Canvas/PanelFrame';
import CharacterSheetFields from '@/components/CharacterSheetFields';
import { ArrowRight, ChevronDown, ChevronRight, X } from 'lucide-react';

interface CharactersPanelProps {
  collectionId: string;
}

export default function CharactersPanel({ collectionId }: CharactersPanelProps) {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [characters, setCharacters] = useState<GameCharacter[]>([]);
  const [filter, setFilter] = useState<'all' | 'pc' | 'npc'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const addQuickCharacterToken = useSceneStore((s) => s.addQuickCharacterToken);

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

  const persist = async (nextCharacters: GameCharacter[], nextNotes: Note[]) => {
    if (!collection) return;
    setStatus(null);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection, notes: nextNotes, characters: nextCharacters }),
      });
      if (!res.ok) throw new Error();
      setStatus('Saved');
    } catch {
      setStatus('Save failed');
    }
  };

  const manageLink = (
    <Link
      href={`/collections/${collectionId}`}
      className="flex items-center gap-0.5 text-xs text-foreground-muted hover:underline"
    >
      Manage <ArrowRight className="h-3 w-3" />
    </Link>
  );

  if (!collection) {
    return (
      <PanelFrame title="Characters" defaultWidth={320} actions={manageLink}>
        <p className="text-xs text-foreground-muted">Loading…</p>
      </PanelFrame>
    );
  }

  const makeCharacterChange = (characterId: string) => (patch: Partial<GameCharacter>) => {
    setCharacters((prev) => prev.map((c) => (c.id === characterId ? { ...c, ...patch } : c)));
  };

  const makeCharacterCommit = (characterId: string) => (patch?: Partial<GameCharacter>) => {
    const base = patch
      ? characters.map((c) => (c.id === characterId ? { ...c, ...patch } : c))
      : characters;
    setCharacters(base);
    persist(base, notes);
  };

  const addNoteForCharacter = (characterId: string) => {
    const note: Note = { id: nanoid(), title: 'Note', body: '', updatedAt: new Date().toISOString(), characterId };
    const next = [...notes, note];
    setNotes(next);
    persist(characters, next);
  };

  const updateNoteBody = (noteId: string, body: string) => {
    setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, body, updatedAt: new Date().toISOString() } : n)));
  };

  const commitNotes = () => persist(characters, notes);

  const deleteNote = (noteId: string) => {
    const next = notes.filter((n) => n.id !== noteId);
    setNotes(next);
    persist(characters, next);
  };

  const filteredCharacters = filter === 'all' ? characters : characters.filter((c) => c.kind === filter);

  return (
    <PanelFrame title="Characters" defaultWidth={320} actions={manageLink}>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 text-xs">
          {(['all', 'pc', 'npc'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded px-1.5 py-0.5 ${
                filter === f
                  ? 'bg-accent text-accent-foreground'
                  : 'border border-border text-foreground-muted'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        {status && <span className="text-xs text-foreground-muted">{status}</span>}
      </div>

      <button
        type="button"
        onClick={addQuickCharacterToken}
        title="Place a disposable NPC token directly on the canvas — not saved to the roster"
        className="w-full rounded-md border border-border px-2 py-1 text-xs text-foreground-muted hover:bg-surface-raised"
      >
        + Quick NPC
      </button>

      <div className="space-y-2">
        {filteredCharacters.map((c) => {
          const isOpen = expandedId === c.id;
          const characterNotes = notes.filter((n) => n.characterId === c.id);
          return (
            <div key={c.id} className="rounded-md border border-border">
              <button
                type="button"
                draggable
                onDragStart={(e) =>
                  e.dataTransfer.setData(
                    'application/json+character',
                    JSON.stringify({
                      id: c.id,
                      name: c.name,
                      kind: c.kind,
                      hp: c.hp,
                      maxHp: c.maxHp,
                      ac: c.ac,
                      avatarUrl: c.avatarUrl,
                    })
                  )
                }
                onClick={() => setExpandedId(isOpen ? null : c.id)}
                title="Click to expand, drag onto the canvas to place this character"
                className="flex w-full cursor-grab items-center gap-2 p-2 text-left text-xs active:cursor-grabbing"
              >
                <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full border-2 border-accent/50 bg-surface-raised ring-1 ring-border">
                  {c.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- dynamic user-uploaded data URL, not a static asset
                    <img src={c.avatarUrl} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-foreground-muted">
                      {c.name.slice(0, 2).toUpperCase() || '?'}
                    </span>
                  )}
                </span>
                <span className="flex-1">
                  <span className="font-medium text-foreground">{c.name}</span>{' '}
                  <span className="text-foreground-muted">
                    {c.kind.toUpperCase()} · HP {c.hp}/{c.maxHp} · AC {c.ac}
                  </span>
                </span>
                <span className="text-foreground-muted">
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              </button>
              {isOpen && (
                <div className="space-y-3 border-t border-border p-2">
                  <CharacterSheetFields
                    character={c}
                    onChange={makeCharacterChange(c.id)}
                    onCommit={makeCharacterCommit(c.id)}
                  />
                  <div className="space-y-1.5 rounded-md border border-border p-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Notes</p>
                      <button
                        type="button"
                        onClick={() => addNoteForCharacter(c.id)}
                        className="text-xs text-foreground-muted hover:underline"
                      >
                        + Note
                      </button>
                    </div>
                    {characterNotes.map((n) => (
                      <div key={n.id} className="flex items-start gap-1.5">
                        <textarea
                          value={n.body}
                          onChange={(e) => updateNoteBody(n.id, e.target.value)}
                          onBlur={commitNotes}
                          rows={2}
                          className="w-full resize-none rounded border border-border bg-transparent px-1.5 py-1 text-xs text-foreground"
                        />
                        <button
                          type="button"
                          onClick={() => deleteNote(n.id)}
                          className="text-foreground-muted hover:text-danger"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {characterNotes.length === 0 && <p className="text-xs text-foreground-muted">No notes yet.</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredCharacters.length === 0 && <p className="text-xs text-foreground-muted">No characters yet.</p>}
      </div>
    </PanelFrame>
  );
}
