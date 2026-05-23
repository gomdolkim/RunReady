import { describe, expect, it } from 'vitest';
import { classifyHour, buildWindows } from './goldenWindow.js';
import type { GoldenWindow } from '../types.js';

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

  it('splits on a gap and on a tier change, in chronological order', () => {
    expect(
      buildWindows([
        { hour: 5, quality: 'best' },
        { hour: 6, quality: 'good' },
        { hour: 8, quality: 'good' },
      ]),
    ).toEqual<GoldenWindow[]>([
      { start: '05:00', end: '06:00', quality: 'best' },
      { start: '06:00', end: '07:00', quality: 'good' },
      { start: '08:00', end: '09:00', quality: 'good' },
    ]);
  });

  it('skips none hours', () => {
    expect(
      buildWindows([
        { hour: 5, quality: 'none' },
        { hour: 6, quality: 'good' },
      ]),
    ).toEqual<GoldenWindow[]>([{ start: '06:00', end: '07:00', quality: 'good' }]);
  });
});
