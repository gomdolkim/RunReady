import { describe, expect, it } from 'vitest';
import { buildEveningPost } from './eveningTemplate.js';

const TUE = Date.UTC(2026, 4, 25, 21, 0, 0) / 1000; // 2026-05-26 04:00 BKK (Tue)
const MON = Date.UTC(2026, 4, 24, 21, 0, 0) / 1000; // 2026-05-25 04:00 BKK (Mon)

describe('buildEveningPost', () => {
  it('renders a run-day workout post (hook, date, type, detail, heat note, tip)', () => {
    const post = buildEveningPost(
      { type: '인터벌', detail: '400m × 5 (사이 200m 조깅 회복)', isRest: false },
      TUE,
      '내일은 어떤 운동? 💪',
      '무리는 금물, 컨디션 따라 조절해요',
    );
    const lines = post.split('\n');
    expect(lines[0]).toBe('내일은 어떤 운동? 💪');
    expect(lines[1]).toBe('2026.05.26 (화)');
    expect(post).toContain('🏃 내일 운동: 인터벌');
    expect(post).toContain('400m × 5 (사이 200m 조깅 회복)');
    expect(post).toContain('🌡️ 한낮은 피하고 새벽·저녁에 · 수분 충분히 💧');
    expect(post).toContain('💪 무리는 금물, 컨디션 따라 조절해요');
  });

  it('renders a rest-day post differently', () => {
    const post = buildEveningPost(
      { type: '휴식', detail: '완전 휴식 — 푹 쉬기', isRest: true },
      MON,
      'hook',
      'tip',
    );
    expect(post).toContain('🛌 내일은 휴식');
    expect(post).toContain('완전 휴식 — 푹 쉬기');
    expect(post).toContain('잘 쉬는 것도 훈련이에요');
    expect(post).not.toContain('🌡️');
  });
});
