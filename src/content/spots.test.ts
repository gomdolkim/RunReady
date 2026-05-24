import { describe, expect, it } from 'vitest';
import { SPOTS, pickSpot } from './spots.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

describe('SPOTS dataset', () => {
  it('has unique ids and tags and valid Bangkok-ish coordinates', () => {
    expect(SPOTS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(SPOTS.map((s) => s.id)).size).toBe(SPOTS.length);
    expect(new Set(SPOTS.map((s) => s.tag)).size).toBe(SPOTS.length);
    for (const s of SPOTS) {
      expect(s.lat).toBeGreaterThan(13);
      expect(s.lat).toBeLessThan(14.5);
      expect(s.lon).toBeGreaterThan(100);
      expect(s.lon).toBeLessThan(101);
      expect(s.tag).toMatch(/^[A-Za-z0-9]+$/);
    }
  });
});

describe('pickSpot', () => {
  it('is deterministic for a given day', () => {
    expect(pickSpot(bkk(5))).toBe(pickSpot(bkk(6)));
  });

  it('changes across consecutive days', () => {
    const a = pickSpot(bkk(5));
    const b = pickSpot(bkk(5) + 86_400);
    expect(a.id).not.toBe(b.id);
  });
});
