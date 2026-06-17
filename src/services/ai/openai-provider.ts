import axios from 'axios';
import { fetch } from 'expo/fetch';
import { AIProvider } from './ai-provider.interface';
import { Message, ProviderConfig } from '../../core/types/chat';
import { parseError, AuthError, ProviderError } from '../../core/errors/app-error';

export class OpenAIProvider implements AIProvider {
  async sendMessage(messages: Message[], config: ProviderConfig): Promise<string> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
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

  async sendMessageStream(
    messages: Message[],
    config: ProviderConfig,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const url = `${config.baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
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
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        let displayMsg = errorData?.error?.message || `API error with status ${response.status}`;
        if (typeof displayMsg === 'string' && displayMsg.trim().startsWith('<')) {
          displayMsg = 'HTML error response (likely a bad endpoint configuration).';
        }
        throw new ProviderError(
          displayMsg,
          `HTTP_${response.status}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new ProviderError('Streaming not supported by response body');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line

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
            } catch (e) {
              // Ignore line parse errors during streaming
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        try {
          const dataStr = buffer.slice(6).trim();
          if (dataStr && dataStr !== '[DONE]') {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              onChunk(content);
            }
          }
        } catch (e) {}
      }

      return fullText;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new ProviderError('Request cancelled by user', 'CANCELLED');
      }
      throw parseError(error);
    }
  }
}
