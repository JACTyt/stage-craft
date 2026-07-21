import { NextRequest, NextResponse } from 'next/server';
import { isValidSceneId, listScenes, saveScene } from '@/lib/server/sceneStorage';
import type { RegistryEntry, Scene } from '@/types/scene';

/** Lists saved scenes (id, name, savedAt), optionally filtered by ?collectionId=. */
export async function GET(request: NextRequest) {
  const collectionId = request.nextUrl.searchParams.get('collectionId') ?? undefined;
  const scenes = await listScenes(collectionId);
  return NextResponse.json({ scenes });
}

/** Saves (creates or overwrites) a scene as data/scenes/{scene.id}.json. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const scene = body?.scene as Scene | undefined;
  const customEntries = (body?.customEntries as RegistryEntry[] | undefined) ?? [];

  if (!scene?.id || !scene?.name) {
    return NextResponse.json({ error: 'Request must include a scene with id and name' }, { status: 400 });
  }
  if (!isValidSceneId(scene.id)) {
    return NextResponse.json({ error: 'Scene id must be alphanumeric (with - or _), max 64 chars' }, { status: 400 });
  }

  const payload = await saveScene(scene, customEntries);
  return NextResponse.json(payload);
}
