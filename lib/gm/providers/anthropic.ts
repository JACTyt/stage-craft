import Anthropic from '@anthropic-ai/sdk';
import { GM_TOOLS } from '@/lib/gm/tools';
import type { ChatContentBlock } from '@/types/scene';
import type { GmProviderAdapter, GmProviderRequest, GmProviderResponse } from '@/lib/gm/providers/types';

export const anthropicAdapter: GmProviderAdapter = {
  async callChat({ apiKey, model, system, messages }: GmProviderRequest): Promise<GmProviderResponse> {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model,
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

    return { content, stopReason: response.stop_reason };
  },
};
