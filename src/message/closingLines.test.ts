import { describe, expect, it } from 'vitest';
import { CLOSING_LINES, pickClosingLine } from './closingLines.js';
import type { Grade } from '../types.js';

describe('pickClosingLine', () => {
  it('picks the first line of the pool when rng is 0', () => {
    expect(pickClosingLine('GO', () => 0)).toBe(CLOSING_LINES.GO[0]);
  });

  it('picks the last line of the pool when rng approaches 1', () => {
    const pool = CLOSING_LINES.SKIP;
    expect(pickClosingLine('SKIP', () => 0.999)).toBe(pool[pool.length - 1]);
  });

  it('always returns a member of the matching pool', () => {
    for (const grade of ['GO', 'CAUTION', 'SKIP'] as Grade[]) {
      const line = pickClosingLine(grade);
      expect(CLOSING_LINES[grade]).toContain(line);
    }
  });

  it('has a non-empty pool for every grade', () => {
    for (const grade of ['GO', 'CAUTION', 'SKIP'] as Grade[]) {
      expect(CLOSING_LINES[grade].length).toBeGreaterThan(0);
    }
  });
});
