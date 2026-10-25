import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import type { Database } from '../lib/db/database';
import { syncOutbox } from '../lib/sync';
import { useDatabase } from './useDatabase';

interface SyncContextType {
  db: Database | null;
  waiting: number;
  lastSync: number;
  /** re-read counts from the local database */
  refresh: () => Promise<void>;
  /** push pending events now, then refresh */
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { db } = useDatabase();
  const [waiting, setWaiting] = useState(0);
  const [lastSync, setLastSync] = useState(0);

  const refresh = useCallback(async () => {
    if (!db) return;
    setWaiting((await db.getPendingOutbox()).length);
    setLastSync(await db.getLastSyncedAt());
  }, [db]);

  const syncNow = useCallback(async () => {
    if (!db) return;
    await refresh();
    await syncOutbox(db);
    await refresh();
  }, [db, refresh]);

  // sync on start, every 20 s, and whenever the app comes back to the foreground
  useEffect(() => {
    if (!db) return;
    syncNow();
    const timer = setInterval(syncNow, 20000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncNow();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [db, syncNow]);

  const value = useMemo(() => ({ db, waiting, lastSync, refresh, syncNow }), [db, waiting, lastSync, refresh, syncNow]);

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
