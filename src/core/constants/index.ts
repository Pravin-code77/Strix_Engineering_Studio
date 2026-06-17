import { ProviderConfig, ProviderType } from '../types/chat';

export const DEFAULT_PROVIDERS: Record<ProviderType, Omit<ProviderConfig, 'id' | 'apiKey'>> = {
  openai: {
    providerName: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  gemini: {
    providerName: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash',
  },
  openrouter: {
    providerName: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
  },
  lmstudio: {
    providerName: 'lmstudio',
    baseUrl: 'http://localhost:1234/v1',
    model: 'model-identifier',
  },
  custom: {
    providerName: 'custom',
    baseUrl: '',
    model: '',
  },
};

export const STORAGE_KEYS = {
  THEME: 'antigravity_theme',
  SETTINGS: 'antigravity_settings',
  ACTIVE_PROVIDER: 'antigravity_active_provider',
};

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
  lmstudio: 'LM Studio (Local)',
  custom: 'Custom OpenAI Endpoint',
};
