import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import path from 'path';

const TILESETS_DIR = path.join(process.cwd(), 'public', 'tilesets');

/** Lists bundled tileset images available under public/tilesets, for a no-upload quick-import option. */
export async function GET() {
  let files: string[] = [];
  try {
    files = (await readdir(TILESETS_DIR)).filter((name) => /\.(png|webp)$/i.test(name));
  } catch {
    files = [];
  }
  return NextResponse.json({ files });
}
