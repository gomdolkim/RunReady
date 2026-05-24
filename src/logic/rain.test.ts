import { describe, expect, it } from 'vitest';
import { rainHint } from './rain.js';
import type { HourlyWeather } from '../types.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;
const hour = (h: number, precipProb: number): HourlyWeather => ({
  dt: bkk(h), temp: 25, humidity: 70, uvi: 1, precipProb,
});

describe('rainHint', () => {
  it('returns null when no hour in the band is wet enough', () => {
    const hours = [hour(5, 10), hour(6, 30), hour(7, 0)];
    expect(rainHint(hours, [4, 9])).toBeNull();
  });

  it('reports the wet hour range when probability is high', () => {
    const hours = [hour(5, 20), hour(6, 70), hour(7, 80), hour(8, 10)];
    expect(rainHint(hours, [4, 9])).toBe('🌧️ 6–7시 소나기 가능 — 우산 챙겨요');
  });

  it('reports a single wet hour without a range', () => {
    const hours = [hour(6, 90)];
    expect(rainHint(hours, [4, 9])).toBe('🌧️ 6시 소나기 가능 — 우산 챙겨요');
  });
});
