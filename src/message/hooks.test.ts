import { describe, expect, it } from 'vitest';
import { HOOKS, pickHook } from './hooks.js';

const DT = Date.UTC(2026, 4, 23, 22, 0, 0) / 1000;

describe('hooks', () => {
  it('has a large pool for daily variety', () => {
    expect(HOOKS.length).toBeGreaterThanOrEqual(30);
  });

  it('has no English verdict words and no duplicates', () => {
    expect(new Set(HOOKS).size).toBe(HOOKS.length);
    for (const h of HOOKS) expect(h).not.toMatch(/\b(GO|SKIP|CAUTION)\b/);
  });

  it('pickHook returns a member of the pool, deterministically per day', () => {
    expect(HOOKS).toContain(pickHook(DT));
    expect(pickHook(DT)).toBe(pickHook(DT));
  });
});
