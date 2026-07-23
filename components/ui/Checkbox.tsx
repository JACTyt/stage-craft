'use client';

import type { InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export default function Checkbox({ className = '', ...props }: CheckboxProps) {
  return (
    <span className={`relative inline-flex h-4 w-4 shrink-0 ${className}`}>
      <input
        type="checkbox"
        className="peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-border bg-transparent transition-colors checked:border-accent checked:bg-accent"
        {...props}
      />
      <Check
        className="pointer-events-none absolute inset-0 h-4 w-4 stroke-[3] text-accent-foreground opacity-0 peer-checked:opacity-100"
        aria-hidden="true"
      />
    </span>
  );
}
