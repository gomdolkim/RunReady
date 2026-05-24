import type { HourlyWeather } from '../types.js';
import { bangkokDateKey, bangkokHour } from '../util/time.js';

/** Precipitation probability (%) at or above which we warn about rain. */
const RAIN_THRESHOLD = 50;

/**
 * Build a Korean rain hint for today's hours within `[lo, hi]` (Bangkok local),
 * or null if none reach the threshold. Reports the first–last wet hour range.
 */
export function rainHint(hourly: HourlyWeather[], band: readonly [number, number]): string | null {
  const sorted = [...hourly].sort((a, b) => a.dt - b.dt);
  const first = sorted[0];
  if (!first) return null;

  const today = bangkokDateKey(first.dt);
  const [lo, hi] = band;
  const wet: number[] = [];
  for (const h of sorted) {
    if (bangkokDateKey(h.dt) !== today) continue;
    const clock = bangkokHour(h.dt);
    if (clock < lo || clock > hi) continue;
    if ((h.precipProb ?? 0) >= RAIN_THRESHOLD) wet.push(clock);
  }
  if (wet.length === 0) return null;

  const start = wet[0]!;
  const end = wet[wet.length - 1]!;
  const range = start === end ? `${start}시` : `${start}–${end}시`;
  return `🌧️ ${range} 소나기 가능 — 우산 챙겨요`;
}
