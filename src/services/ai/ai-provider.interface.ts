import { Message, ProviderConfig } from '../../core/types/chat';

export interface AIProvider {
  sendMessage(
    messages: Message[],
    config: ProviderConfig
  ): Promise<string>;

  sendMessageStream(
    messages: Message[],
    config: ProviderConfig,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<string>;
}
