import { describe, expect, it } from 'vitest';
import { buildConditions, buildPost } from './pipeline.js';
import type { AirQuality, HourlyPm25, Weather } from './types.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

const aq: AirQuality = { pm25: 32 };
const weather: Weather = {
  current: { temp: 28.4, humidity: 78, uvi: 4, feelsLike: 31.2 },
  hourly: [
    { dt: bkk(5), temp: 24, humidity: 50, uvi: 1 }, // cool dawn -> best window
    { dt: bkk(6), temp: 24, humidity: 50, uvi: 1 },
    { dt: bkk(13), temp: 36, humidity: 55, uvi: 11 }, // brutal midday peak
  ],
};
const forecast: HourlyPm25[] = [
  { dt: bkk(5), pm25: 20 },
  { dt: bkk(6), pm25: 20 },
];

describe('buildConditions', () => {
  it('summarizes the whole day: window-based verdict, avg PM2.5, midday peaks', () => {
    const c = buildConditions(aq, weather, forecast);
    expect(c.grade).toBe('GO'); // a best window exists at dawn
    expect(c.pm25).toBe(20); // daytime average from the forecast
    expect(c.peakTemp).toBe(36); // midday peak, not the 4am snapshot
    expect(c.peakWbgt).toBeGreaterThan(36);
    expect(c.peakUv).toBe(11); // midday peak UV, not the dawn ~0
    expect(c.times).toEqual({
      kind: 'windows',
      windows: [{ start: '05:00', end: '07:00', quality: 'best' }],
    });
  });
});

describe('buildPost', () => {
  it('renders the whole-day post (peaks + best window + verdict)', () => {
    const post = buildPost(aq, weather, forecast, bkk(4));
    const lines = post.split('\n');
    expect(lines[1]).toBe('2026.05.24 (일)');
    expect(post).toContain('🟢 오늘은 달리기 딱 좋아요!');
    expect(post).toContain('🥵 한낮 더위: 매우 위험 (최고 36.0°C)');
    expect(post).toContain('🧴 한낮 자외선: 위험 (최고 11)');
    expect(post).toContain('⏰ 뛰기 좋은 시간: 05:00–07:00');
    expect(post).not.toMatch(/\b(GO|SKIP|CAUTION)\b/);
  });
});
