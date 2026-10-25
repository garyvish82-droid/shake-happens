/**
 * Camp data from the Google Sheet (published as CSV): parsing and the
 * "what should the screen show right now" helpers. Pure functions, no I/O.
 */

export type Camp = {
  name: string;
  eventStart: string;
  eventEnd: string;
  pinLandmark: string;
  /** camp pin from the sheet; null when missing or not a valid coordinate */
  pin: { lat: number; lng: number } | null;
  reminderMinutes: number;
};

export type Member = { id: string; name: string; role: string; active: boolean };

export type Shift = {
  id: string;
  date: string;
  start: string;
  end: string;
  type: string;
  location: string;
  memberIds: string[];
  isPeak: boolean;
  notes: string;
  startAt: Date;
  endAt: Date;
};

export type Recipe = { id: string; name: string; alcoholic: boolean; sortOrder: number };

export type CampData = { camp: Camp; members: Member[]; shifts: Shift[]; recipes: Recipe[] };

export type RawTabs = { camp: string; members: string; shifts: string; recipes: string };

// ---------- CSV ----------

/** Minimal RFC 4180 parser: quotes, escaped quotes, commas and newlines inside quotes */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o: Record<string, string> = {};
    header.forEach((h, i) => {
      o[h] = (r[i] ?? '').trim();
    });
    return o;
  });
}

const isTrue = (v: string | undefined) => (v ?? '').trim().toUpperCase() === 'TRUE';

// ---------- tabs ----------

