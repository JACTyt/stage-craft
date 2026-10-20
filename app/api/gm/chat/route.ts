import { NextRequest, NextResponse } from 'next/server';
import { GM_PROVIDERS, GM_PROVIDER_ENV_VAR, isGmProviderName } from '@/lib/gm/providers';
import { BASE_SYSTEM_PROMPT } from '@/lib/gm/systemPrompt';
import type { ChatMessage } from '@/types/scene';

const DEFAULT_MODEL = 'claude-sonnet-5';
const MAX_MESSAGES = 200;
const MAX_MESSAGE_CHARS = 20000;
const MAX_CONTEXT_CHARS = 20000;
const MAX_INSTRUCTIONS_CHARS = 4000;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const messages = body?.messages as ChatMessage[] | undefined;
  const campaignContext = typeof body?.campaignContext === 'string' ? body.campaignContext : '';
  const additionalInstructions =
    typeof body?.additionalInstructions === 'string' ? body.additionalInstructions : '';
  const rawProvider = body?.provider;
  const provider = isGmProviderName(rawProvider) ? rawProvider : 'anthropic';
  const model = typeof body?.model === 'string' && body.model.trim() ? body.model.trim() : DEFAULT_MODEL;
  const clientApiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Request must include a non-empty messages array.' },
      { status: 400 }
    );
  }
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: `Too many messages (max ${MAX_MESSAGES}).` }, { status: 413 });
  }
  if (campaignContext.length > MAX_CONTEXT_CHARS) {
    return NextResponse.json({ error: 'Campaign context exceeds the size limit.' }, { status: 413 });
  }
  if (additionalInstructions.length > MAX_INSTRUCTIONS_CHARS) {
    return NextResponse.json({ error: 'Additional instructions exceed the size limit.' }, { status: 413 });
  }
  for (const message of messages) {
    const size =
      typeof message.content === 'string'
        ? message.content.length
        : JSON.stringify(message.content).length;
    if (size > MAX_MESSAGE_CHARS) {
      return NextResponse.json({ error: 'A message exceeds the size limit.' }, { status: 413 });
    }
  }

  const apiKey = clientApiKey || process.env[GM_PROVIDER_ENV_VAR[provider]];
  if (!apiKey) {
    return NextResponse.json(
      {
        error: `No API key configured for provider "${provider}". Add one in Settings or set ${GM_PROVIDER_ENV_VAR[provider]} on the server.`,
      },
      { status: 500 }
    );
  }

  const system = [
    BASE_SYSTEM_PROMPT,
    additionalInstructions ? `Additional GM style instructions:\n${additionalInstructions}` : '',
    campaignContext ? `Campaign context (use this for continuity and world knowledge):\n${campaignContext}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const { content, stopReason } = await GM_PROVIDERS[provider].callChat({ apiKey, model, system, messages });
    return NextResponse.json({ role: 'assistant', content, stopReason });
  } catch (err) {
    console.error('GM chat error', err);
    return NextResponse.json({ error: 'The AI Game Master request failed.' }, { status: 502 });
  }
}
