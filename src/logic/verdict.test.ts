import { describe, expect, it } from 'vitest';
import { verdictFromTimes } from './verdict.js';

describe('verdictFromTimes', () => {
  it('is GO when a best window exists', () => {
    expect(
      verdictFromTimes({
        kind: 'windows',
        windows: [
          { start: '05:00', end: '07:00', quality: 'best' },
          { start: '17:00', end: '18:00', quality: 'good' },
        ],
      }),
    ).toBe('GO');
  });

  it('is CAUTION when only good windows exist', () => {
    expect(
      verdictFromTimes({
        kind: 'windows',
        windows: [{ start: '05:00', end: '07:00', quality: 'good' }],
      }),
    ).toBe('CAUTION');
  });

  it('is SKIP when there is only a coolest fallback or nothing', () => {
    expect(verdictFromTimes({ kind: 'coolest', start: '06:00', end: '07:00' })).toBe('SKIP');
    expect(verdictFromTimes({ kind: 'none' })).toBe('SKIP');
  });
});
