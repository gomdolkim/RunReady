import { describe, expect, it } from 'vitest';
import { buildEveningPost, EVENING_POSTS } from './eveningRotation.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

describe('buildEveningPost', () => {
  it('puts the header on line 1 and the date on line 2', () => {
    const post = buildEveningPost(bkk(18));
    const lines = post.split('\n');
    expect(lines[0]).toBe('🐱 소이캣의 저녁 한 컷');
    expect(lines[1]).toBe('2026.05.24 (일)');
  });

  it('rotates content by day and never repeats until the pool is exhausted', () => {
    const today = buildEveningPost(bkk(18)).split('\n').slice(2).join('\n');
    const tomorrow = buildEveningPost(bkk(18) + 86_400).split('\n').slice(2).join('\n');
    expect(today).not.toBe(tomorrow);
  });

  it('every pool entry is non-empty', () => {
    for (const body of EVENING_POSTS) expect(body.trim().length).toBeGreaterThan(0);
  });
});
