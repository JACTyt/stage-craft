import { PNG } from 'pngjs';
import { findConnectedRegions } from '@/lib/tilesetSlicer';

export interface ServerSlice {
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
}

/** Decodes a PNG buffer and slices it into individual sprites by transparency. */
export function sliceTilesetBuffer(buffer: Buffer): ServerSlice[] {
  const source = PNG.sync.read(buffer);
  const { width, height, data } = source;

  const regions = findConnectedRegions(width, height, (idx) => data[idx * 4 + 3]);

  return regions.map((region) => {
    const out = new PNG({ width: region.width, height: region.height });
    for (let y = 0; y < region.height; y++) {
      for (let x = 0; x < region.width; x++) {
        const srcIdx = ((region.y + y) * width + (region.x + x)) * 4;
        const dstIdx = (y * region.width + x) * 4;
        out.data[dstIdx] = data[srcIdx];
        out.data[dstIdx + 1] = data[srcIdx + 1];
        out.data[dstIdx + 2] = data[srcIdx + 2];
        out.data[dstIdx + 3] = data[srcIdx + 3];
      }
    }

    const dataUrl = `data:image/png;base64,${PNG.sync.write(out).toString('base64')}`;
    return { ...region, dataUrl };
  });
}
