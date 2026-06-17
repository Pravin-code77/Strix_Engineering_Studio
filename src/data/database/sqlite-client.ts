import * as SQLite from 'expo-sqlite';
import { DEFAULT_PROVIDERS } from '../../core/constants';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function initializeDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('antigravity.db');
      await db.execAsync('PRAGMA foreign_keys = ON;');
      dbInstance = db;

      // Run migrations manual versioning
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY NOT NULL,
          version INTEGER NOT NULL
        );
        INSERT OR IGNORE INTO migrations (id, version) VALUES (1, 0);
      `);

      const result = await db.getFirstAsync<{ version: number }>(
        'SELECT version FROM migrations WHERE id = 1'
      );
      let currentDbVersion = result?.version ?? 0;

      if (currentDbVersion < 1) {
        // Table: providers
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS providers (
            id TEXT PRIMARY KEY NOT NULL,
            provider_name TEXT NOT NULL,
            base_url TEXT NOT NULL,
            api_key TEXT,
            model TEXT NOT NULL
          );
        `);

        // Table: conversations
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY NOT NULL,
            title TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            provider_id TEXT,
            FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE SET NULL
          );
        `);

        // Table: messages
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY NOT NULL,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
          );
        `);

        // Indexing for search and joins performance
        await db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
          CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
        `);

        // Prepopulate default providers (checking environment variables)
        const providers = Object.entries(DEFAULT_PROVIDERS);
        for (const [key, value] of providers) {
          let envKey = '';
          if (key === 'gemini') {
            envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
          } else if (key === 'openai') {
            envKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
          } else if (key === 'openrouter') {
            envKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
          }

          await db.runAsync(
            `INSERT OR IGNORE INTO providers (id, provider_name, base_url, api_key, model) 
             VALUES (?, ?, ?, ?, ?);`,
            [key, value.providerName, value.baseUrl, envKey, value.model]
          );
        }

        // Update migrations table to version 1
        await db.runAsync('UPDATE migrations SET version = 1 WHERE id = 1');
      }

      // Migration to version 2: Fix Gemini base URL & retroactively seed keys
      if (currentDbVersion < 2) {
        await db.execAsync(`
          UPDATE providers 
          SET base_url = 'https://generativelanguage.googleapis.com/v1beta' 
          WHERE id = 'gemini' AND base_url = 'https://generativetext.googleapis.com/v1beta';
        `);

        // Seed Gemini API key if empty
        const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (geminiKey) {
          await db.runAsync(
            `UPDATE providers SET api_key = ? WHERE id = 'gemini' AND (api_key = '' OR api_key IS NULL);`,
            [geminiKey]
          );
        }

        // Seed OpenAI API key if empty
        const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
        if (openaiKey) {
          await db.runAsync(
            `UPDATE providers SET api_key = ? WHERE id = 'openai' AND (api_key = '' OR api_key IS NULL);`,
            [openaiKey]
          );
        }

        // Seed OpenRouter API key if empty
        const openrouterKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
        if (openrouterKey) {
          await db.runAsync(
            `UPDATE providers SET api_key = ? WHERE id = 'openrouter' AND (api_key = '' OR api_key IS NULL);`,
            [openrouterKey]
          );
        }

        await db.runAsync('UPDATE migrations SET version = 2 WHERE id = 1');
      }

      // Migration to version 3: Update Gemini default model and guarantee provider_id column exists
      if (currentDbVersion < 3) {
        try {
          await db.execAsync('ALTER TABLE conversations ADD COLUMN provider_id TEXT;');
        } catch {
          // Ignore error if column already exists
        }

        await db.execAsync(`
          UPDATE providers 
          SET model = 'gemini-2.5-flash' 
          WHERE id = 'gemini' AND model = 'gemini-1.5-flash';
        `);

        await db.runAsync('UPDATE migrations SET version = 3 WHERE id = 1');
      }

      // Migration to version 4: Force re-seed OpenAI and OpenRouter keys from corrected env vars
      if (currentDbVersion < 4) {
        const openaiKey =
          process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
        if (openaiKey) {
          await db.runAsync(
            `UPDATE providers SET api_key = ? WHERE id = 'openai';`,
            [openaiKey]
          );
        }

        const openrouterKey =
          process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || '';
        if (openrouterKey) {
          await db.runAsync(
            `UPDATE providers SET api_key = ? WHERE id = 'openrouter';`,
            [openrouterKey]
          );
        }

        await db.runAsync('UPDATE migrations SET version = 4 WHERE id = 1');
      }

      // Migration to version 5: Update default OpenRouter model to a working free model slug
      if (currentDbVersion < 5) {
        await db.execAsync(`
          UPDATE providers 
          SET model = 'meta-llama/llama-3.3-70b-instruct:free' 
          WHERE id = 'openrouter' AND model = 'meta-llama/llama-3-8b-instruct:free';
        `);
        await db.runAsync('UPDATE migrations SET version = 5 WHERE id = 1');
      }

      return db;
    })();
  }
  return initPromise.then(() => {});
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!initPromise) {
    initializeDatabase();
  }
  return initPromise!;
}
