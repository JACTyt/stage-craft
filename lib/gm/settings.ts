'use client';

import type { GmProviderName } from '@/lib/gm/providers/types';

export interface GmSettings {
  provider: GmProviderName;
  model: string;
  additionalInstructions: string;
  anthropicApiKey: string;
  openaiApiKey: string;
}

export const DEFAULT_GM_SETTINGS: GmSettings = {
  provider: 'anthropic',
  model: 'claude-sonnet-5',
  additionalInstructions: '',
  anthropicApiKey: '',
  openaiApiKey: '',
};

const STORAGE_KEY = 'stagecraft-gm-settings';

/** Reads the persisted GM settings from localStorage, falling back to defaults for anything missing. */
export function getGmSettings(): GmSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_GM_SETTINGS;
    return { ...DEFAULT_GM_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GM_SETTINGS;
  }
}

export function setGmSettings(settings: GmSettings) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function apiKeyForProvider(settings: GmSettings): string {
  return settings.provider === 'anthropic' ? settings.anthropicApiKey : settings.openaiApiKey;
}
