import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { sliceTilesetBuffer } from '@/lib/server/pngSlicer';

const TILESETS_DIR = path.join(process.cwd(), 'public', 'tilesets');

/**
 * Slices a tileset image into individual sprites server-side. Accepts either
 * an uploaded `file`, or a `filename` referencing one of the bundled images
 * in public/tilesets (so a tileset can be imported without an OS file picker).
 */
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file');
  const filename = formData.get('filename');

  let buffer: Buffer;

  if (file instanceof File) {
    if (!/^image\/(png|webp)$/.test(file.type)) {
      return NextResponse.json({ error: 'Only PNG or WebP images are supported' }, { status: 400 });
    }
    buffer = Buffer.from(await file.arrayBuffer());
  } else if (typeof filename === 'string') {
    // Strip any directory components so this can never escape the tilesets folder.
    const safeName = path.basename(filename);
    const filePath = path.join(TILESETS_DIR, safeName);
    if (path.dirname(filePath) !== TILESETS_DIR) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    try {
      buffer = await readFile(filePath);
    } catch {
      return NextResponse.json({ error: 'Tileset not found' }, { status: 404 });
    }
  } else {
    return NextResponse.json({ error: 'Provide a file upload or a filename' }, { status: 400 });
  }

  try {
    const slices = sliceTilesetBuffer(buffer);
    return NextResponse.json({ slices });
  } catch {
    return NextResponse.json({ error: 'Could not decode that image as a PNG' }, { status: 400 });
  }
}
