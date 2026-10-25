/**
 * Sends the local outbox to the Supabase `events` table (insert-only event log).
 * Event ids are the local record ids, so a retry can never double-count
 * (the table is insert-only for the app key: a repeated id comes back as a duplicate).
 */

import type { Database } from './db/database';
import type { OutboxEntry } from './db/schema';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config';

type EventRow = {
  id: string;
  type: 'shake_log' | 'shake_void' | 'shift_confirm';
  device_id: string;
  logged_by: string | null;
  client_at: string;
  recipe_id?: string;
  size?: string;
  qty?: number;
  is_alcoholic?: boolean;
  assignment_id?: string | null;
  ref_id?: string;
  shift_id?: string;
};

export function toEvent(entry: OutboxEntry, deviceId: string): EventRow | null {
  const d = JSON.parse(entry.data);

  if (entry.table_name === 'shake_logs' && entry.operation === 'INSERT') {
    return {
      id: d.id,
      type: 'shake_log',
      device_id: deviceId,
      logged_by: d.logged_by ?? null,
      client_at: new Date(d.logged_at).toISOString(),
      recipe_id: d.recipe_id,
      size: d.size,
      qty: d.qty,
      is_alcoholic: !!d.is_alcoholic,
      assignment_id: d.assignment_id ?? null,
    };
  }

  if (entry.table_name === 'shake_logs' && entry.operation === 'UPDATE' && d.voided === 1) {
    return {
      id: entry.id,
      type: 'shake_void',
      device_id: deviceId,
      logged_by: null,
      client_at: new Date(d.updated_at).toISOString(),
      ref_id: d.id,
    };
  }

  if (d.kind === 'shift_confirm') {
    return {
      id: d.id,
      type: 'shift_confirm',
      device_id: deviceId,
      logged_by: d.logged_by,
      client_at: new Date(d.client_at).toISOString(),
      shift_id: d.shift_id,
    };
  }

  return null;
}

async function post(row: EventRow): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (res.ok) return true;

  const body = await res.text().catch(() => '');
  // 23505 = this id is already on the server (an earlier send got through): done
  if (res.status === 409 && body.includes('23505')) return true;

  console.warn('⚠️ Sync rejected', res.status, body);
  return false;
}

let running = false;

/** Returns how many entries were sent. Safe to call any time; offline just returns 0. */
export async function syncOutbox(db: Database): Promise<number> {
  if (running) return 0;
  running = true;

  try {
    const pending = await db.getPendingOutbox();
    if (pending.length === 0) return 0;

    const deviceId = await db.getDeviceId();
    let sent = 0;

    for (const entry of pending) {
      const row = toEvent(entry, deviceId);
      if (!row) {
        await db.markOutboxSynced(entry.id); // nothing the server understands
        continue;
      }
      let ok = false;
      try {
        ok = await post(row);
      } catch {
        break; // offline: stop, try again later
      }
      if (!ok) break;
      await db.markOutboxSynced(entry.id);
      sent += 1;
    }

    if (sent > 0) await db.setLastSyncedAt(Date.now());
    return sent;
  } finally {
    running = false;
  }
}
