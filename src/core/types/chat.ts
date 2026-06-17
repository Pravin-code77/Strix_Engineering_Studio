export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: string; // ISO string
}

export type ProviderType = 'openai' | 'gemini' | 'openrouter' | 'lmstudio' | 'custom';

export interface ProviderConfig {
  id: string; // Equal to providerName for singletons, or unique id if multiple configs
  providerName: ProviderType;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  providerId?: string; // Optional: switch provider per conversation
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppSettings {
  theme: ThemeMode;
  ttsEnabled: boolean;
  activeProviderId: string; // Active global provider config id
  speechRate: number; // For TTS speed (bonus settings option)
}
