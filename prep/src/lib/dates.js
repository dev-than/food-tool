// All dates in the sheet are plain 'YYYY-MM-DD' strings with no time or zone.
// We deliberately avoid toISOString() (which is UTC) and new Date('YYYY-MM-DD')
// (also parsed as UTC) — both cause off-by-one-day bugs in US timezones during
// evening hours. Everything here builds and reads dates from LOCAL components.

/** Local YYYY-MM-DD for a Date (defaults to now). */
export function isoLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse 'YYYY-MM-DD' into a LOCAL Date (midnight local), or null. */
export function parseLocal(s) {
  if (!s) return null;
  const parts = String(s).split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

export const todayIso = () => isoLocal(new Date());

export function addDaysIso(iso, n) {
  const d = parseLocal(iso) || new Date();
  d.setDate(d.getDate() + n);
  return isoLocal(d);
}

export const tomorrowIso = () => addDaysIso(todayIso(), 1);

/** Build an array of n consecutive YYYY-MM-DD starting at startIso. */
export function dateRange(startIso, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(addDaysIso(startIso, i));
  return out;
}

/** Whole-day difference: dateIso - todayIso. Negative = past, 0 = today. */
export function daysFromToday(dateIso) {
  const a = parseLocal(dateIso);
  const b = parseLocal(todayIso());
  if (!a || !b) return null;
  return Math.round((a - b) / 86400000);
}

/** e.g. { weekday: 'Mon', month: 'Aug', day: '3', dayNum: 3 } */
export function parts(dateIso) {
  const d = parseLocal(dateIso);
  if (!d) return null;
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
    month: d.toLocaleDateString(undefined, { month: 'short' }),
    day: String(d.getDate()),
    dayNum: d.getDate(),
  };
}

/** Human relative label: Today, Tomorrow, In 3 days, 5 days ago, etc. */
export function relativeLabel(dateIso) {
  const n = daysFromToday(dateIso);
  if (n === null) return '';
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n > 1) return `In ${n} days`;
  return `${Math.abs(n)} days ago`;
}
