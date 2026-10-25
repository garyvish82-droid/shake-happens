/**
 * Camp data from the Google Sheet (published as CSV): parsing and the
 * "what should the screen show right now" helpers. Pure functions, no I/O.
 */

export type Camp = {
  name: string;
  eventStart: string;
  eventEnd: string;
  pinLandmark: string;
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

function parseCamp(text: string): Camp {
  const kv: Record<string, string> = {};
  for (const r of parseCsv(text).slice(1)) {
    if (r[0]) kv[r[0].trim()] = (r[1] ?? '').trim();
  }
  return {
    name: kv.name || 'Camp',
    eventStart: kv.event_start || '',
    eventEnd: kv.event_end || '',
    pinLandmark: kv.pin_landmark || '',
    reminderMinutes: Number(kv.reminder_minutes) || 30,
  };
}

function parseMembers(text: string): Member[] {
  return toObjects(text)
    .filter((o) => o.id)
    .map((o) => ({ id: o.id, name: o.display_name || o.id, role: o.role || 'member', active: isTrue(o.active) }));
}

function at(date: string, time: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;
  return new Date(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
}

/** Only published rows with a valid date and time; a shift that ends "before" it starts runs past midnight */
function parseShifts(text: string): Shift[] {
  const out: Shift[] = [];
  for (const o of toObjects(text)) {
    if (o.status.toLowerCase() !== 'published') continue;
    const startAt = at(o.date, o.start);
    const endAt = at(o.date, o.end);
    if (!startAt || !endAt) continue;
    if (endAt <= startAt) endAt.setDate(endAt.getDate() + 1);
    out.push({
      id: o.shift_id,
      date: o.date,
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
  return shifts.find((s) => s.type === 'bar' && s.startAt <= now && now < s.endAt) ?? null;
}

/** "Day 3" while the event runs; otherwise when it starts or that it ended */
export function eventLabel(camp: Camp, now: Date): string {
  const start = at(camp.eventStart, '00:00');
  const end = at(camp.eventEnd, '23:59');
  if (!start || !end) return camp.name;
  if (now < start) {
    const days = Math.ceil((start.getTime() - now.getTime()) / 86400000);
    return `${camp.name} · starts in ${days} ${days === 1 ? 'day' : 'days'}`;
  }
  if (now > end) return `${camp.name} · event ended`;
  const day = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  return `${camp.name} · Day ${day}`;
}

/** Headline of the shift card: minutes away inside the reminder window, otherwise the day */
export function shiftHeadline(n: NextShift, now: Date, reminderMinutes: number) {
  if (n.state === 'now') return `On shift now · until ${n.shift.end}`;
  const mins = Math.round((n.shift.startAt.getTime() - now.getTime()) / 60000);
  if (mins <= reminderMinutes) return `Your shift in ${Math.max(mins, 1)} min`;
  if (todayKey(n.shift.startAt) === todayKey(now)) return `Your next shift · today`;
  return `Your next shift · ${prettyDate(n.shift.startAt)}`;
}
