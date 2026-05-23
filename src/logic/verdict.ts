import { THRESHOLDS } from '../config.js';
import type { Grade, TimeAdvice } from '../types.js';

const SEVERITY: Record<Grade, number> = { GO: 0, CAUTION: 1, SKIP: 2 };

/** Grade PM2.5: GO below `go`, CAUTION up to and including `caution`, else SKIP. */
export function gradePm25(pm25: number): Grade {
  if (pm25 < THRESHOLDS.pm25.go) return 'GO';
  if (pm25 <= THRESHOLDS.pm25.caution) return 'CAUTION';
  return 'SKIP';
}

/** Grade WBGT: GO below `go`, CAUTION up to and including `caution`, else SKIP. */
export function gradeWbgt(wbgtValue: number): Grade {
  if (wbgtValue < THRESHOLDS.wbgt.go) return 'GO';
  if (wbgtValue <= THRESHOLDS.wbgt.caution) return 'CAUTION';
  return 'SKIP';
}

/** Return the more severe of two grades. */
export function worseOf(a: Grade, b: Grade): Grade {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}

/** Final verdict: the worse of the PM2.5 and WBGT grades. */
export function verdict(pm25: number, wbgtValue: number): Grade {
  return worseOf(gradePm25(pm25), gradeWbgt(wbgtValue));
}

/**
 * Verdict from the day's running windows: GO if there's a best window, CAUTION
 * if only good windows, SKIP if there's no runnable window today. This reflects
 * the whole-day hourly analysis (a window already requires acceptable heat AND
 * air at that hour) rather than a single snapshot.
 */
export function verdictFromTimes(times: TimeAdvice): Grade {
  if (times.kind !== 'windows') return 'SKIP';
  return times.windows.some((w) => w.quality === 'best') ? 'GO' : 'CAUTION';
}
