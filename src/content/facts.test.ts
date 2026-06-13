import { describe, expect, it } from 'vitest';
import { FACTS, BUCKET_ORDER, pickFact } from './facts.js';

// Seoul is UTC+9: a given KST wall-clock hour h maps to UTC hour h-9.
const kst = (h: number) => Date.UTC(2026, 4, 24, h - 9, 0, 0) / 1000;
const DAY = 86_400;

describe('FACTS dataset', () => {
  it('has exactly 50 facts', () => {
    expect(FACTS.length).toBe(50);
  });

  it('numbers facts 1..50 in rotation order', () => {
    expect(FACTS.map((f) => f.n)).toEqual(
      Array.from({ length: 50 }, (_, i) => i + 1),
    );
  });

  it('has unique ids', () => {
    expect(new Set(FACTS.map((f) => f.id)).size).toBe(FACTS.length);
  });

  it('has exactly 10 facts in each of the 5 buckets', () => {
    for (const bucket of BUCKET_ORDER) {
      expect(FACTS.filter((f) => f.bucket === bucket)).toHaveLength(10);
    }
  });

  it('interleaves buckets so consecutive days never repeat a bucket', () => {
    for (let i = 1; i < FACTS.length; i += 1) {
      expect(FACTS[i]!.bucket).not.toBe(FACTS[i - 1]!.bucket);
    }
  });

  it('has non-empty, trimmed copy in every field', () => {
    for (const f of FACTS) {
      for (const field of [f.hook, f.body, f.kick, f.question, f.tag] as const) {
        expect(field.length).toBeGreaterThan(0);
        expect(field).toBe(field.trim());
      }
    }
  });

  it('ends every hook, kick and question as a full sentence', () => {
    for (const f of FACTS) {
      expect(f.hook).toMatch(/[.?!]$/);
      expect(f.kick).toMatch(/[.?!]$/);
      expect(f.question).toMatch(/\?$/);
    }
  });
});

describe('pickFact', () => {
  it('is deterministic within a single Seoul day', () => {
    expect(pickFact(kst(5)).id).toBe(pickFact(kst(23)).id);
  });

  it('changes across consecutive days', () => {
    expect(pickFact(kst(12)).id).not.toBe(pickFact(kst(12) + DAY).id);
  });

  it('cycles back to the same fact after 50 days', () => {
    const start = kst(12);
    expect(pickFact(start).id).toBe(pickFact(start + 50 * DAY).id);
  });

  it('covers all 50 facts across 50 consecutive days', () => {
    const start = kst(12);
    const seen = new Set<string>();
    for (let i = 0; i < 50; i += 1) seen.add(pickFact(start + i * DAY).id);
    expect(seen.size).toBe(50);
  });
});
