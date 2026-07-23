'use client';

import type { LucideIcon } from 'lucide-react';

interface RailItem {
  key: string;
  label: string;
  icon: LucideIcon;
  open: boolean;
  onToggle: () => void;
}

interface SidePanelRailProps {
  items: RailItem[];
}

/** Single collapsed strip standing in for multiple side panels — one icon button per panel, each toggling independently. */
export default function SidePanelRail({ items }: SidePanelRailProps) {
  return (
    <div className="flex w-10 shrink-0 flex-col items-center gap-1.5 rounded-lg border border-border bg-surface py-2.5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={item.onToggle}
            title={item.open ? `Hide ${item.label}` : `Show ${item.label}`}
            className={`flex h-8 w-8 items-center justify-center rounded-md ${
              item.open
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground-muted hover:bg-surface-raised hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
