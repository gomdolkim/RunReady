import { afterEach, describe, expect, it } from 'vitest';
import { requireEnv, GOLDEN } from './config.js';

describe('requireEnv', () => {
  const KEY = 'WAT_RUN_TEST_VAR';
  afterEach(() => {
    delete process.env[KEY];
  });

  it('returns the value when the variable is set', () => {
    process.env[KEY] = 'hello';
    expect(requireEnv(KEY)).toBe('hello');
  });

  it('throws a clear error naming the variable when missing', () => {
    delete process.env[KEY];
    expect(() => requireEnv(KEY)).toThrow(/WAT_RUN_TEST_VAR/);
  });

  it('throws when the variable is empty or whitespace', () => {
    process.env[KEY] = '   ';
    expect(() => requireEnv(KEY)).toThrow(/WAT_RUN_TEST_VAR/);
  });
});

describe('constants', () => {
  it('encodes the golden-window thresholds (AQI air gate) and bands', () => {
    expect(GOLDEN.best).toEqual({ wbgt: 30, aqi: 50 });
    expect(GOLDEN.good).toEqual({ wbgt: 32.5, aqi: 100 });
    expect(GOLDEN.bands.dawn).toEqual([4, 9]);
    expect(GOLDEN.bands.evening).toEqual([17, 20]);
  });
});
