import { describe, expect, it } from 'vitest';
import { classifyHour, buildWindows, goldenWindows, recommendTimes } from './goldenWindow.js';
import type { GoldenWindow, HourlyWeather } from '../types.js';

describe('classifyHour', () => {
  it('is best when WBGT and AQI both meet the best gate', () => {
    expect(classifyHour(23.4, 30)).toBe('best');
    expect(classifyHour(30, 50)).toBe('best'); // inclusive boundary
  });
  it('is good within the good gate but not best', () => {
    expect(classifyHour(31, 30)).toBe('good'); // WBGT too high for best
    expect(classifyHour(23.4, 80)).toBe('good'); // AQI too high for best
    expect(classifyHour(32.5, 100)).toBe('good'); // inclusive boundary
  });
  it('is none when either exceeds the good gate', () => {
    expect(classifyHour(32.6, 30)).toBe('none');
    expect(classifyHour(23.4, 101)).toBe('none');
  });
});

describe('buildWindows', () => {
  it('merges a contiguous same-tier run into one window (end exclusive)', () => {
    expect(
      buildWindows([
        { hour: 5, quality: 'best' },
        { hour: 6, quality: 'best' },
        { hour: 7, quality: 'best' },
      ]),
    ).toEqual<GoldenWindow[]>([{ start: '05:00', end: '08:00', quality: 'best' }]);
  });

  it('splits when the tier changes', () => {
    expect(
      buildWindows([
        { hour: 5, quality: 'best' },
        { hour: 6, quality: 'best' },
        { hour: 7, quality: 'good' },
      ]),
    ).toEqual<GoldenWindow[]>([
      { start: '05:00', end: '07:00', quality: 'best' },
      { start: '07:00', end: '08:00', quality: 'good' },
    ]);
  });

  it('caps at two windows, preferring best, displayed chronologically', () => {
    expect(
      buildWindows([
        { hour: 5, quality: 'good' },
        { hour: 6, quality: 'good' },
        { hour: 8, quality: 'best' },
        { hour: 18, quality: 'best' },
      ]),
    ).toEqual<GoldenWindow[]>([
      { start: '08:00', end: '09:00', quality: 'best' },
      { start: '18:00', end: '19:00', quality: 'best' },
    ]);
  });
});

describe('goldenWindows (integration)', () => {
  const bkk = (h: number, day = 24) => Date.UTC(2026, 4, day, h - 7, 0, 0) / 1000;
  const wx = (h: number, temp: number, humidity: number, day = 24): HourlyWeather => ({
    dt: bkk(h, day),
    temp,
    humidity,
    uvi: 0,
  });

  const weather = [
    wx(4, 24, 50), wx(5, 24, 50), wx(6, 24, 50), // best (cool)
    wx(7, 30, 65), // good (WBGT ~31.8)
    wx(8, 31, 70), // none (WBGT ~33.8)
    wx(12, 24, 50), // out of band
    wx(17, 26, 55), wx(18, 26, 55), // best
    wx(5, 24, 50, 25), // tomorrow -> ignored
  ];

  it('returns [] with no weather data', () => {
    expect(goldenWindows([], 40)).toEqual([]);
  });

  it('computes windows gated by heat and good air', () => {
    expect(goldenWindows(weather, 40)).toEqual<GoldenWindow[]>([
      { start: '04:00', end: '07:00', quality: 'best' },
      { start: '17:00', end: '19:00', quality: 'best' },
    ]);
  });

  it('returns no windows when the air is bad (AQI > 100), regardless of heat', () => {
    expect(goldenWindows(weather, 120)).toEqual([]);
  });
});

describe('recommendTimes', () => {
  const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;
  const wx = (h: number, temp: number, humidity: number): HourlyWeather => ({
    dt: bkk(h),
    temp,
    humidity,
    uvi: 0,
  });

  it('returns windows when good times exist', () => {
    expect(recommendTimes([wx(5, 24, 50), wx(6, 24, 50)], 40)).toEqual({
      kind: 'windows',
      windows: [{ start: '05:00', end: '07:00', quality: 'best' }],
    });
  });

  it('falls back to the coolest band hour when no window qualifies', () => {
    expect(recommendTimes([wx(5, 35, 72), wx(6, 33, 65), wx(7, 36, 75)], 40)).toEqual({
      kind: 'coolest',
      start: '06:00',
      end: '07:00',
    });
  });

  it('returns kind "none" with no data', () => {
    expect(recommendTimes([], 40)).toEqual({ kind: 'none' });
  });
});
