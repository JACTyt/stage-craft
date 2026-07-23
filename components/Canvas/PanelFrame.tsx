'use client';

import type { ReactNode } from 'react';
import { useResizableWidth } from '@/lib/useResizableWidth';

interface PanelFrameProps {
  title: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  actions?: ReactNode;
  children: ReactNode;
}

/** Chrome-only wrapper (header + border + resize handle) for a side panel. Visibility is controlled by the parent conditionally mounting it — see SidePanelRail. */
export default function PanelFrame({
  title,
  defaultWidth = 224,
  minWidth = 180,
  maxWidth = 480,
  actions,
  children,
}: PanelFrameProps) {
  const { width, onMouseDown } = useResizableWidth(defaultWidth, minWidth, maxWidth, 'right');

  return (
    <div
      className="relative flex shrink-0 flex-col space-y-3 overflow-y-auto rounded-lg border border-border bg-surface p-3 shadow-sm"
      style={{ width }}
    >
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          <span className="h-2 w-2 shrink-0 bg-accent" aria-hidden="true" />
          {title}
        </h2>
        {actions}
      </div>
      {children}
      <div
        onMouseDown={onMouseDown}
        title="Drag to resize"
        className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-accent/30"
      />
    </div>
  );
}
