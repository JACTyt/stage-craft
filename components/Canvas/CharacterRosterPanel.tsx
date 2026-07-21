'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { GameCharacter } from '@/types/collection';
import PanelFrame from '@/components/Canvas/PanelFrame';

interface CharacterRosterPanelProps {
  collectionId: string;
}

export default function CharacterRosterPanel({ collectionId }: CharacterRosterPanelProps) {
  const [characters, setCharacters] = useState<GameCharacter[]>([]);

  useEffect(() => {
    fetch(`/api/collections/${collectionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        setCharacters(data.characters ?? []);
      })
      .catch(() => {});
  }, [collectionId]);

  return (
    <PanelFrame
      title="Roster"
      actions={
        <Link
          href={`/collections/${collectionId}`}
          className="text-xs text-neutral-400 hover:underline"
        >
          Manage →
        </Link>
      }
    >
      {characters.length === 0 && (
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          No characters yet — add some from the campaign hub.
        </p>
      )}

      <div className="space-y-1.5">
        {characters.map((c) => (
          <div
            key={c.id}
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
                })
              )
            }
            title="Drag onto the canvas to place this character"
            className="cursor-grab rounded-md border border-neutral-200 px-2 py-1.5 text-xs active:cursor-grabbing dark:border-neutral-700"
          >
            <p className="font-medium text-neutral-700 dark:text-neutral-200">{c.name}</p>
            <p className="text-neutral-400">
              {c.kind.toUpperCase()} · HP {c.hp}/{c.maxHp} · AC {c.ac}
            </p>
          </div>
        ))}
      </div>
    </PanelFrame>
  );
}
