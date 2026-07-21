'use client';

import { useEffect, useRef, useState } from 'react';
import { useSceneStore } from '@/lib/sceneStore';
import { useResizableWidth } from '@/lib/useResizableWidth';
import { executeToolCall } from '@/lib/gm/executeToolCall';
import type { ChatContentBlock, ChatMessage } from '@/types/scene';
import type { Collection, GameCharacter } from '@/types/collection';

const MAX_TOOL_ROUNDS = 8;

async function callGmApi(messages: ChatMessage[], campaignContext: string): Promise<ChatMessage> {
  const res = await fetch('/api/gm/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, campaignContext }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? 'The AI Game Master request failed.');
  }
  return { role: 'assistant', content: data.content as ChatContentBlock[] };
}

/** Runs the request/tool-call loop until the model stops calling tools, appending every turn to chat. */
async function runConversationTurns(
  history: ChatMessage[],
  campaignContext: string,
  appendChatMessages: (messages: ChatMessage[]) => void
): Promise<ChatMessage[]> {
  let current = history;
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const assistantMessage = await callGmApi(current, campaignContext);
    appendChatMessages([assistantMessage]);
    current = [...current, assistantMessage];

    const toolUseBlocks = Array.isArray(assistantMessage.content)
      ? assistantMessage.content.filter((b): b is Extract<ChatContentBlock, { type: 'tool_use' }> =>
          b.type === 'tool_use'
        )
      : [];

    if (toolUseBlocks.length === 0) break;

    const toolResultMessage: ChatMessage = {
      role: 'user',
      content: toolUseBlocks.map((block) => ({
        type: 'tool_result' as const,
        tool_use_id: block.id,
        content: executeToolCall(block.name, block.input),
      })),
    };
    appendChatMessages([toolResultMessage]);
    current = [...current, toolResultMessage];
  }
  return current;
}

