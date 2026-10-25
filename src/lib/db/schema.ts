/**
 * SQLite schema for Shake Happens
 * Mirrors Postgres schema from doc 04-data-model.md
 * All writes queue in outbox for sync when online
 */

export const SCHEMA = {
  shifts: `
    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      camp_id TEXT NOT NULL,
      shift_type TEXT NOT NULL,
      starts_at INTEGER NOT NULL,
      ends_at INTEGER NOT NULL,
      headcount INTEGER,
      required_skills TEXT,
      location TEXT,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `,

  assignments: `
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      camp_id TEXT NOT NULL,
      shift_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'assigned',
      confirmed_at INTEGER,
      checked_in_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(shift_id) REFERENCES shifts(id)
    )
  `,

  recipes: `
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      camp_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_alcoholic INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      sizes TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `,

  shake_logs: `
    CREATE TABLE IF NOT EXISTS shake_logs (
      id TEXT PRIMARY KEY,
      camp_id TEXT NOT NULL,
      recipe_id TEXT NOT NULL,
      size TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      is_alcoholic INTEGER NOT NULL,
      logged_by TEXT,
      assignment_id TEXT,
      logged_at INTEGER NOT NULL,
      device_id TEXT,
      voided INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(recipe_id) REFERENCES recipes(id)
    )
  `,

  members: `
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      camp_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      arrival_at INTEGER,
      departure_at INTEGER,
      skills TEXT,
      push_token TEXT,
      locale TEXT DEFAULT 'en',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `,

  outbox: `
    CREATE TABLE IF NOT EXISTS outbox (
      id TEXT PRIMARY KEY,
      camp_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      synced_at INTEGER,
      synced INTEGER NOT NULL DEFAULT 0,
      retry_count INTEGER NOT NULL DEFAULT 0
    )
  `,

  sync_state: `
    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `,
} as const;

export type TableName = keyof typeof SCHEMA;
export type ShakeLog = {
  id: string;
  camp_id: string;
  recipe_id: string;
  size: string;
  qty: number;
  is_alcoholic: 0 | 1;
  logged_by?: string;
  assignment_id?: string;
  logged_at: number;
  device_id?: string;
  voided: 0 | 1;
  created_at: number;
  updated_at: number;
};

export type OutboxEntry = {
  id: string;
  camp_id: string;
  table_name: TableName;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: string; // JSON stringified
  created_at: number;
  synced_at?: number;
  synced: 0 | 1;
  retry_count: number;
};