function parsePin(latRaw?: string, lngRaw?: string): Camp['pin'] {
  const lat = Number((latRaw ?? '').replace(',', '.'));
  const lng = Number((lngRaw ?? '').replace(',', '.'));
  if (!latRaw || !lngRaw || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function parseCamp(text: string): Camp {
  const kv: Record<string, string> = {};
  for (const r of parseCsv(text).slice(1)) {
    if (r[0]) kv[r[0].trim()] = (r[1] ?? '').trim();
  }
  return {
    name: kv.name || 'Camp',
    eventStart: normalizeDate(kv.event_start || '') ?? '',
    eventEnd: normalizeDate(kv.event_end || '') ?? '',
    pinLandmark: kv.pin_landmark || '',
    pin: parsePin(kv.pin_lat, kv.pin_lng),
    reminderMinutes: Number(kv.reminder_minutes) || 30,
  };
}

function parseMembers(text: string): Member[] {
  return toObjects(text)
    .filter((o) => o.id)
    .map((o) => ({ id: o.id, name: o.display_name || o.id, role: o.role || 'member', active: isTrue(o.active) }));
}

/**
 * Sheets may turn "2026-11-02" into "2/11/26" (day/month/year in an Israeli sheet).
 * Accept both and always return "YYYY-MM-DD".
 */
export function normalizeDate(raw: string): string | null {
  const v = raw.trim();
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const dmy = /^(\d{1,2})[/.](\d{1,2})[/.](\d{2}|\d{4})$/.exec(v);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${year}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  return null;
}

function at(date: string, time: string): Date | null {
  const day = normalizeDate(date);
  const d = day ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(day) : null;
  const t = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(time.trim());
  if (!d || !t) return null;
  return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
}

const HIDDEN_STATUS = ['draft', 'hidden', 'cancelled', 'canceled'];

/** Rows with a valid date and time, except drafts and cancelled; a shift that ends "before" it starts runs past midnight */
function parseShifts(text: string): Shift[] {
  const out: Shift[] = [];
  for (const o of toObjects(text)) {
    if (HIDDEN_STATUS.includes(o.status.toLowerCase())) continue;
    const startAt = at(o.date, o.start);
    const endAt = at(o.date, o.end);
    if (!startAt || !endAt) continue;
    if (endAt <= startAt) endAt.setDate(endAt.getDate() + 1);
    out.push({
      id: o.shift_id,
      date: normalizeDate(o.date) ?? o.date,
      start: o.start,
      end: o.end,
      type: o.type,
      location: o.location,
      memberIds: [o.member_1, o.member_2, o.member_3, o.member_4].filter(Boolean),
      isPeak: isTrue(o.is_peak),
      notes: o.notes,
      startAt,
      endAt,
    });
  }
  return out.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

function parseRecipes(text: string): Recipe[] {
  return toObjects(text)
    .filter((o) => o.id && isTrue(o.active))
    .map((o) => ({ id: o.id, name: o.name || o.id, alcoholic: isTrue(o.alcoholic), sortOrder: Number(o.sort_order) || 0 }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function parseCampData(raw: RawTabs): CampData {
  return {
    camp: parseCamp(raw.camp),
    members: parseMembers(raw.members),
    shifts: parseShifts(raw.shifts),
    recipes: parseRecipes(raw.recipes),
  };
}

// ---------- what to show ----------

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const dowOf = (date: string) => {
  const d = at(date, '00:00');
  return d ? DOW[d.getDay()] : '';
};
export const dayNumOf = (date: string) => String(Number(date.slice(8, 10)));
export const prettyDate = (d: Date) => `${DOW[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}`;

export function memberName(members: Member[], id: string) {
  return members.find((m) => m.id === id)?.name ?? id;
}

export function crewNames(members: Member[], ids: string[]) {
  return ids.map((id) => memberName(members, id)).join(' & ');
}

export const titleCase = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Distinct dates that have published shifts */
export function shiftDates(shifts: Shift[]) {
  return Array.from(new Set(shifts.map((s) => s.date))).sort();
}

export function todayKey(now: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/** Which day tab to open first: today, else the next day with shifts, else the last one */
export function defaultDate(dates: string[], now: Date) {
  const t = todayKey(now);
  return dates.find((d) => d >= t) ?? dates[dates.length - 1] ?? null;
}

export type NextShift = { shift: Shift; state: 'now' | 'upcoming' };

/** The shift this person is on right now, or their next one */
export function nextShiftFor(shifts: Shift[], memberId: string | null, now: Date): NextShift | null {
  if (!memberId) return null;
  const mine = shifts.filter((s) => s.memberIds.includes(memberId) && s.endAt > now);
  const s = mine[0];
  if (!s) return null;
  return { shift: s, state: s.startAt <= now ? 'now' : 'upcoming' };
}

/** The bar shift running right now */
export function barNow(shifts: Shift[], now: Date): Shift | null {
  const isBar = (s: Shift) => s.type.toLowerCase() === 'bar' || s.location.toLowerCase() === 'bar';
  return shifts.find((s) => isBar(s) && s.startAt <= now && now < s.endAt) ?? null;
}

/** "Day 3" while the event runs; otherwise when it starts or that it ended. Skips the camp name when it is just the app name. */
export function eventLabel(camp: Camp, now: Date, appName = 'Shake Happens'): string {
  const name = camp.name && camp.name.toLowerCase() !== appName.toLowerCase() ? camp.name : '';
  const start = at(camp.eventStart, '00:00');
  const end = at(camp.eventEnd, '23:59');
  let phase = '';
  if (start && end) {
    if (now < start) {
      const days = Math.ceil((start.getTime() - now.getTime()) / 86400000);
      phase = `starts in ${days} ${days === 1 ? 'day' : 'days'}`;
    } else if (now > end) {
      phase = 'event ended';
    } else {
      phase = `Day ${Math.floor((now.getTime() - start.getTime()) / 86400000) + 1}`;
    }
  }
  return [name, phase].filter(Boolean).join(' · ') || appName;
}

/** Headline of the shift card: minutes away inside the reminder window, otherwise the day */
export function shiftHeadline(n: NextShift, now: Date, reminderMinutes: number) {
  if (n.state === 'now') return `On shift now · until ${n.shift.end}`;
  const mins = Math.round((n.shift.startAt.getTime() - now.getTime()) / 60000);
  if (mins <= reminderMinutes) return `Your shift in ${Math.max(mins, 1)} min`;
  if (todayKey(n.shift.startAt) === todayKey(now)) return `Your next shift · today`;
  return `Your next shift · ${prettyDate(n.shift.startAt)}`;
}

// ---------- walking to a point ----------

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Straight-line distance in metres (haversine) */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Compass bearing from a to b, 0-359 (0 = north) */
export function bearingDegrees(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export const compassWord = (deg: number) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];

/** "340 M" under a kilometre, "1.2 KM" above */
export function formatDistance(m: number) {
  return m < 1000 ? `${Math.max(1, Math.round(m))} M` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} KM`;
}

/** Walking minutes at about 5 km/h */
export const walkMinutes = (m: number) => Math.max(1, Math.round(m / 80));

/** "just now", "5 min ago", "3 h ago", "2 d ago" */
export function formatAgo(ts: number, now = Date.now()) {
  const m = Math.max(0, Math.round((now - ts) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 60 * 24) return `${Math.floor(m / 60)} h ago`;
  return `${Math.floor(m / 1440)} d ago`;
}

// ---------- name search (onboarding) ----------

/** lower case, no accents, single spaces */
export function normalizeName(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function editDistance(a: string, b: string) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Every typed word must start a word of the name ("itamar bar" finds "Itamar Bar Oz") */
export function nameMatches(name: string, query: string) {
  const words = normalizeName(name).split(' ');
  const typed = normalizeName(query).split(' ').filter(Boolean);
  return typed.every((t) => words.some((w) => w.startsWith(t)));
}

/** "Did you mean": a typed word is within 1-2 letters of the start of a name word */
export function nameCloseTo(name: string, query: string) {
  const words = normalizeName(name).split(' ');
  const typed = normalizeName(query).split(' ').filter(Boolean);
  if (typed.length === 0) return false;
  return typed.every((t) => {
    const allowed = t.length >= 5 ? 2 : t.length >= 3 ? 1 : 0;
    return words.some((w) => editDistance(t, w.slice(0, t.length)) <= allowed || editDistance(t, w) <= allowed);
  });
}
