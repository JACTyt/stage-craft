import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GM_TOOLS } from '@/lib/gm/tools';
import type { ChatContentBlock, ChatMessage } from '@/types/scene';

const SYSTEM_PROMPT = `You are the Dungeon Master running a tabletop RPG session using Dungeons & Dragons 5th edition rules.

You narrate the story, voice NPCs and monsters, and adjudicate rules. You have full control over the map through tools: you can place and remove terrain, walls, furniture, and tokens, move and resize things, and manage combat.

Rules for using tools:
- Always call get_scene_state before referencing what's on the map, since the player may have changed it outside the chat.
- Always use roll_dice for attack rolls, ability checks, saving throws, and damage instead of inventing a number.
- When a token takes damage or is healed, call update_character to actually change its hp — don't just narrate it.
- Track initiative by calling update_character with the initiative field after rolling for it.

Keep narration vivid but concise. After taking any tool actions, summarize what happened for the player in plain prose.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured on the server.' },
      { status: 500 }
    );
  }

  const body = await request.json();
  const messages = body?.messages as ChatMessage[] | undefined;
  const campaignContext = typeof body?.campaignContext === 'string' ? body.campaignContext : '';
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Request must include a non-empty messages array.' },
      { status: 400 }
    );
  }

  const MAX_MESSAGES = 200;
  const MAX_MESSAGE_CHARS = 20000;
  const MAX_CONTEXT_CHARS = 20000;
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: `Too many messages (max ${MAX_MESSAGES}).` }, { status: 413 });
  }
  if (campaignContext.length > MAX_CONTEXT_CHARS) {
    return NextResponse.json({ error: 'Campaign context exceeds the size limit.' }, { status: 413 });
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

  const client = new Anthropic({ apiKey });
  const system = campaignContext
    ? `${SYSTEM_PROMPT}\n\nCampaign context (use this for continuity and world knowledge):\n${campaignContext}`
    : SYSTEM_PROMPT;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system,
      tools: GM_TOOLS as unknown as Anthropic.Tool[],
      messages: messages as unknown as Anthropic.MessageParam[],
    });

    const content: ChatContentBlock[] = response.content.flatMap((block): ChatContentBlock[] => {
      if (block.type === 'text') {
        return [{ type: 'text' as const, text: block.text }];
      }
      if (block.type === 'tool_use') {
        return [
          {
            type: 'tool_use' as const,
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          },
        ];
      }
      return [];
    });

    return NextResponse.json({ role: 'assistant', content, stopReason: response.stop_reason });
  } catch (err) {
    console.error('GM chat error', err);
    return NextResponse.json({ error: 'The AI Game Master request failed.' }, { status: 502 });
  }
}
