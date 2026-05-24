import { describe, expect, it } from 'vitest';
import { pickCoachLine } from './coachLines.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

describe('pickCoachLine', () => {
  it('returns a non-empty warm line for each grade', () => {
    for (const grade of ['GO', 'CAUTION', 'SKIP'] as const) {
      const line = pickCoachLine(grade, bkk(5));
      expect(typeof line).toBe('string');
      expect(line.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic per day and differs by grade pool', () => {
    expect(pickCoachLine('GO', bkk(5))).toBe(pickCoachLine('GO', bkk(6)));
    // GO and SKIP draw from different pools, so the lines differ.
    expect(pickCoachLine('GO', bkk(5))).not.toBe(pickCoachLine('SKIP', bkk(5)));
  });
});
