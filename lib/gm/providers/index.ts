import { anthropicAdapter } from '@/lib/gm/providers/anthropic';
import { openaiAdapter } from '@/lib/gm/providers/openai';
import type { GmProviderAdapter, GmProviderName } from '@/lib/gm/providers/types';

export const GM_PROVIDERS: Record<GmProviderName, GmProviderAdapter> = {
  anthropic: anthropicAdapter,
  openai: openaiAdapter,
};

export function isGmProviderName(value: unknown): value is GmProviderName {
  return value === 'anthropic' || value === 'openai';
}

export const GM_PROVIDER_ENV_VAR: Record<GmProviderName, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
};

export type { GmProviderName } from '@/lib/gm/providers/types';
