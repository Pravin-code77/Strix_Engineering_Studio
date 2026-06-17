import { Conversation } from '../../core/types/chat';

export interface IConversationRepository {
  getConversations(): Promise<Conversation[]>;
  getConversationById(id: string): Promise<Conversation | null>;
  createConversation(id: string, title: string, providerId?: string): Promise<Conversation>;
  updateConversationTitle(id: string, title: string): Promise<void>;
  updateConversationProvider(id: string, providerId: string): Promise<void>;
  deleteConversation(id: string): Promise<void>;
  searchConversations(query: string): Promise<Conversation[]>;
}
