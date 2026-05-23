import { describe, expect, it } from 'vitest';
import { peakHeat, peakUv, avgPm25Today } from './daySummary.js';
import type { HourlyPm25, HourlyWeather } from '../types.js';

const bkk = (h: number, day = 24) => Date.UTC(2026, 4, day, h - 7, 0, 0) / 1000;
const wx = (h: number, temp: number, humidity: number, uvi: number, day = 24): HourlyWeather => ({
  dt: bkk(h, day),
  temp,
  humidity,
  uvi,
});

describe('peakHeat', () => {
  it('returns the hottest daytime hour (max WBGT) with its temperature', () => {
    const hourly = [wx(6, 28, 70, 0), wx(13, 36, 55, 10), wx(18, 32, 60, 3)];
    const peak = peakHeat(hourly);
    expect(peak?.temp).toBe(36);
    expect(peak?.wbgt).toBeGreaterThan(36);
  });

  it("ignores tomorrow's (hotter) hours", () => {
    const hourly = [wx(13, 34, 55, 10), wx(13, 40, 60, 10, 25)]; // today 34, tomorrow 40
    expect(peakHeat(hourly)?.temp).toBe(34);
  });

  it('returns null for no data', () => {
    expect(peakHeat([])).toBeNull();
  });
});

describe('peakUv', () => {
  it('returns the highest UV of the day (midday peak, not the 4am value)', () => {
    const hourly = [wx(4, 28, 70, 0), wx(12, 35, 55, 10), wx(18, 31, 60, 2)];
    expect(peakUv(hourly)).toBe(10);
  });
  it('returns null for no data', () => {
    expect(peakUv([])).toBeNull();
  });
});

describe('avgPm25Today', () => {
  it("averages today's hourly PM2.5, ignoring other days", () => {
    const forecast: HourlyPm25[] = [
      { dt: bkk(6), pm25: 40 },
      { dt: bkk(12), pm25: 60 },
      { dt: bkk(18), pm25: 50 },
      { dt: bkk(6, 25), pm25: 200 }, // tomorrow -> ignored
    ];
    expect(avgPm25Today(forecast)).toBe(50);
  });
  it('returns null for no data', () => {
    expect(avgPm25Today([])).toBeNull();
  });
});
