import { NextResponse } from 'next/server';
import { duplicateCollection } from '@/lib/server/duplicateCollection';
import { isValidId } from '@/lib/server/idValidation';

/** Duplicates a collection (and every scene linked to it) under new ids. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ error: 'Invalid collection id' }, { status: 400 });
  }
  const payload = await duplicateCollection(id);
  if (!payload) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
  }
  return NextResponse.json(payload);
}
