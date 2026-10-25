import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { SHEET_REFRESH_MS, SHEET_URLS } from '../lib/config';
import { parseCampData, type CampData, type RawTabs } from '../lib/campData';
import { useSync } from './useSync';

type Status = 'loading' | 'ready' | 'offline';

interface CampDataContextType {
  data: CampData | null;
  status: Status;
  /** when the sheet was last read successfully (ms), 0 = never */
  fetchedAt: number;
  /** current time, ticks every 30 s so "shift in 30 min" stays right */
  now: Date;
  refresh: () => Promise<void>;
  memberId: string | null;
  setMemberId: (id: string) => Promise<void>;
}

const CampDataContext = createContext<CampDataContextType | undefined>(undefined);

const CACHE_KEY = 'camp_data_raw';
const CACHE_AT_KEY = 'camp_data_at';
const MEMBER_KEY = 'member_id';

async function fetchTab(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (text.trimStart().startsWith('<')) throw new Error('not a CSV (page returned HTML)');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export function CampDataProvider({ children }: { children: React.ReactNode }) {
  const { db } = useSync();
  const [data, setData] = useState<CampData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [fetchedAt, setFetchedAt] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [memberId, setMemberIdState] = useState<string | null>(null);

  // saved copy first, so the app is useful with no signal
  useEffect(() => {
    if (!db) return;
    (async () => {
      const cached = await db.getValue(CACHE_KEY);
      if (cached) {
        try {
          setData(parseCampData(JSON.parse(cached) as RawTabs));
          setFetchedAt(Number(await db.getValue(CACHE_AT_KEY)) || 0);
          setStatus('offline'); // until the first successful fetch
        } catch {
          // damaged cache: ignore, fetch below replaces it
        }
      }
      setMemberIdState(await db.getValue(MEMBER_KEY));
    })();
  }, [db]);

  const refresh = useCallback(async () => {
    if (!db) return;
    try {
      const [camp, members, shifts, recipes] = await Promise.all([
        fetchTab(SHEET_URLS.camp),
        fetchTab(SHEET_URLS.members),
        fetchTab(SHEET_URLS.shifts),
        fetchTab(SHEET_URLS.recipes),
      ]);
      const raw: RawTabs = { camp, members, shifts, recipes };
      setData(parseCampData(raw));
      const at = Date.now();
      setFetchedAt(at);
      setStatus('ready');
      await db.setValue(CACHE_KEY, JSON.stringify(raw));
      await db.setValue(CACHE_AT_KEY, String(at));
    } catch (error) {
      console.warn('⚠️ Camp data not refreshed:', String(error));
      setStatus('offline');
    }
  }, [db]);

  // read the sheet on start, every few minutes, and when the app comes back
  useEffect(() => {
    if (!db) return;
    refresh();
    const timer = setInterval(refresh, SHEET_REFRESH_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [db, refresh]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const setMemberId = useCallback(
    async (id: string) => {
      setMemberIdState(id);
      if (db) await db.setValue(MEMBER_KEY, id);
    },
    [db]
  );

  const value = useMemo(
    () => ({ data, status, fetchedAt, now, refresh, memberId, setMemberId }),
    [data, status, fetchedAt, now, refresh, memberId, setMemberId]
  );

  return <CampDataContext.Provider value={value}>{children}</CampDataContext.Provider>;
}

export function useCampData() {
  const ctx = useContext(CampDataContext);
  if (!ctx) throw new Error('useCampData must be used within CampDataProvider');
  return ctx;
}
