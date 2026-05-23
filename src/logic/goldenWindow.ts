import { GOLDEN } from '../config.js';
import type {
  GoldenWindow,
  HourlyPm25,
  HourlyWeather,
  TimeAdvice,
  WindowQuality,
} from '../types.js';
import { bangkokDateKey, bangkokHour, formatClock } from '../util/time.js';
import { wbgt } from './wbgt.js';

type Tier = WindowQuality | 'none';

interface ClassifiedHour {
  hour: number;
  quality: Tier;
}

/** Classify a single hour into best / good / none from its WBGT and PM2.5. */
export function classifyHour(wbgtValue: number, pm25: number): Tier {
  if (wbgtValue <= GOLDEN.best.wbgt && pm25 <= GOLDEN.best.pm25) return 'best';
  if (wbgtValue <= GOLDEN.good.wbgt && pm25 <= GOLDEN.good.pm25) return 'good';
  return 'none';
}

function inBands(hour: number): boolean {
  const [dawnStart, dawnEnd] = GOLDEN.bands.dawn;
  const [eveStart, eveEnd] = GOLDEN.bands.evening;
  return (hour >= dawnStart && hour <= dawnEnd) || (hour >= eveStart && hour <= eveEnd);
}

/**
 * Collapse classified hours (sorted ascending) into windows: maximal runs of
 * consecutive hours sharing one non-none tier. Caps at two windows, preferring
 * best, and returns them in chronological order.
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

  const rank = (q: WindowQuality): number => (q === 'best' ? 0 : 1);
  return [...runs]
    .sort((a, b) => rank(a.quality) - rank(b.quality) || a.start.localeCompare(b.start))
    .slice(0, 2)
    .sort((a, b) => a.start.localeCompare(b.start));
}

interface BandHour {
  hour: number;
  dt: number;
  temp: number;
  humidity: number;
}

/** Today's dawn/evening band hours (Bangkok date of the earliest sample). */
function todayBandHours(hourlyWeather: HourlyWeather[]): BandHour[] {
  const sorted = [...hourlyWeather].sort((a, b) => a.dt - b.dt);
  const first = sorted[0];
  if (!first) return [];

  const today = bangkokDateKey(first.dt);
  const out: BandHour[] = [];
  for (const h of sorted) {
    if (bangkokDateKey(h.dt) !== today) continue;
    const clock = bangkokHour(h.dt);
    if (!inBands(clock)) continue;
    out.push({ hour: clock, dt: h.dt, temp: h.temp, humidity: h.humidity });
  }
  return out;
}

/**
 * Find the best running windows for today. Merges hourly weather with hourly
 * PM2.5, restricts to the dawn/evening bands, and ignores hours lacking a
 * PM2.5 reading.
 */
export function goldenWindows(
  hourlyWeather: HourlyWeather[],
  hourlyPm25: HourlyPm25[],
): GoldenWindow[] {
  const pm25ByDt = new Map(hourlyPm25.map((h) => [h.dt, h.pm25]));
  const classified: ClassifiedHour[] = [];
  for (const h of todayBandHours(hourlyWeather)) {
    const pm25 = pm25ByDt.get(h.dt);
    if (pm25 === undefined) continue;
    classified.push({ hour: h.hour, quality: classifyHour(wbgt(h.temp, h.humidity), pm25) });
  }
  return buildWindows(classified);
}

/** The coolest (lowest WBGT) band hour today, or null if none. Ties go earliest. */
export function coolestBandHour(hourlyWeather: HourlyWeather[]): number | null {
  let best: { hour: number; wbgt: number } | null = null;
  for (const h of todayBandHours(hourlyWeather)) {
    const value = wbgt(h.temp, h.humidity);
    if (best === null || value < best.wbgt) best = { hour: h.hour, wbgt: value };
  }
  return best?.hour ?? null;
}

/**
 * Time-of-day advice: golden windows when they exist; otherwise the coolest
 * band hour as a best-effort "least bad" suggestion; otherwise none.
 */
export function recommendTimes(
  hourlyWeather: HourlyWeather[],
  hourlyPm25: HourlyPm25[],
): TimeAdvice {
  const windows = goldenWindows(hourlyWeather, hourlyPm25);
  if (windows.length > 0) return { kind: 'windows', windows };

  const coolest = coolestBandHour(hourlyWeather);
  if (coolest !== null) {
    return { kind: 'coolest', start: formatClock(coolest), end: formatClock(coolest + 1) };
  }
  return { kind: 'none' };
}
