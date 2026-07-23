'use client';

import LayerPanel from '@/components/Canvas/LayerPanel';
import Inspector from '@/components/Canvas/Inspector';
import { useResizableWidth } from '@/lib/useResizableWidth';

/** Resizable, hideable wrapper around LayerPanel + Inspector for the right-side rail. */
export default function LayersPanel() {
  const { width, onMouseDown } = useResizableWidth(224, 180, 480, 'left');

  return (
    <div className="relative flex shrink-0 flex-col gap-3" style={{ width }}>
      <div
        onMouseDown={onMouseDown}
        title="Drag to resize"
        className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-accent/30"
      />
      <LayerPanel />
      <Inspector />
    </div>
  );
}
