import { THRESHOLDS } from '../config.js';
import type { Grade } from '../types.js';

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
