import { describe, expect, it } from 'vitest';
import { buildConditions, buildPost } from './pipeline.js';
import { CLOSING_LINES } from './message/closingLines.js';
import type { AirQuality, HourlyPm25, Weather } from './types.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

const aq: AirQuality = { pm25: 32 };
const weather: Weather = {
  current: { temp: 28.4, humidity: 78, uvi: 4, feelsLike: 31.2 },
  hourly: [
    { dt: bkk(5), temp: 24, humidity: 50 },
    { dt: bkk(6), temp: 24, humidity: 50 },
  ],
};
const forecast: HourlyPm25[] = [
  { dt: bkk(5), pm25: 20 },
  { dt: bkk(6), pm25: 20 },
];

describe('buildConditions', () => {
  it('maps current readings, computes WBGT, verdict and windows', () => {
    const c = buildConditions(aq, weather, forecast);
    expect(c.pm25).toBe(32);
    expect(c.temp).toBe(28.4);
    expect(c.humidity).toBe(78);
    expect(c.uvi).toBe(4);
    expect(c.wbgt).toBeCloseTo(31.86, 1);
    // PM2.5 32 is GO, but WBGT ~31.9 is CAUTION -> worse-of is CAUTION.
    expect(c.grade).toBe('CAUTION');
    expect(c.windows).toEqual([{ start: '05:00', end: '07:00', quality: 'best' }]);
  });
});

describe('buildPost', () => {
  it('renders a Korean post with date, verdict and a matching closing line', () => {
    const post = buildPost(aq, weather, forecast, bkk(4), () => 0);
    expect(post).toContain('☀️ Wat Run? — 2026.05.24 (일)');
    expect(post).toContain('오늘 컨디션: 🟡 CAUTION');
    expect(post).toContain(CLOSING_LINES.CAUTION[0]!);
  });
});
