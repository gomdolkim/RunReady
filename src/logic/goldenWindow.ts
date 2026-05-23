import { GOLDEN } from '../config.js';
import type { GoldenWindow, WindowQuality } from '../types.js';
import { formatClock } from '../util/time.js';

export type Tier = WindowQuality | 'none';

export interface ClassifiedHour {
  hour: number;
  quality: Tier;
}

/**
 * Classify an hour into best / good / none from its WBGT and the day's air
 * quality (US AQI). Air is a daily gate (WAQI gives a daily value, not hourly).
 */
export function classifyHour(wbgtValue: number, aqi: number): Tier {
  if (wbgtValue <= GOLDEN.best.wbgt && aqi <= GOLDEN.best.aqi) return 'best';
  if (wbgtValue <= GOLDEN.good.wbgt && aqi <= GOLDEN.good.aqi) return 'good';
  return 'none';
}

/**
 * Collapse classified hours (sorted ascending) into windows: maximal runs of
 * consecutive hours sharing one non-none tier, in chronological order.
 */
export function buildWindows(classified: ClassifiedHour[]): GoldenWindow[] {
  const runs: GoldenWindow[] = [];
  let start: number | null = null;
  let prev: number | null = null;
  let tier: Tier = 'none';

  const flush = (lastHour: number): void => {
    if (start !== null && tier !== 'none') {
      runs.push({ start: formatClock(start), end: formatClock(lastHour + 1), quality: tier });
    }
    start = null;
  };

  for (const cur of classified) {
    if (cur.quality === 'none') {
      if (prev !== null) flush(prev);
      prev = null;
      continue;
    }
    const continues = start !== null && prev !== null && cur.hour === prev + 1 && cur.quality === tier;
    if (!continues) {
      if (prev !== null) flush(prev);
      start = cur.hour;
      tier = cur.quality;
    }
    prev = cur.hour;
  }
  if (prev !== null) flush(prev);

  return runs;
}
