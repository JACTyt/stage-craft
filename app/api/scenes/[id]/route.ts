import { NextResponse } from 'next/server';
import { isValidSceneId, loadScene, markScenePlayed } from '@/lib/server/sceneStorage';

/** Loads one saved scene by id from data/scenes/{id}.json. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidSceneId(id)) {
    return NextResponse.json({ error: 'Invalid scene id' }, { status: 400 });
  }
  const payload = await loadScene(id);
  if (!payload) {
    return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
  }
  return NextResponse.json(payload);
}

/** Marks a scene as played now, without touching its saved content. */
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidSceneId(id)) {
    return NextResponse.json({ error: 'Invalid scene id' }, { status: 400 });
  }
  const payload = await markScenePlayed(id);
  if (!payload) {
    return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
  }
  return NextResponse.json(payload);
}
