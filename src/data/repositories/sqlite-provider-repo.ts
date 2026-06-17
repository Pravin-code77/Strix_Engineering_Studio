import { getDatabase } from '../database/sqlite-client';
import { ProviderConfig, ProviderType } from '../../core/types/chat';
import { IProviderRepository } from '../../domain/repositories/provider-repository.interface';
import { DatabaseError } from '../../core/errors/app-error';

export class SQLiteProviderRepository implements IProviderRepository {
  async getProviders(): Promise<ProviderConfig[]> {
    try {
      const db = await getDatabase();
      const rows = await db.getAllAsync<{
        id: string;
        provider_name: string;
        base_url: string;
        api_key: string | null;
        model: string;
      }>('SELECT * FROM providers');

      return rows.map((row) => ({
        id: row.id,
        providerName: row.provider_name as ProviderType,
        baseUrl: row.base_url,
        apiKey: row.api_key || '',
        model: row.model,
      }));
    } catch (error: any) {
      throw new DatabaseError(`Failed to load providers: ${error.message}`);
    }
  }

  async getProviderById(id: string): Promise<ProviderConfig | null> {
    try {
      const db = await getDatabase();
      const row = await db.getFirstAsync<{
        id: string;
        provider_name: string;
        base_url: string;
        api_key: string | null;
        model: string;
      }>('SELECT * FROM providers WHERE id = ?', [id]);

      if (!row) return null;

      return {
        id: row.id,
        providerName: row.provider_name as ProviderType,
        baseUrl: row.base_url,
        apiKey: row.api_key || '',
        model: row.model,
      };
    } catch (error: any) {
      throw new DatabaseError(`Failed to load provider config: ${error.message}`);
    }
  }

  async updateProviderConfig(config: ProviderConfig): Promise<void> {
    try {
      const db = await getDatabase();
      await db.runAsync(
        `INSERT OR REPLACE INTO providers (id, provider_name, base_url, api_key, model)
         VALUES (?, ?, ?, ?, ?);`,
        [config.id, config.providerName, config.baseUrl, config.apiKey, config.model]
      );
    } catch (error: any) {
      throw new DatabaseError(`Failed to save provider config: ${error.message}`);
    }
  }
}
