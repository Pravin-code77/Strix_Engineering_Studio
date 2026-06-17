import axios from 'axios';
import { fetch } from 'expo/fetch';
import { AIProvider } from './ai-provider.interface';
import { Message, ProviderConfig } from '../../core/types/chat';
import { parseError, ProviderError } from '../../core/errors/app-error';

export class GeminiProvider implements AIProvider {
  private formatMessages(messages: Message[]) {
    return messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
  }

  async sendMessage(messages: Message[], config: ProviderConfig): Promise<string> {
    try {
      const url = `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`;
      const response = await axios.post(
        url,
        {
          contents: this.formatMessages(messages),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text === undefined) {
        throw new ProviderError('Invalid response structure from Gemini API');
      }
      return text;
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
    // Adding alt=sse makes Gemini return SSE format (data: ...)
    const url = `${config.baseUrl}/models/${config.model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: this.formatMessages(messages),
        }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let displayError = errorText;
        if (errorText.trim().startsWith('<')) {
          displayError = 'HTML error response (likely a bad endpoint or model configuration).';
        }
        throw new ProviderError(
          `Gemini API error (${response.status}): ${displayError}`,
          `HTTP_${response.status}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new ProviderError('Streaming not supported by Gemini response');
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
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (content) {
                fullText += content;
                onChunk(content);
              }
            } catch (e) {
              // Ignore parse errors during stream
            }
          }
        }
      }

      // Process remaining buffer
      if (buffer.startsWith('data: ')) {
        try {
          const dataStr = buffer.slice(6).trim();
          if (dataStr) {
            const parsed = JSON.parse(dataStr);
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
