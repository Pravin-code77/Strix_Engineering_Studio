import { OpenAIProvider } from './openai-provider';

export class LMStudioProvider extends OpenAIProvider {
  // Inherits all OpenAI compatible logic.
  // Since LM Studio typically runs locally, baseUrl resolves to http://localhost:1234/v1
  // and does not enforce authentication (apiKey can be empty).
}
