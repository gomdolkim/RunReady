import { describe, expect, it } from 'vitest';
import { gradePm25, gradeWbgt, worseOf, verdict, verdictFromTimes } from './verdict.js';

describe('gradePm25', () => {
  it('grades below 35 as GO', () => {
    expect(gradePm25(34.9)).toBe('GO');
  });
  it('grades the 35 boundary as CAUTION', () => {
    expect(gradePm25(35)).toBe('CAUTION');
  });
  it('grades the 55 boundary as CAUTION', () => {
    expect(gradePm25(55)).toBe('CAUTION');
  });
  it('grades above 55 as SKIP', () => {
    expect(gradePm25(55.1)).toBe('SKIP');
  });
});

describe('gradeWbgt', () => {
  it('grades below 30 as GO', () => {
    expect(gradeWbgt(29.9)).toBe('GO');
  });
  it('grades the 30 boundary as CAUTION', () => {
    expect(gradeWbgt(30)).toBe('CAUTION');
  });
  it('grades the 32.5 boundary as CAUTION', () => {
    expect(gradeWbgt(32.5)).toBe('CAUTION');
  });
  it('grades above 32.5 as SKIP', () => {
    expect(gradeWbgt(32.6)).toBe('SKIP');
  });
});

describe('worseOf', () => {
  it('returns GO when both are GO', () => {
    expect(worseOf('GO', 'GO')).toBe('GO');
  });
  it('returns CAUTION when one is CAUTION', () => {
    expect(worseOf('GO', 'CAUTION')).toBe('CAUTION');
  });
  it('returns SKIP when one is SKIP', () => {
    expect(worseOf('CAUTION', 'SKIP')).toBe('SKIP');
  });
});

describe('verdict', () => {
  it('takes the worse of the PM2.5 and WBGT grades', () => {
    // PM2.5 clean (GO) but WBGT brutal (SKIP) -> SKIP
    expect(verdict(20, 34)).toBe('SKIP');
    // Both comfortable -> GO
    expect(verdict(20, 26)).toBe('GO');
    // PM2.5 moderate (CAUTION), WBGT fine (GO) -> CAUTION
    expect(verdict(40, 26)).toBe('CAUTION');
  });
});

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
