/**
 * Supabase project "shake-happens-v0". The publishable key is meant for apps:
 * the events table only allows inserts from it (row-level security).
 */
export const SUPABASE_URL = 'https://awzdjoioszbsouktowvo.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RsgZdxTuxz2lnUCX5F4oYA_QlmNjRKM';

/**
 * Camp data lives in the Google Sheet "Shake Happens — camp data (v0)",
 * published to the web as CSV, one link per tab.
 */
const SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3yuJL8-jdzK37oBpZ9Lln3Ps5iSiYL3QbdMBWMhzJWJNG4G5MuPs3vzTBPiYsHKmibI_PTA8dUn12/pub';

export const SHEET_URLS = {
  camp: `${SHEET_BASE}?gid=1543114536&single=true&output=csv`,
  members: `${SHEET_BASE}?gid=922122489&single=true&output=csv`,
  shifts: `${SHEET_BASE}?gid=1867404900&single=true&output=csv`,
  recipes: `${SHEET_BASE}?gid=2021925627&single=true&output=csv`,
} as const;

/** Local camp id used in the on-phone database */
export const CAMP_ID = 'camp';

/** MVP has a single drink size; stored in events.size */
export const DEFAULT_SIZE = 'standard';

/** How often the app re-reads the sheet while open */
export const SHEET_REFRESH_MS = 5 * 60 * 1000;
