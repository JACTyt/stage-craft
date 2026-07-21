import { NextRequest, NextResponse } from 'next/server';
import { listCollections, saveCollection } from '@/lib/server/collectionStorage';
import { isValidId } from '@/lib/server/idValidation';
import type { Collection, GameCharacter, Note } from '@/types/collection';

/** Lists saved collections (id, name, description, savedAt) from data/collections/*.json. */
export async function GET() {
  const collections = await listCollections();
  return NextResponse.json({ collections });
}

/** Saves (creates or overwrites) a collection as data/collections/{collection.id}.json. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const collection = body?.collection as Collection | undefined;
  const notes = (body?.notes as Note[] | undefined) ?? [];
  const characters = (body?.characters as GameCharacter[] | undefined) ?? [];

  if (!collection?.id || !collection?.name) {
    return NextResponse.json(
      { error: 'Request must include a collection with id and name' },
      { status: 400 }
    );
  }
  if (!isValidId(collection.id)) {
    return NextResponse.json(
      { error: 'Collection id must be alphanumeric (with - or _), max 64 chars' },
      { status: 400 }
    );
  }

  const payload = await saveCollection(collection, notes, characters);
  return NextResponse.json(payload);
}
