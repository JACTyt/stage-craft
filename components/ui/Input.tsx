'use client';

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

const fieldCls =
  'rounded border border-border px-2 py-1 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldCls} bg-transparent ${className}`} {...props} />;
}

export function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldCls} bg-transparent resize-none ${className}`} {...props} />;
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={`${fieldCls} cursor-pointer appearance-none bg-surface-raised pr-6 transition-colors hover:border-accent/60 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted"
        aria-hidden="true"
      />
    </div>
  );
}
