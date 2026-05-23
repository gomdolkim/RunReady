import type { BandReport, Grade, HourlyWeather, Outcome } from '../types.js';
import { bangkokDateKey, bangkokHour } from '../util/time.js';
import { buildWindows, classifyHour } from './goldenWindow.js';
import { wbgt } from './wbgt.js';

interface BandHour {
  hour: number;
  temp: number;
  humidity: number;
  uvi: number;
}

/** Today's hours that fall within `[lo, hi]` (Bangkok local), for the band. */
function todayBandHours(hourly: HourlyWeather[], band: readonly [number, number]): BandHour[] {
  const sorted = [...hourly].sort((a, b) => a.dt - b.dt);
  const first = sorted[0];
  if (!first) return [];

  const today = bangkokDateKey(first.dt);
  const [lo, hi] = band;
  const out: BandHour[] = [];
  for (const h of sorted) {
    if (bangkokDateKey(h.dt) !== today) continue;
    const clock = bangkokHour(h.dt);
    if (clock < lo || clock > hi) continue;
    out.push({ hour: clock, temp: h.temp, humidity: h.humidity, uvi: h.uvi });
  }
  return out;
}

const UNAVAILABLE: BandReport = {
  available: false,
  grade: 'SKIP',
  window: null,
  coolestHour: null,
  wbgt: 0,
  temp: 0,
  uvi: 0,
};

/**
 * Analyse one time band (dawn or evening): grade it by per-hour heat + the
 * day's air, find the best window, and report conditions at the coolest hour
 * (the best moment to run within the band).
 */
export function analyzeBand(
  hourly: HourlyWeather[],
  band: readonly [number, number],
  aqi: number,
): BandReport {
  const hours = todayBandHours(hourly, band);
  if (hours.length === 0) return UNAVAILABLE;

  const windows = buildWindows(
    hours.map((h) => ({ hour: h.hour, quality: classifyHour(wbgt(h.temp, h.humidity), aqi) })),
  );
  const window =
    windows.find((w) => w.quality === 'best') ?? windows.find((w) => w.quality === 'good') ?? null;
  const grade: Grade = windows.some((w) => w.quality === 'best')
    ? 'GO'
    : windows.some((w) => w.quality === 'good')
      ? 'CAUTION'
      : 'SKIP';

  let coolest = hours[0]!;
  let coolestWbgt = wbgt(coolest.temp, coolest.humidity);
  for (const h of hours) {
    const value = wbgt(h.temp, h.humidity);
    if (value < coolestWbgt) {
      coolest = h;
      coolestWbgt = value;
    }
  }

  return {
    available: true,
    grade,
    window,
    coolestHour: coolest.hour,
    wbgt: coolestWbgt,
    temp: coolest.temp,
    uvi: coolest.uvi,
  };
}

const SEVERITY: Record<Grade, number> = { GO: 0, CAUTION: 1, SKIP: 2 };

/** Decide which time of day to recommend from the two band grades. */
export function decideOutcome(dawn: BandReport, evening: BandReport): Outcome {
  if (dawn.grade === 'SKIP' && evening.grade === 'SKIP') return 'indoor';
  const d = SEVERITY[dawn.grade];
  const e = SEVERITY[evening.grade];
  if (d < e) return 'dawn';
  if (e < d) return 'evening';
  return 'both';
}
