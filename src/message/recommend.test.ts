import { describe, expect, it } from 'vitest';
import { RECOMMENDATIONS, pickRecommendation } from './recommend.js';
import type { Outcome } from '../types.js';

const DT = Date.UTC(2026, 4, 23, 22, 0, 0) / 1000;
const OUTCOMES: Outcome[] = ['dawn', 'evening', 'both', 'indoor'];

describe('RECOMMENDATIONS', () => {
  it('has a sizable pool for every outcome', () => {
    for (const o of OUTCOMES) expect(RECOMMENDATIONS[o].length).toBeGreaterThanOrEqual(6);
  });
  it('has no English verdict words', () => {
    for (const o of OUTCOMES) {
      for (const line of RECOMMENDATIONS[o]) expect(line).not.toMatch(/\b(GO|SKIP|CAUTION)\b/);
    }
  });
});

describe('pickRecommendation', () => {
  it('returns a member of the matching pool, deterministically per day', () => {
    for (const o of OUTCOMES) {
      expect(RECOMMENDATIONS[o]).toContain(pickRecommendation(o, DT));
      expect(pickRecommendation(o, DT)).toBe(pickRecommendation(o, DT));
    }
  });
});
