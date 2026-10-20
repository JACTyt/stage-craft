import { mkdir, readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import type { ElementInstance, RegistryEntry, Scene } from '@/types/scene';
import { isValidId } from '@/lib/server/idValidation';

const SCENES_DIR = path.join(process.cwd(), 'data', 'scenes');

export interface SavedScenePayload {
  scene: Scene;
  customEntries: RegistryEntry[];
  savedAt: string;
  lastPlayedAt?: string;
}

export interface SavedSceneSummary {
  id: string;
  name: string;
  collectionId?: string;
  savedAt: string;
  lastPlayedAt?: string;
}

export const isValidSceneId = isValidId;

function fileFor(id: string): string {
  if (!isValidId(id)) {
    throw new Error('Invalid scene id');
  }
  const resolved = path.resolve(SCENES_DIR, `${id}.json`);
  if (path.dirname(resolved) !== path.resolve(SCENES_DIR)) {
    throw new Error('Invalid scene id');
  }
  return resolved;
}

export async function saveScene(scene: Scene, customEntries: RegistryEntry[]): Promise<SavedScenePayload> {
  await mkdir(SCENES_DIR, { recursive: true });
  const payload: SavedScenePayload = { scene, customEntries, savedAt: new Date().toISOString() };
  await writeFile(fileFor(scene.id), JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export interface DuplicateSceneOptions {
  /** Overrides the scene's collectionId in the copy. Defaults to the source scene's collectionId. */
  collectionId?: string;
  /** Appends " (Copy)" to the scene name. Defaults to true. */
  renameWithCopySuffix?: boolean;
  /** Remaps token characterId references (old id -> new id) when the roster itself was duplicated too. */
  characterIdMap?: Record<string, string>;
}

/** Loads a scene and saves it back under a new id, optionally moved to a different collection and with its tokens' characterId links remapped. */
export async function duplicateScene(
  id: string,
  options: DuplicateSceneOptions = {}
): Promise<SavedScenePayload | null> {
  const existing = await loadScene(id);
  if (!existing) return null;

  const { collectionId, renameWithCopySuffix = true, characterIdMap } = options;

  const elements: ElementInstance[] = existing.scene.elements.map((el) => {
    if (!el.characterId) return { ...el, id: nanoid() };
    const mappedCharacterId = characterIdMap ? characterIdMap[el.characterId] : el.characterId;
    if (!mappedCharacterId) {
      const clone: ElementInstance = { ...el, id: nanoid() };
      delete clone.characterId;
      return clone;
    }
    return { ...el, id: nanoid(), characterId: mappedCharacterId };
  });

  const scene: Scene = {
    ...existing.scene,
    id: nanoid(),
    name: renameWithCopySuffix ? `${existing.scene.name} (Copy)` : existing.scene.name,
    collectionId: collectionId ?? existing.scene.collectionId,
    elements,
  };

  return saveScene(scene, existing.customEntries);
}

export async function markScenePlayed(id: string): Promise<SavedScenePayload | null> {
  const existing = await loadScene(id);
  if (!existing) return null;
  const payload: SavedScenePayload = { ...existing, lastPlayedAt: new Date().toISOString() };
  await writeFile(fileFor(id), JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export async function loadScene(id: string): Promise<SavedScenePayload | null> {
  try {
    const raw = await readFile(fileFor(id), 'utf8');
    return JSON.parse(raw) as SavedScenePayload;
  } catch {
    return null;
  }
}

export async function listScenes(collectionId?: string): Promise<SavedSceneSummary[]> {
  let files: string[] = [];
  try {
    files = (await readdir(SCENES_DIR)).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }

  const summaries = await Promise.all(
    files.map(async (file): Promise<SavedSceneSummary | null> => {
      try {
        const raw = await readFile(path.join(SCENES_DIR, file), 'utf8');
        const payload = JSON.parse(raw) as SavedScenePayload;
        return {
          id: payload.scene.id,
          name: payload.scene.name,
          collectionId: payload.scene.collectionId,
          savedAt: payload.savedAt,
          lastPlayedAt: payload.lastPlayedAt,
        };
      } catch {
        return null;
      }
    })
  );

  return summaries
    .filter((s): s is SavedSceneSummary => s !== null)
    .filter((s) => !collectionId || s.collectionId === collectionId)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}
