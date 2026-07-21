'use client';

import { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import type { Collection, GameCharacter, Note } from '@/types/collection';
import { useSceneStore } from '@/lib/sceneStore';
import PanelFrame from '@/components/Canvas/PanelFrame';
import CharacterSheetFields from '@/components/CharacterSheetFields';

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

  if (!collection) {
    return (
      <PanelFrame title="Characters" defaultWidth={320}>
        <p className="text-xs text-neutral-400">Loading…</p>
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
    <PanelFrame title="Characters" defaultWidth={320}>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 text-xs">
          {(['all', 'pc', 'npc'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded px-1.5 py-0.5 ${
                filter === f
                  ? 'bg-neutral-700 text-white'
                  : 'border border-neutral-300 text-neutral-500 dark:border-neutral-700'
              }`}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        {status && <span className="text-xs text-neutral-400">{status}</span>}
      </div>

      <button
        type="button"
        onClick={addQuickCharacterToken}
        className="w-full rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        + Quick NPC
      </button>

      <div className="space-y-2">
        {filteredCharacters.map((c) => {
          const isOpen = expandedId === c.id;
          const characterNotes = notes.filter((n) => n.characterId === c.id);
          return (
            <div key={c.id} className="rounded-md border border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : c.id)}
                className="flex w-full items-center justify-between p-2 text-left text-xs"
              >
                <span>
                  <span className="font-medium text-neutral-700 dark:text-neutral-200">{c.name}</span>{' '}
                  <span className="text-neutral-400">
                    {c.kind.toUpperCase()} · HP {c.hp}/{c.maxHp} · AC {c.ac}
                  </span>
                </span>
                <span className="text-neutral-400">{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div className="space-y-3 border-t border-neutral-200 p-2 dark:border-neutral-700">
                  <CharacterSheetFields
                    character={c}
                    onChange={makeCharacterChange(c.id)}
                    onCommit={makeCharacterCommit(c.id)}
                  />
                  <div className="space-y-1.5 rounded-md border border-neutral-200 p-2 dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">Notes</p>
                      <button
                        type="button"
                        onClick={() => addNoteForCharacter(c.id)}
                        className="text-xs text-neutral-400 hover:underline"
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
                          className="w-full resize-none rounded border border-neutral-300 bg-transparent px-1.5 py-1 text-xs dark:border-neutral-700"
                        />
                        <button
                          type="button"
                          onClick={() => deleteNote(n.id)}
                          className="text-neutral-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {characterNotes.length === 0 && <p className="text-xs text-neutral-400">No notes yet.</p>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredCharacters.length === 0 && <p className="text-xs text-neutral-400">No characters yet.</p>}
      </div>
    </PanelFrame>
  );
}
