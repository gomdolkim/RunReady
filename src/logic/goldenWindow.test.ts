import { describe, expect, it } from 'vitest';
import { classifyHour, buildWindows, goldenWindows } from './goldenWindow.js';
import type { GoldenWindow } from '../types.js';

describe('classifyHour', () => {
  it('is best when both WBGT and PM2.5 meet the best thresholds', () => {
    expect(classifyHour(23.4, 20)).toBe('best');
    expect(classifyHour(30, 35)).toBe('best'); // inclusive boundary
  });
  it('is good when within the good thresholds but not best', () => {
    expect(classifyHour(31, 20)).toBe('good'); // WBGT too high for best
    expect(classifyHour(23.4, 45)).toBe('good'); // PM2.5 too high for best
    expect(classifyHour(32.5, 50)).toBe('good'); // inclusive boundary
  });
  it('is none when either metric exceeds the good thresholds', () => {
    expect(classifyHour(32.6, 20)).toBe('none');
    expect(classifyHour(23.4, 51)).toBe('none');
  });
});

describe('buildWindows', () => {
  it('merges a contiguous same-tier run into one window (end is exclusive)', () => {
    const out = buildWindows([
      { hour: 5, quality: 'best' },
      { hour: 6, quality: 'best' },
      { hour: 7, quality: 'best' },
    ]);
    expect(out).toEqual<GoldenWindow[]>([{ start: '05:00', end: '08:00', quality: 'best' }]);
  });

  it('splits on a non-contiguous hour', () => {
    const out = buildWindows([
      { hour: 5, quality: 'best' },
      { hour: 6, quality: 'best' },
      { hour: 8, quality: 'best' },
    ]);
    expect(out).toEqual<GoldenWindow[]>([
      { start: '05:00', end: '07:00', quality: 'best' },
      { start: '08:00', end: '09:00', quality: 'best' },
    ]);
  });

  it('splits when the tier changes', () => {
    const out = buildWindows([
      { hour: 5, quality: 'best' },
      { hour: 6, quality: 'best' },
      { hour: 7, quality: 'good' },
      { hour: 8, quality: 'good' },
    ]);
    expect(out).toEqual<GoldenWindow[]>([
      { start: '05:00', end: '07:00', quality: 'best' },
      { start: '07:00', end: '09:00', quality: 'good' },
    ]);
  });

  it('skips none hours', () => {
    const out = buildWindows([
      { hour: 5, quality: 'none' },
      { hour: 6, quality: 'good' },
    ]);
    expect(out).toEqual<GoldenWindow[]>([{ start: '06:00', end: '07:00', quality: 'good' }]);
  });

  it('caps at two windows, preferring best, then displays chronologically', () => {
    const out = buildWindows([
      { hour: 5, quality: 'good' },
      { hour: 6, quality: 'good' },
      { hour: 8, quality: 'best' },
      { hour: 18, quality: 'best' },
    ]);
    expect(out).toEqual<GoldenWindow[]>([
      { start: '08:00', end: '09:00', quality: 'best' },
      { start: '18:00', end: '19:00', quality: 'best' },
    ]);
  });
});

describe('goldenWindows (integration)', () => {
  // 2026-05-24 {hour}:00 Bangkok as UNIX seconds.
  const bkk = (h: number, day = 24) => Date.UTC(2026, 4, day, h - 7, 0, 0) / 1000;
  const wx = (h: number, temp: number, humidity: number, day = 24) => ({ dt: bkk(h, day), temp, humidity });
  const pm = (h: number, pm25: number, day = 24) => ({ dt: bkk(h, day), pm25 });

  it('returns [] when there is no weather data', () => {
    expect(goldenWindows([], [])).toEqual([]);
  });

  it('computes windows, ignoring out-of-band, missing-PM2.5 and other-day hours', () => {
    const weather = [
      wx(4, 24, 50), wx(5, 24, 50), wx(6, 24, 50), // best
      wx(7, 30, 65), // good (WBGT ~31.8)
      wx(8, 31, 70), // none (too hot, WBGT ~33.8)
      wx(9, 24, 50), // best conditions but no PM2.5 entry -> ignored
      wx(12, 24, 50), // out of band -> ignored
      wx(17, 26, 55), wx(18, 26, 55), // best
      wx(5, 24, 50, 25), // tomorrow -> ignored
    ];
    const pm25 = [
      pm(4, 20), pm(5, 20), pm(6, 20), pm(7, 20), pm(8, 20),
      pm(12, 20), pm(17, 20), pm(18, 20), pm(5, 20, 25),
    ];

    expect(goldenWindows(weather, pm25)).toEqual<GoldenWindow[]>([
      { start: '04:00', end: '07:00', quality: 'best' },
      { start: '17:00', end: '19:00', quality: 'best' },
    ]);
  });
});
