import { TIMEZONE } from '../config.js';

// Hardcoded name tables keep date labels deterministic across ICU versions —
// Intl short forms vary by platform (e.g. Thai weekday "อา." vs "อาทิตย์").
const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const TH_WEEKDAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'] as const;
const TH_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
] as const;

/** Day of week (0=Sun..6=Sat) for the Bangkok calendar date in `p`. */
function dayOfWeek(p: Record<string, string>): number {
  return new Date(`${p.year}-${p.month}-${p.day}T00:00:00Z`).getUTCDay();
}

function parts(dtSeconds: number): Record<string, string> {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(dtSeconds * 1000)) {
    out[p.type] = p.value;
  }
  return out;
}

/** Local clock hour (0–23) in Bangkok for a UNIX-seconds timestamp. */
export function bangkokHour(dtSeconds: number): number {
  // en-CA hour "2-digit" hour12:false yields "00".."23"; "24" can appear at midnight.
  const hour = Number(parts(dtSeconds).hour);
  return hour % 24;
}

/** Local date as YYYY-MM-DD in Bangkok. */
export function bangkokDateKey(dtSeconds: number): string {
  const p = parts(dtSeconds);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Korean date label, e.g. "2026.05.24 (일)". */
export function bangkokDateLabel(dtSeconds: number): string {
  const p = parts(dtSeconds);
  return `${p.year}.${p.month}.${p.day} (${KO_WEEKDAYS[dayOfWeek(p)]!})`;
}

/** English date label, e.g. "May 24, 2026 (Sun)". */
export function enDateLabel(dtSeconds: number): string {
  const p = parts(dtSeconds);
  const month = EN_MONTHS[Number(p.month) - 1]!;
  return `${month} ${Number(p.day)}, ${p.year} (${EN_WEEKDAYS[dayOfWeek(p)]!})`;
}

/** Thai date label with Buddhist year (CE + 543), e.g. "24 พ.ค. 2569 (อา.)". */
export function thDateLabel(dtSeconds: number): string {
  const p = parts(dtSeconds);
  const month = TH_MONTHS[Number(p.month) - 1]!;
  const year = Number(p.year) + 543;
  return `${Number(p.day)} ${month} ${year} (${TH_WEEKDAYS[dayOfWeek(p)]!})`;
}

/** Format an integer hour as a zero-padded "HH:00" clock string. */
export function formatClock(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/** Day of the year (1–366) for the Bangkok calendar date. */
export function dayOfYear(dtSeconds: number): number {
  const p = parts(dtSeconds);
  const year = Number(p.year);
  const start = Date.UTC(year, 0, 1);
  const today = Date.UTC(year, Number(p.month) - 1, Number(p.day));
  return Math.round((today - start) / 86_400_000) + 1;
}

/**
 * Pick from a pool deterministically by day of year, so it cycles through the
 * whole pool (no repeats until exhausted). `offset` lets independent pools vary.
 */
export function pickByDay<T>(pool: readonly T[], dtSeconds: number, offset = 0): T {
  return pool[(dayOfYear(dtSeconds) + offset) % pool.length]!;
}
