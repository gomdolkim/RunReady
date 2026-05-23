import { describe, expect, it } from 'vitest';
import { CLOSING_LINES, pickClosingLine } from './closingLines.js';
import type { Grade } from '../types.js';

const DT = Date.UTC(2026, 4, 23, 22, 0, 0) / 1000;
const GRADES: Grade[] = ['GO', 'CAUTION', 'SKIP'];

describe('CLOSING_LINES', () => {
  it('has a sizable pool for every grade', () => {
    for (const g of GRADES) {
      expect(CLOSING_LINES[g].length).toBeGreaterThanOrEqual(10);
    }
  });

  it('has no English verdict words', () => {
    for (const g of GRADES) {
      for (const line of CLOSING_LINES[g]) {
        expect(line).not.toMatch(/\b(GO|SKIP|CAUTION)\b/);
      }
    }
  });
});

describe('pickClosingLine', () => {
  it('returns a member of the matching pool', () => {
    for (const g of GRADES) {
      expect(CLOSING_LINES[g]).toContain(pickClosingLine(g, DT));
    }
  });

  it('is deterministic for a given day', () => {
    expect(pickClosingLine('SKIP', DT)).toBe(pickClosingLine('SKIP', DT));
  });
});
