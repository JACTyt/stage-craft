import OpenAI from 'openai';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import { GM_TOOLS } from '@/lib/gm/tools';
import type { ChatContentBlock, ChatMessage } from '@/types/scene';
import type { GmProviderAdapter, GmProviderRequest, GmProviderResponse } from '@/lib/gm/providers/types';

function toOpenAiTools(): ChatCompletionTool[] {
  return GM_TOOLS.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema as Record<string, unknown>,
    },
  }));
}

/** Converts the app's Anthropic-shaped ChatMessage[] into OpenAI's chat.completions message format. */
function toOpenAiMessages(system: string, messages: ChatMessage[]): ChatCompletionMessageParam[] {
  const out: ChatCompletionMessageParam[] = [{ role: 'system', content: system }];

  for (const message of messages) {
    if (typeof message.content === 'string') {
      if (message.role === 'user') {
        out.push({ role: 'user', content: message.content });
      } else {
        out.push({ role: 'assistant', content: message.content });
      }
      continue;
    }

    const toolResults = message.content.filter(
      (b): b is Extract<ChatContentBlock, { type: 'tool_result' }> => b.type === 'tool_result'
    );
    if (toolResults.length > 0) {
      for (const result of toolResults) {
        out.push({ role: 'tool', tool_call_id: result.tool_use_id, content: result.content });
      }
      continue;
    }

    const textBlocks = message.content.filter(
      (b): b is Extract<ChatContentBlock, { type: 'text' }> => b.type === 'text'
    );
    const toolUseBlocks = message.content.filter(
      (b): b is Extract<ChatContentBlock, { type: 'tool_use' }> => b.type === 'tool_use'
    );

    out.push({
      role: 'assistant',
      content: textBlocks.length > 0 ? textBlocks.map((b) => b.text).join('\n') : null,
      tool_calls:
        toolUseBlocks.length > 0
          ? toolUseBlocks.map((b) => ({
              id: b.id,
              type: 'function' as const,
              function: { name: b.name, arguments: JSON.stringify(b.input) },
            }))
          : undefined,
    });
  }

  return out;
}

export const openaiAdapter: GmProviderAdapter = {
  async callChat({ apiKey, model, system, messages }: GmProviderRequest): Promise<GmProviderResponse> {
    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
      model,
      max_completion_tokens: 1024,
      messages: toOpenAiMessages(system, messages),
      tools: toOpenAiTools(),
    });

    const message = response.choices[0]?.message;
    const content: ChatContentBlock[] = [];

    if (message?.content) {
      content.push({ type: 'text', text: message.content });
    }
    for (const call of message?.tool_calls ?? []) {
      if (call.type !== 'function') continue;
      let input: Record<string, unknown> = {};
      try {
        input = JSON.parse(call.function.arguments);
      } catch {
        input = {};
      }
      content.push({ type: 'tool_use', id: call.id, name: call.function.name, input });
    }

    return { content, stopReason: response.choices[0]?.finish_reason ?? null };
  },
};
