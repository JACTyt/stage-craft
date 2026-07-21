const ALPHA_THRESHOLD = 10; // ignore near-fully-transparent anti-aliasing noise
const MIN_PIXEL_AREA = 16; // drop stray specks that aren't real sprites

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Segments an image into individual sprites by finding connected regions of
 * non-transparent pixels (4-connectivity flood fill) — so any sprite sheet
 * laid out with transparent gaps between pieces auto-slices into one region
 * per piece. Environment-agnostic: callers supply pixel alpha lookup so this
 * works against both a browser canvas ImageData buffer and a server-decoded
 * PNG buffer (see lib/server/pngSlicer.ts).
 */
export function findConnectedRegions(
  width: number,
  height: number,
  alphaAt: (pixelIndex: number) => number
): Region[] {
  const isOpaque = (idx: number) => alphaAt(idx) > ALPHA_THRESHOLD;
  const visited = new Uint8Array(width * height);
  const regions: Region[] = [];
  const stack: number[] = [];

  for (let start = 0; start < width * height; start++) {
    if (visited[start] || !isOpaque(start)) continue;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let pixelCount = 0;

    stack.push(start);
    visited[start] = 1;

    while (stack.length > 0) {
      const idx = stack.pop()!;
      const x = idx % width;
      const y = Math.floor(idx / width);
      pixelCount++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const neighbors: [number, number][] = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nIdx = ny * width + nx;
        if (visited[nIdx] || !isOpaque(nIdx)) continue;
        visited[nIdx] = 1;
        stack.push(nIdx);
      }
    }

    if (pixelCount < MIN_PIXEL_AREA) continue;

    regions.push({ x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 });
  }

  return regions.sort((a, b) => a.y - b.y || a.x - b.x);
}