function extractText(message: ChatMessage): string {
  if (typeof message.content === 'string') return message.content;
  return message.content
    .filter((b): b is Extract<ChatContentBlock, { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

function buildCampaignContext(collection: Collection, characters: GameCharacter[]): string {
  const parts: string[] = [`Campaign: ${collection.name}`];
  if (collection.description) parts.push(`Description: ${collection.description}`);
  if (collection.lore) parts.push(`Lore:\n${collection.lore}`);
  if (characters.length > 0) {
    const roster = characters
      .map((c) => `- ${c.name} (${c.kind.toUpperCase()}, HP ${c.hp}/${c.maxHp}, AC ${c.ac}): ${c.description}`)
      .join('\n');
    parts.push(`Character roster:\n${roster}`);
  }
  if (collection.sessionMemory) parts.push(`Session memory:\n${collection.sessionMemory}`);
  return parts.join('\n\n');
}

const START_SESSION_DIRECTIVE =
  '\n\n[Session starting. Give a brief "Previously on..." recap based on the session memory above, then ask what the party does.]';
const END_SESSION_DIRECTIVE =
  '\n\n[Session ending. Reply with ONLY a concise bullet-point summary of what happened this session — no narration, no questions.]';

export default function GameMasterChat() {
  const chatMessages = useSceneStore((s) => s.scene.chatMessages);
  const sceneId = useSceneStore((s) => s.scene.id);
  const collectionId = useSceneStore((s) => s.scene.collectionId);
  const appendChatMessages = useSceneStore((s) => s.appendChatMessages);
  const clearChat = useSceneStore((s) => s.clearChat);

  const { width, onMouseDown } = useResizableWidth(288, 240, 560, 'left');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedContext, setFetchedContext] = useState('');
  const campaignContext = collectionId ? fetchedContext : '';
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chatMessages, isLoading]);

  useEffect(() => {
    if (!collectionId) return;
    fetch(`/api/collections/${collectionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        setFetchedContext(buildCampaignContext(data.collection, data.characters ?? []));
      })
      .catch(() => {});
  }, [collectionId]);

  const saveSessionSummary = async (summaryText: string) => {
    if (!collectionId) return;
    const res = await fetch(`/api/collections/${collectionId}`);
    const data = await res.json();
    if (data.error) return;
    const dateHeading = new Date().toISOString().slice(0, 10);
    const nextSessionMemory = data.collection.sessionMemory
      ? `${data.collection.sessionMemory}\n\n## Session — ${dateHeading}\n${summaryText}`
      : `## Session — ${dateHeading}\n${summaryText}`;
    await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        collection: { ...data.collection, sessionMemory: nextSessionMemory },
        notes: data.notes ?? [],
        characters: data.characters ?? [],
      }),
    });
  };

  const runSessionCommand = async (command: '/start_session' | '/end_session', rawText: string) => {
    if (!collectionId) {
      setError('This scene has no linked campaign, so session commands are unavailable.');
      return;
    }

    setInput('');
    setError(null);
    setIsLoading(true);

    const userMessage: ChatMessage = { role: 'user', content: rawText };
    appendChatMessages([userMessage]);
    const directive = command === '/start_session' ? START_SESSION_DIRECTIVE : END_SESSION_DIRECTIVE;

    try {
      await fetch(`/api/scenes/${sceneId}`, { method: 'PATCH' });

      const finalHistory = await runConversationTurns(
        [...chatMessages, userMessage],
        campaignContext + directive,
        appendChatMessages
      );

      if (command === '/end_session') {
        const lastMessage = finalHistory[finalHistory.length - 1];
        await saveSessionSummary(extractText(lastMessage));
        await fetch(`/api/scenes/${sceneId}`, { method: 'PATCH' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The AI Game Master request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const normalized = text.toLowerCase();
    if (normalized === '/start_session' || normalized === '/end_session') {
      await runSessionCommand(normalized as '/start_session' | '/end_session', text);
      return;
    }

    setInput('');
    setError(null);
    setIsLoading(true);

    const userMessage: ChatMessage = { role: 'user', content: text };
    appendChatMessages([userMessage]);

    try {
      await runConversationTurns([...chatMessages, userMessage], campaignContext, appendChatMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The AI Game Master request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative flex shrink-0 flex-col rounded-lg border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900"
      style={{ width }}
    >
      <div
        onMouseDown={onMouseDown}
        title="Drag to resize"
        className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400/40"
      />
      <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          Game Master
        </h2>
        <button
          type="button"
          onClick={clearChat}
          className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
        >
          Clear
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-2 text-sm">
        {chatMessages.length === 0 && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Talk to the AI Game Master. It can narrate, roll dice, and edit the scene directly
            (add/move tokens and terrain, track HP and initiative). Type /start_session or
            /end_session to bookend a play session.
          </p>
        )}
        {chatMessages.map((message, i) => (
          <ChatMessageView key={i} message={message} />
        ))}
        {isLoading && <p className="text-xs italic text-neutral-400">Thinking…</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      <div className="flex items-end gap-2 border-t border-neutral-200 p-2 dark:border-neutral-700">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          rows={2}
          placeholder="Say something to the GM…"
          className="flex-1 resize-none rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

function ChatMessageView({ message }: { message: ChatMessage }) {
  if (typeof message.content === 'string') {
    return (
      <div className="ml-auto max-w-[85%] rounded-lg bg-blue-600 px-2.5 py-1.5 text-white">
        {message.content}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {message.content.map((block, i) => {
        if (block.type === 'text') {
          return (
            <div
              key={i}
              className="max-w-[90%] rounded-lg bg-neutral-100 px-2.5 py-1.5 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
            >
              {block.text}
            </div>
          );
        }
        if (block.type === 'tool_use') {
          return (
            <div key={i} className="text-[11px] text-neutral-400 dark:text-neutral-500">
              🔧 {block.name}({JSON.stringify(block.input)})
            </div>
          );
        }
        if (block.type === 'tool_result') {
          return (
            <div key={i} className="text-[11px] text-neutral-400 dark:text-neutral-500">
              ↳ {block.content}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
