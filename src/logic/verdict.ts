import type { Grade, TimeAdvice } from '../types.js';

/**
 * Verdict from the day's running windows: GO if there's a best window, CAUTION
 * if only good windows, SKIP if there's no runnable window today. This reflects
 * the whole-day hourly analysis — a window already requires acceptable heat AND
 * air — rather than a single snapshot.
 */
export function verdictFromTimes(times: TimeAdvice): Grade {
  if (times.kind !== 'windows') return 'SKIP';
  return times.windows.some((w) => w.quality === 'best') ? 'GO' : 'CAUTION';
}
