import { describe, expect, it } from 'vitest';
import { vaporPressure, wbgt } from './wbgt.js';

describe('vaporPressure', () => {
  it('rises with humidity at fixed temperature', () => {
    expect(vaporPressure(28, 90)).toBeGreaterThan(vaporPressure(28, 50));
  });

  it('is zero at zero humidity', () => {
    expect(vaporPressure(28, 0)).toBe(0);
  });
});

describe('wbgt (BoM approximation)', () => {
  // Independently hand-computed from the BoM formula for 28.4 °C / 78 %.
  // (Note: the spec's sample post prints 26.8 here, which is inconsistent
  //  with the formula — the formula is the source of truth.)
  it('matches the formula for the spec example inputs', () => {
    expect(wbgt(28.4, 78)).toBeCloseTo(31.86, 1);
  });

  it('rises with temperature at fixed humidity', () => {
    expect(wbgt(32, 70)).toBeGreaterThan(wbgt(26, 70));
  });

  it('rises with humidity at fixed temperature', () => {
    expect(wbgt(28, 90)).toBeGreaterThan(wbgt(28, 50));
  });
});
