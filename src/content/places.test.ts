import { describe, expect, it } from 'vitest';
import { PLACES, pickPlace } from './places.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;
const DAY = 86_400;

describe('PLACES dataset', () => {
  it('has exactly 50 places', () => {
    expect(PLACES.length).toBe(50);
  });

  it('has unique ids and tags', () => {
    expect(new Set(PLACES.map((p) => p.id)).size).toBe(PLACES.length);
    expect(new Set(PLACES.map((p) => p.tag)).size).toBe(PLACES.length);
  });

  it('has non-empty copy and greater-Bangkok coordinates', () => {
    for (const p of PLACES) {
      expect(p.nameKo.length).toBeGreaterThan(0);
      expect(p.nameEn.length).toBeGreaterThan(0);
      expect(p.nameTh.length).toBeGreaterThan(0);
      expect(p.area.length).toBeGreaterThan(0);
      expect(p.blurbKo.length).toBeGreaterThan(0);
      expect(p.seeKo.length).toBeGreaterThan(0);
      expect(p.goKo.length).toBeGreaterThan(0);
      expect(p.tag).toMatch(/^[A-Za-z0-9]+$/);
      // Greater Bangkok metropolitan region (incl. Samut Prakan / Pathum Thani).
      expect(p.lat).toBeGreaterThan(13);
      expect(p.lat).toBeLessThan(15);
      expect(p.lon).toBeGreaterThan(100);
      expect(p.lon).toBeLessThan(101);
    }
  });

  it('has Thai text in every Thai name', () => {
    for (const p of PLACES) {
      expect(p.nameTh).toMatch(/[฀-๿]/);
    }
  });
});

describe('pickPlace', () => {
  it('is deterministic within a single Bangkok day', () => {
    expect(pickPlace(bkk(5)).id).toBe(pickPlace(bkk(6)).id);
  });

  it('changes across consecutive days', () => {
    expect(pickPlace(bkk(5)).id).not.toBe(pickPlace(bkk(5) + DAY).id);
  });

  it('cycles back to the same place after 50 days', () => {
    const start = bkk(5);
    expect(pickPlace(start).id).toBe(pickPlace(start + 50 * DAY).id);
  });

  it('covers all 50 places across 50 consecutive days', () => {
    const start = bkk(5);
    const seen = new Set<string>();
    for (let i = 0; i < 50; i += 1) seen.add(pickPlace(start + i * DAY).id);
    expect(seen.size).toBe(50);
  });
});
