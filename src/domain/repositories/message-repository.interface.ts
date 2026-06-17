import { Message } from '../../core/types/chat';

export interface IMessageRepository {
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: Message): Promise<Message>;
  deleteMessagesForConversation(conversationId: string): Promise<void>;
  searchMessages(query: string): Promise<Message[]>;
}
