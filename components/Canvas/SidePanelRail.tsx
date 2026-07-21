'use client';

interface RailItem {
  key: string;
  label: string;
  open: boolean;
  onToggle: () => void;
}

interface SidePanelRailProps {
  items: RailItem[];
}

/** Single collapsed strip standing in for multiple side panels — one button per panel, each toggling independently. */
export default function SidePanelRail({ items }: SidePanelRailProps) {
  return (
    <div className="flex w-8 shrink-0 flex-col items-center gap-3 rounded-lg border border-neutral-300 bg-white py-3 dark:border-neutral-700 dark:bg-neutral-900">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onToggle}
          title={item.open ? `Hide ${item.label}` : `Show ${item.label}`}
          className={`rounded px-1 py-1.5 text-[11px] [writing-mode:vertical-rl] ${
            item.open
              ? 'bg-purple-600 text-white'
              : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
