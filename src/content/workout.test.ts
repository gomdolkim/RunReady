import { describe, expect, it } from 'vitest';
import { buildWorkout, pickTip, WORKOUT_TIPS } from './workout.js';

// 04:00 Bangkok on the given date. 2026-05-24 is Sunday.
const bkk = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 4 - 7, 0, 0) / 1000;

describe('buildWorkout', () => {
  it('maps each weekday to its workout type', () => {
    expect(buildWorkout(bkk(2026, 5, 26)).type).toBe('인터벌'); // Tue
    expect(buildWorkout(bkk(2026, 5, 28)).type).toBe('템포런'); // Thu
    expect(buildWorkout(bkk(2026, 5, 30)).type).toBe('장거리(LSD)'); // Sat
    expect(buildWorkout(bkk(2026, 5, 24)).type).toBe('회복런'); // Sun
  });

  it('marks rest days', () => {
    expect(buildWorkout(bkk(2026, 5, 25)).isRest).toBe(true); // Mon
    expect(buildWorkout(bkk(2026, 5, 29)).isRest).toBe(true); // Fri
    expect(buildWorkout(bkk(2026, 5, 26)).isRest).toBe(false); // Tue
  });

  it('returns a detail from the type pool, deterministically', () => {
    const w = buildWorkout(bkk(2026, 5, 26));
    expect(w.detail.length).toBeGreaterThan(0);
    expect(buildWorkout(bkk(2026, 5, 26))).toEqual(w);
  });
});

describe('pickTip', () => {
  it('returns a tip from the pool, deterministically', () => {
    const dt = bkk(2026, 5, 26);
    expect(WORKOUT_TIPS).toContain(pickTip(dt));
    expect(pickTip(dt)).toBe(pickTip(dt));
  });
});
