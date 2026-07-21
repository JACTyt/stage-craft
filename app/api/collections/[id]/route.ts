import { NextResponse } from 'next/server';
import { loadCollection } from '@/lib/server/collectionStorage';
import { isValidId } from '@/lib/server/idValidation';

/** Loads one saved collection by id from data/collections/{id}.json. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: 'Invalid collection id' }, { status: 400 });
  }
  const payload = await loadCollection(id);
  if (!payload) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }
  return NextResponse.json(payload);
}
