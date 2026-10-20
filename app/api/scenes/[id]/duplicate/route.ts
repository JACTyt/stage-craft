import { NextResponse } from 'next/server';
import { duplicateScene, isValidSceneId } from '@/lib/server/sceneStorage';

/** Duplicates a scene under a new id, within the same collection. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidSceneId(id)) {
    return NextResponse.json({ error: 'Invalid scene id' }, { status: 400 });
  }
  const payload = await duplicateScene(id);
  if (!payload) {
    return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
  }
  return NextResponse.json(payload);
}
