import { TIMEZONE } from '../config.js';

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

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
  const dow = new Date(`${p.year}-${p.month}-${p.day}T00:00:00Z`).getUTCDay();
  return `${p.year}.${p.month}.${p.day} (${KO_WEEKDAYS[dow]})`;
}

/** Format an integer hour as a zero-padded "HH:00" clock string. */
export function formatClock(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}
