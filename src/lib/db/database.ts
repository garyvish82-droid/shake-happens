/**
 * Database service for Shake Happens
 * Handles SQLite initialization, CRUD operations, and outbox management
 */

import * as SQLite from 'expo-sqlite';
import { SCHEMA, type ShakeLog, type OutboxEntry } from './schema';
import { generateUUID } from '../uuid';

const DB_NAME = 'shake-happens.db';

export class Database {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  async init() {
    if (this.initialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.db.execAsync('PRAGMA journal_mode = WAL;');
      await this.createTables();
      await this.initSyncState();
      this.initialized = true;
      console.log('✅ Database initialized');
    } catch (error) {
      console.error('❌ Database init failed:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    for (const [name, sql] of Object.entries(SCHEMA)) {
      try {
        await this.db.execAsync(sql);
        console.log(`✅ Table ${name} created`);
      } catch (error) {
        console.error(`❌ Failed to create table ${name}:`, error);
      }
    }
  }

  private async initSyncState() {
    if (!this.db) throw new Error('Database not initialized');

    const lastSync = await this.db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_state WHERE key = ?',
      ['last_synced_at']
    );

    if (!lastSync) {
      await this.db.runAsync(
        'INSERT INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)',
        ['last_synced_at', '0', Date.now()]
      );
    }
  }

  // Shake logging (main use case)
  async logShake(shakeLog: Omit<ShakeLog, 'id' | 'created_at' | 'updated_at'>) {
    if (!this.db) throw new Error('Database not initialized');

    const id = generateUUID();
    const now = Date.now();

    const logEntry: ShakeLog = {
      ...shakeLog,
      id,
      created_at: now,
      updated_at: now,
    };

    try {
      // Insert into shake_logs
      await this.db.runAsync(
        `INSERT INTO shake_logs (
          id, camp_id, recipe_id, size, qty, is_alcoholic, 
          logged_by, assignment_id, logged_at, device_id, voided, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logEntry.id,
          logEntry.camp_id,
          logEntry.recipe_id,
          logEntry.size,
          logEntry.qty,
          logEntry.is_alcoholic,
          logEntry.logged_by ?? null,
          logEntry.assignment_id ?? null,
          logEntry.logged_at,
          logEntry.device_id ?? null,
          logEntry.voided,
          logEntry.created_at,
          logEntry.updated_at,
        ]
      );

      // Queue in outbox for sync
      await this.queueOutbox('shake_logs', 'INSERT', id, logEntry);

      return logEntry;
    } catch (error) {
      console.error('❌ Failed to log shake:', error);
      throw error;
    }
  }

  // Undo a logged shake (soft delete, synced through the outbox)
  async voidShake(id: string, campId: string) {
    if (!this.db) throw new Error('Database not initialized');

    const now = Date.now();
    await this.db.runAsync(
      'UPDATE shake_logs SET voided = 1, updated_at = ? WHERE id = ?',
      [now, id]
    );
    await this.queueOutbox('shake_logs', 'UPDATE', id, { id, camp_id: campId, voided: 1, updated_at: now });
  }

  // Outbox management (for offline sync)
  private async queueOutbox(
    tableName: string,
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    recordId: string,
    data: any
  ) {
    if (!this.db) throw new Error('Database not initialized');

    const outboxId = generateUUID();
    const now = Date.now();

    try {
      await this.db.runAsync(
        `INSERT INTO outbox (
          id, camp_id, table_name, operation, data, created_at, synced, retry_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          outboxId,
          data.camp_id || 'test-camp',
          tableName,
          operation,
          JSON.stringify(data),
          now,
          0,
          0,
        ]
      );

      console.log(`📤 Queued ${operation} in ${tableName}`);
    } catch (error) {
      console.error('❌ Failed to queue outbox:', error);
      throw error;
    }
  }

  // Get all pending outbox entries
  async getPendingOutbox() {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const entries = await this.db.getAllAsync<OutboxEntry>(
        'SELECT * FROM outbox WHERE synced = 0 ORDER BY created_at ASC'
      );
      return entries;
    } catch (error) {
      console.error('❌ Failed to get pending outbox:', error);
      return [];
    }
  }

  // Mark outbox entry as synced
  async markOutboxSynced(outboxId: string) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'UPDATE outbox SET synced = 1, synced_at = ? WHERE id = ?',
        [Date.now(), outboxId]
      );
    } catch (error) {
      console.error('❌ Failed to mark outbox synced:', error);
    }
  }

  // Get sync status
  async getLastSyncedAt(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getFirstAsync<{ value: string }>(
        'SELECT value FROM sync_state WHERE key = ?',
        ['last_synced_at']
      );
      return result ? parseInt(result.value, 10) : 0;
    } catch (error) {
      console.error('❌ Failed to get last synced time:', error);
      return 0;
    }
  }

  // Update last sync time
  async setLastSyncedAt(timestamp: number) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'UPDATE sync_state SET value = ?, updated_at = ? WHERE key = ?',
        [timestamp.toString(), Date.now(), 'last_synced_at']
      );
    } catch (error) {
      console.error('❌ Failed to update last synced time:', error);
    }
  }

  // Get today's shake count
  async getTodayShakeCount(campId: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const result = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM shake_logs 
         WHERE camp_id = ? AND voided = 0 AND logged_at >= ?`,
        [campId, startOfDay.getTime()]
      );

      return result?.count || 0;
    } catch (error) {
      console.error('❌ Failed to get today shake count:', error);
      return 0;
    }
  }

  // Get all shakes for a period
  async getShakes(campId: string, startTime: number, endTime: number) {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const shakes = await this.db.getAllAsync<ShakeLog>(
        `SELECT * FROM shake_logs 
         WHERE camp_id = ? AND logged_at BETWEEN ? AND ? AND voided = 0
         ORDER BY logged_at DESC`,
        [campId, startTime, endTime]
      );
      return shakes;
    } catch (error) {
      console.error('❌ Failed to get shakes:', error);
      return [];
    }
  }
}

// Singleton instance
let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = new Database();
    await dbInstance.init();
  }
  return dbInstance;
}
