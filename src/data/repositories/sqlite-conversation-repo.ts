import { getDatabase } from '../database/sqlite-client';
import { Conversation } from '../../core/types/chat';
import { IConversationRepository } from '../../domain/repositories/conversation-repository.interface';
import { DatabaseError } from '../../core/errors/app-error';

export class SQLiteConversationRepository implements IConversationRepository {
  async getConversations(): Promise<Conversation[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<{
        id: string;
        title: string;
        created_at: string;
        updated_at: string;
        provider_id: string | null;
      }>('SELECT * FROM conversations ORDER BY updated_at DESC');

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        providerId: row.provider_id || undefined,
      }));
    } catch (error: any) {
      throw new DatabaseError(`Failed to load conversations: ${error.message}`);
    }
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<{
        id: string;
        title: string;
        created_at: string;
        updated_at: string;
        provider_id: string | null;
      }>('SELECT * FROM conversations WHERE id = ?', [id]);

      if (!row) return null;

      return {
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        providerId: row.provider_id || undefined,
      };
    } catch (error: any) {
      throw new DatabaseError(`Failed to load conversation: ${error.message}`);
    }
  }

  async createConversation(id: string, title: string, providerId?: string): Promise<Conversation> {
    try {
      const db = await getDatabase();
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO conversations (id, title, created_at, updated_at, provider_id)
         VALUES (?, ?, ?, ?, ?);`,
        [id, title, now, now, providerId || null]
      );

      return {
        id,
        title,
        createdAt: now,
        updatedAt: now,
        providerId,
      };
    } catch (error: any) {
      throw new DatabaseError(`Failed to create conversation: ${error.message}`);
    }
  }

  async updateConversationTitle(id: string, title: string): Promise<void> {
    try {
      const db = await getDatabase();
      const now = new Date().toISOString();
      await db.runAsync(
        'UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?;',
        [title, now, id]
      );
    } catch (error: any) {
      throw new DatabaseError(`Failed to update conversation: ${error.message}`);
    }
  }

  async updateConversationProvider(id: string, providerId: string): Promise<void> {
    try {
      const db = await getDatabase();
      const now = new Date().toISOString();
      await db.runAsync(
        'UPDATE conversations SET provider_id = ?, updated_at = ? WHERE id = ?;',
        [providerId, now, id]
      );
    } catch (error: any) {
      throw new DatabaseError(`Failed to update conversation provider: ${error.message}`);
    }
  }

  async deleteConversation(id: string): Promise<void> {
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM conversations WHERE id = ?;', [id]);
    } catch (error: any) {
      throw new DatabaseError(`Failed to delete conversation: ${error.message}`);
    }
  }

  async searchConversations(query: string): Promise<Conversation[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<{
        id: string;
        title: string;
        created_at: string;
        updated_at: string;
        provider_id: string | null;
      }>(
        'SELECT * FROM conversations WHERE title LIKE ? ORDER BY updated_at DESC',
        [`%${query}%`]
      );

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        providerId: row.provider_id || undefined,
      }));
    } catch (error: any) {
      throw new DatabaseError(`Failed to search conversations: ${error.message}`);
    }
  }
}
