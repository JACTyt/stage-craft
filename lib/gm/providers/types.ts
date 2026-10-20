import type { ChatContentBlock, ChatMessage } from '@/types/scene';

export interface GmProviderRequest {
  apiKey: string;
  model: string;
  system: string;
  messages: ChatMessage[];
}

export interface GmProviderResponse {
  content: ChatContentBlock[];
  stopReason: string | null;
}

export interface GmProviderAdapter {
  callChat(request: GmProviderRequest): Promise<GmProviderResponse>;
}

export type GmProviderName = 'anthropic' | 'openai';
