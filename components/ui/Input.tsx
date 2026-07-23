'use client';

import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

const fieldCls =
  'rounded border border-border bg-transparent px-2 py-1 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldCls} ${className}`} {...props} />;
}

export function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldCls} resize-none ${className}`} {...props} />;
}
