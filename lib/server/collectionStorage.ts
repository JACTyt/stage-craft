import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import type { Collection, GameCharacter, Note } from '@/types/collection';
import { isValidId } from '@/lib/server/idValidation';

const COLLECTIONS_DIR = path.join(process.cwd(), 'data', 'collections');

export interface SavedCollectionPayload {
  collection: Collection;
  notes: Note[];
  characters: GameCharacter[];
  savedAt: string;
}

export interface SavedCollectionSummary {
  id: string;
  name: string;
  description: string;
  savedAt: string;
}

function fileFor(id: string): string {
  if (!isValidId(id)) {
    throw new Error('Invalid collection id');
  }
  const resolved = path.resolve(COLLECTIONS_DIR, `${id}.json`);
  if (path.dirname(resolved) !== path.resolve(COLLECTIONS_DIR)) {
    throw new Error('Invalid collection id');
  }
  return resolved;
}

export async function saveCollection(
  collection: Collection,
  notes: Note[],
  characters: GameCharacter[]
): Promise<SavedCollectionPayload> {
  await mkdir(COLLECTIONS_DIR, { recursive: true });
  const payload: SavedCollectionPayload = {
    collection,
    notes,
    characters,
    savedAt: new Date().toISOString(),
  };
  await writeFile(fileFor(collection.id), JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export async function loadCollection(id: string): Promise<SavedCollectionPayload | null> {
  try {
    const raw = await readFile(fileFor(id), 'utf8');
    return JSON.parse(raw) as SavedCollectionPayload;
  } catch {
    return null;
  }
}

export async function listCollections(): Promise<SavedCollectionSummary[]> {
  let files: string[] = [];
  try {
    files = (await readdir(COLLECTIONS_DIR)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }

  const summaries = await Promise.all(
    files.map(async (file) => {
      try {
        const raw = await readFile(path.join(COLLECTIONS_DIR, file), 'utf8');
        const payload = JSON.parse(raw) as SavedCollectionPayload;
        return {
          id: payload.collection.id,
          name: payload.collection.name,
          description: payload.collection.description,
          savedAt: payload.savedAt,
        };
      } catch {
        return null;
      }
    })
  );

  return summaries
    .filter((s): s is SavedCollectionSummary => s !== null)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}
