'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Input, Select, TextArea } from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { getGmSettings, setGmSettings, type GmSettings } from '@/lib/gm/settings';
import type { GmProviderName } from '@/lib/gm/providers/types';
import { BASE_SYSTEM_PROMPT } from '@/lib/gm/systemPrompt';

const PROVIDER_LABELS: Record<GmProviderName, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
};

const MODEL_SUGGESTIONS: Record<GmProviderName, string[]> = {
  anthropic: ['claude-sonnet-5', 'claude-opus-4-8', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-5', 'gpt-5-mini', 'gpt-4o'],
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<GmSettings>(() => getGmSettings());
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const save = (next: GmSettings) => {
    setSettings(next);
    setGmSettings(next);
    setSavedAt(Date.now());
  };

  const activeApiKey = settings.provider === 'anthropic' ? settings.anthropicApiKey : settings.openaiApiKey;

  return (
    <div className="mx-auto flex w-full min-h-screen max-w-2xl flex-col gap-6 bg-background p-8">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/" className="flex items-center gap-0.5 text-xs text-foreground-muted hover:underline">
            <ArrowLeft className="h-3 w-3" /> Back
          </Link>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-wide text-foreground">
            Settings
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && <span className="text-xs text-foreground-muted">Saved</span>}
          <ThemeToggle />
        </div>
      </header>

      <section className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          AI Game Master
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs text-foreground-muted">
            Provider
            <Select
              value={settings.provider}
              onChange={(e) => save({ ...settings, provider: e.target.value as GmProviderName })}
              className="w-full"
            >
              {(Object.keys(PROVIDER_LABELS) as GmProviderName[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1 text-xs text-foreground-muted">
            Model
            <Input
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              onBlur={() => save(settings)}
              placeholder="e.g. claude-sonnet-5"
              className="w-full"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MODEL_SUGGESTIONS[settings.provider].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => save({ ...settings, model: m })}
              className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${
                settings.model === m
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-foreground-muted hover:bg-surface-raised'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-foreground-muted">
          Suggestions only — enter any model id your account has access to.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-foreground-muted">
            Anthropic API key
            {settings.provider === 'anthropic' && (
              <span className="ml-1.5 rounded bg-accent/20 px-1 py-0.5 text-[10px] uppercase text-accent">
                Active
              </span>
            )}
            <Input
              type="password"
              autoComplete="off"
              value={settings.anthropicApiKey}
              onChange={(e) => setSettings({ ...settings, anthropicApiKey: e.target.value })}
              onBlur={() => save(settings)}
              placeholder="sk-ant-..."
              className="w-full"
            />
          </label>
          <label className="space-y-1 text-xs text-foreground-muted">
            OpenAI API key
            {settings.provider === 'openai' && (
              <span className="ml-1.5 rounded bg-accent/20 px-1 py-0.5 text-[10px] uppercase text-accent">
                Active
              </span>
            )}
            <Input
              type="password"
              autoComplete="off"
              value={settings.openaiApiKey}
              onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
              onBlur={() => save(settings)}
              placeholder="sk-..."
              className="w-full"
            />
          </label>
        </div>
        {!activeApiKey && (
          <p className="text-[11px] text-foreground-muted">
            No key saved for {PROVIDER_LABELS[settings.provider]} — the server will fall back to its{' '}
            {settings.provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'} environment variable, if
            set.
          </p>
        )}
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          Base System Prompt
        </h2>
        <p className="text-xs text-foreground-muted">
          Fixed — this is what makes the GM actually use its tools (dice rolls, scene edits, HP
          tracking). Shown here for reference; it can&apos;t be edited.
        </p>
        <TextArea value={BASE_SYSTEM_PROMPT} readOnly rows={8} className="w-full text-xs opacity-70" />
      </section>

      <section className="space-y-2 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-foreground-muted">
          Additional Instructions
        </h2>
        <p className="text-xs text-foreground-muted">
          Appended after the base prompt above. Good place to characterize how the GM should
          reply — its tone, personality, pacing, how strict or lenient it is with rules.
        </p>
        <TextArea
          value={settings.additionalInstructions}
          onChange={(e) => setSettings({ ...settings, additionalInstructions: e.target.value })}
          onBlur={() => save(settings)}
          placeholder="e.g. Speak like a grizzled old sailor. Favor dry humor over grim tone. Let players get away with clever ideas even if the dice say no."
          rows={5}
          className="w-full"
        />
      </section>
    </div>
  );
}
