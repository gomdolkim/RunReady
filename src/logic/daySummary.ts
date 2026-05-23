import type { HourlyPm25, HourlyWeather } from '../types.js';
import { bangkokDateKey } from '../util/time.js';
import { wbgt } from './wbgt.js';

/** Keep only entries whose Bangkok date matches the earliest entry ("today"). */
function today<T extends { dt: number }>(entries: T[]): T[] {
  const sorted = [...entries].sort((a, b) => a.dt - b.dt);
  const first = sorted[0];
  if (!first) return [];
  const key = bangkokDateKey(first.dt);
  return sorted.filter((e) => bangkokDateKey(e.dt) === key);
}

/** Hottest daytime hour (max WBGT) and its temperature, or null if no data. */
export function peakHeat(hourly: HourlyWeather[]): { wbgt: number; temp: number } | null {
  let peak: { wbgt: number; temp: number } | null = null;
  for (const h of today(hourly)) {
    const value = wbgt(h.temp, h.humidity);
    if (peak === null || value > peak.wbgt) peak = { wbgt: value, temp: h.temp };
  }
  return peak;
}

/** Highest UV index of the day, or null if no data. */
export function peakUv(hourly: HourlyWeather[]): number | null {
  const hours = today(hourly);
  if (hours.length === 0) return null;
  return Math.max(...hours.map((h) => h.uvi));
}

/** Average of today's hourly PM2.5 forecast, or null if no data. */
export function avgPm25Today(forecast: HourlyPm25[]): number | null {
  const values = today(forecast).map((f) => f.pm25);
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
