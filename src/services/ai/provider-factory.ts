import { AIProvider } from './ai-provider.interface';
import { OpenAIProvider } from './openai-provider';
import { GeminiProvider } from './gemini-provider';
import { OpenRouterProvider } from './openrouter-provider';
import { LMStudioProvider } from './lmstudio-provider';
import { ProviderType } from '../../core/types/chat';

export class ProviderFactory {
  static getProvider(type: ProviderType): AIProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider();
      case 'gemini':
        return new GeminiProvider();
      case 'openrouter':
        return new OpenRouterProvider();
      case 'lmstudio':
        return new LMStudioProvider();
      case 'custom':
        return new OpenAIProvider(); // Custom OpenAI endpoints are compatible with OpenAIProvider
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }
}
