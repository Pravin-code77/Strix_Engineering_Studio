import axios from 'axios';
import { fetch } from 'expo/fetch';
import { OpenAIProvider } from './openai-provider';
import { Message, ProviderConfig } from '../../core/types/chat';
import { parseError, ProviderError } from '../../core/errors/app-error';

export class OpenRouterProvider extends OpenAIProvider {
  // Override sendMessage to add OpenRouter headers
  async sendMessage(messages: Message[], config: ProviderConfig): Promise<string> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/google/antigravity',
        'X-Title': 'Antigravity AI Assistant',
      };
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await axios.post(
        `${config.baseUrl}/chat/completions`,
        {
          model: config.model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        { headers }
      );
      return response.data.choices[0].message.content || '';
    } catch (error: any) {
      throw parseError(error);
    }
  }

  // Override sendMessageStream to add OpenRouter headers
  async sendMessageStream(
    messages: Message[],
    config: ProviderConfig,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const url = `${config.baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/google/antigravity',
      'X-Title': 'Antigravity AI Assistant',
    };
    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: config.model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let displayError = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          displayError = errorJson.error?.message || errorJson.message || errorText;
        } catch {
          if (errorText.trim().startsWith('<')) {
            displayError = 'HTML error page (likely bad OpenRouter endpoint configuration).';
          }
        }
        throw new ProviderError(
          `OpenRouter Error (${response.status}): ${displayError}`,
          `HTTP_${response.status}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new ProviderError('Streaming not supported by OpenRouter response');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;

          if (trimmed.startsWith('data: ')) {
            try {
              const dataStr = trimmed.slice(6);
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                onChunk(content);
              }
            } catch (e) {}
          }
        }
      }

      return fullText;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new ProviderError('Request cancelled by user', 'CANCELLED');
      }
      throw error;
    }
  }
}
