import { getDatabase } from '../database/sqlite-client';
import { Message, MessageRole } from '../../core/types/chat';
import { IMessageRepository } from '../../domain/repositories/message-repository.interface';
import { DatabaseError } from '../../core/errors/app-error';

export class SQLiteMessageRepository implements IMessageRepository {
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<{
        id: string;
        conversation_id: string;
        role: string;
        content: string;
        timestamp: string;
      }>(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC',
        [conversationId]
      );

      return rows.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        role: row.role as MessageRole,
        content: row.content,
        timestamp: row.timestamp,
      }));
    } catch (error: any) {
      throw new DatabaseError(`Failed to load messages: ${error.message}`);
    }
  }

  async createMessage(message: Message): Promise<Message> {
    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT INTO messages (id, conversation_id, role, content, timestamp)
         VALUES (?, ?, ?, ?, ?);`,
        [message.id, message.conversationId, message.role, message.content, message.timestamp]
      );

      // Trigger conversation updated_at update
      await db.runAsync(
        'UPDATE conversations SET updated_at = ? WHERE id = ?;',
        [new Date().toISOString(), message.conversationId]
      );

      return message;
    } catch (error: any) {
      throw new DatabaseError(`Failed to save message: ${error.message}`);
    }
  }

  async deleteMessagesForConversation(conversationId: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM messages WHERE conversation_id = ?;', [conversationId]);
    } catch (error: any) {
      throw new DatabaseError(`Failed to delete messages: ${error.message}`);
    }
  }

  async searchMessages(query: string): Promise<Message[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<{
        id: string;
        conversation_id: string;
        role: string;
        content: string;
        timestamp: string;
      }>(
        'SELECT * FROM messages WHERE content LIKE ? ORDER BY timestamp DESC',
        [`%${query}%`]
      );

      return rows.map((row) => ({
        id: row.id,
        conversationId: row.conversation_id,
        role: row.role as MessageRole,
        content: row.content,
        timestamp: row.timestamp,
      }));
    } catch (error: any) {
      throw new DatabaseError(`Failed to search messages: ${error.message}`);
    }
  }
}
