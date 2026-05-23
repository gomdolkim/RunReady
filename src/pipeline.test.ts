import { describe, expect, it } from 'vitest';
import { buildConditions, buildPost } from './pipeline.js';
import { pickRecommendation } from './message/recommend.js';
import type { AirQuality, Weather } from './types.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

const aq: AirQuality = { avg: 40, min: 30, max: 55 }; // good air, gates on avg
const weather: Weather = {
  current: { temp: 28.4, humidity: 78, uvi: 4, feelsLike: 31.2 },
  hourly: [
    { dt: bkk(5), temp: 24, humidity: 50, uvi: 1 }, // cool, clean dawn
    { dt: bkk(6), temp: 24, humidity: 50, uvi: 1 },
    { dt: bkk(13), temp: 36, humidity: 55, uvi: 11 }, // midday (ignored — nobody runs)
    { dt: bkk(17), temp: 33, humidity: 60, uvi: 3 }, // hot evening
    { dt: bkk(18), temp: 33, humidity: 60, uvi: 3 },
  ],
};

describe('buildConditions', () => {
  it('analyses dawn and evening separately and recommends the better band', () => {
    const c = buildConditions(aq, weather);
    expect(c.aqiMin).toBe(30);
    expect(c.aqiMax).toBe(55);
    expect(c.dawn.grade).toBe('GO');
    expect(c.dawn.window).toEqual({ start: '05:00', end: '07:00', quality: 'best' });
    expect(c.evening.grade).toBe('SKIP'); // too hot
    expect(c.outcome).toBe('dawn');
  });
});

describe('buildPost', () => {
  it('renders the dawn/evening post with conditions at run times', () => {
    const post = buildPost(aq, weather, bkk(4));
    const lines = post.split('\n');
    expect(lines[1]).toBe('2026.05.24 (일)');
    expect(post).toContain('😷 미세먼지: 좋음~보통 (AQI 30~55)');
    expect(post).toContain('🌅 새벽 🟢 5–7시 · 더위 좋음 24°C · 자외선 낮음');
    expect(post).toContain('🌆 저녁 🔴 17시쯤 · 더위 위험 33°C · 자외선 보통');
    expect(post).toContain(pickRecommendation('dawn', bkk(4)));
    expect(post).not.toMatch(/\b(GO|SKIP|CAUTION)\b/);
  });
});
