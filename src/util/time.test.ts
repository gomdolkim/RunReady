import { describe, expect, it } from 'vitest';
import {
  bangkokHour,
  bangkokDateKey,
  bangkokDateLabel,
  enDateLabel,
  thDateLabel,
  formatClock,
} from './time.js';

// 2026-05-24 05:00 Bangkok == 2026-05-23 22:00 UTC
const DAWN = Date.UTC(2026, 4, 23, 22, 0, 0) / 1000;
// 2026-05-24 17:00 Bangkok == 2026-05-24 10:00 UTC
const EVENING = Date.UTC(2026, 4, 24, 10, 0, 0) / 1000;
// 2026-05-25 00:00 Bangkok == 2026-05-24 17:00 UTC (next Bangkok day)
const MIDNIGHT = Date.UTC(2026, 4, 24, 17, 0, 0) / 1000;

describe('bangkokHour', () => {
  it('returns the local clock hour', () => {
    expect(bangkokHour(DAWN)).toBe(5);
    expect(bangkokHour(EVENING)).toBe(17);
  });
  it('rolls to 0 at Bangkok midnight', () => {
    expect(bangkokHour(MIDNIGHT)).toBe(0);
  });
});

describe('bangkokDateKey', () => {
  it('formats the local date as YYYY-MM-DD', () => {
    expect(bangkokDateKey(DAWN)).toBe('2026-05-24');
  });
  it('advances the date past Bangkok midnight', () => {
    expect(bangkokDateKey(MIDNIGHT)).toBe('2026-05-25');
  });
});

describe('bangkokDateLabel', () => {
  it('formats the Korean date label with weekday', () => {
    // 2026-05-24 is a Sunday (일).
    expect(bangkokDateLabel(DAWN)).toBe('2026.05.24 (일)');
  });
});

describe('enDateLabel', () => {
  it('formats the US date with weekday', () => {
    expect(enDateLabel(DAWN)).toBe('May 24, 2026 (Sun)');
  });
});

describe('thDateLabel', () => {
  it('formats the Thai date with Buddhist year and weekday', () => {
    expect(thDateLabel(DAWN)).toBe('24 พ.ค. 2569 (อา.)');
  });
});

describe('formatClock', () => {
  it('zero-pads the hour into HH:00', () => {
    expect(formatClock(5)).toBe('05:00');
    expect(formatClock(17)).toBe('17:00');
    expect(formatClock(0)).toBe('00:00');
  });
});
