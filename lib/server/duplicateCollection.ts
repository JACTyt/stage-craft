import { nanoid } from 'nanoid';
import type { Collection, GameCharacter, Note } from '@/types/collection';
import { loadCollection, saveCollection, type SavedCollectionPayload } from '@/lib/server/collectionStorage';
import { duplicateScene, listScenes } from '@/lib/server/sceneStorage';

/**
 * Duplicates a full campaign: the collection itself, its notes and characters (all under new
 * ids), and every scene linked to it via collectionId (also under new ids, moved to the new
 * collection, with each scene's token characterId links remapped to the copied roster).
 */
export async function duplicateCollection(id: string): Promise<SavedCollectionPayload | null> {
  const existing = await loadCollection(id);
  if (!existing) return null;

  const newCollectionId = nanoid();

  const characterIdMap: Record<string, string> = {};
  const characters: GameCharacter[] = existing.characters.map((c) => {
    const newId = nanoid();
    characterIdMap[c.id] = newId;
    return { ...c, id: newId };
  });

  const notes: Note[] = existing.notes.map((n) => ({ ...n, id: nanoid() }));

  const collection: Collection = {
    ...existing.collection,
    id: newCollectionId,
    name: `${existing.collection.name} (Copy)`,
  };

  const saved = await saveCollection(collection, notes, characters);

  const scenes = await listScenes(id);
  await Promise.all(
    scenes.map((s) =>
      duplicateScene(s.id, {
        collectionId: newCollectionId,
        renameWithCopySuffix: false,
        characterIdMap,
      })
    )
  );

  return saved;
}
