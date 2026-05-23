import { describe, expect, it } from 'vitest';
import { EVENING_HOOKS, pickEveningHook } from './eveningHooks.js';

const DT = Date.UTC(2026, 4, 23, 22, 0, 0) / 1000;

describe('evening hooks', () => {
  it('has a sizable pool with no duplicates', () => {
    expect(EVENING_HOOKS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(EVENING_HOOKS).size).toBe(EVENING_HOOKS.length);
  });

  it('pickEveningHook returns a member, deterministically per day', () => {
    expect(EVENING_HOOKS).toContain(pickEveningHook(DT));
    expect(pickEveningHook(DT)).toBe(pickEveningHook(DT));
  });
});
