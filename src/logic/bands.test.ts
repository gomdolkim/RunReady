import { describe, expect, it } from 'vitest';
import { analyzeBand } from './bands.js';
import type { HourlyWeather } from '../types.js';

const bkk = (h: number, day = 24) => Date.UTC(2026, 4, day, h - 7, 0, 0) / 1000;
const wx = (h: number, temp: number, humidity: number, uvi: number): HourlyWeather => ({
  dt: bkk(h),
  temp,
  humidity,
  uvi,
});

describe('analyzeBand', () => {
  it('grades a cool, clean dawn as GO with a best window', () => {
    const dawn = analyzeBand([wx(5, 24, 50, 1), wx(6, 24, 50, 1)], [4, 9], 40);
    expect(dawn.grade).toBe('GO');
    expect(dawn.window).toEqual({ start: '05:00', end: '07:00', quality: 'best' });
    expect(dawn.coolestHour).toBe(5);
    expect(dawn.temp).toBe(24);
    expect(dawn.uvi).toBe(1);
  });

  it('is SKIP (no window) when the air is bad even if cool', () => {
    const dawn = analyzeBand([wx(5, 24, 50, 1), wx(6, 24, 50, 1)], [4, 9], 120);
    expect(dawn.grade).toBe('SKIP');
    expect(dawn.window).toBeNull();
    expect(dawn.coolestHour).toBe(5);
  });

  it('grades a warm-but-ok evening as CAUTION with a good window', () => {
    const eve = analyzeBand([wx(17, 30, 65, 3), wx(18, 30, 65, 3)], [17, 20], 40);
    expect(eve.grade).toBe('CAUTION');
    expect(eve.window?.quality).toBe('good');
  });

  it('is SKIP when the band is too hot', () => {
    const eve = analyzeBand([wx(17, 33, 60, 2), wx(18, 33, 60, 2)], [17, 20], 40);
    expect(eve.grade).toBe('SKIP');
    expect(eve.window).toBeNull();
  });

  it('reports unavailable when no hours fall in the band', () => {
    const dawn = analyzeBand([wx(13, 30, 60, 5)], [4, 9], 40);
    expect(dawn.available).toBe(false);
    expect(dawn.grade).toBe('SKIP');
  });
});
