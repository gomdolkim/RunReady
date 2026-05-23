import { describe, expect, it } from 'vitest';
import { buildKoreanPost } from './koTemplate.js';
import type { Conditions } from '../types.js';

// 2026-05-24 Bangkok (Sunday)
const DT = Date.UTC(2026, 4, 23, 22, 0, 0) / 1000;

const base: Conditions = {
  pm25: 58,
  temp: 35.6,
  humidity: 61,
  uvi: 5,
  wbgt: 38.0,
  grade: 'SKIP',
  times: { kind: 'coolest', start: '05:00', end: '06:00' },
};

describe('buildKoreanPost', () => {
  it('renders hook, date, Korean verdict, labeled metrics, time advice, closing', () => {
    const post = buildKoreanPost(base, DT, '방콕, 오늘 뛸 수 있을까? 🏃', '오늘은 트레드밀에서 만나요 💪');
    const lines = post.split('\n');
    expect(lines[0]).toBe('방콕, 오늘 뛸 수 있을까? 🏃');
    expect(lines[1]).toBe('2026.05.24 (일)');
    expect(post).toContain('🔴 한낮 실외는 무리예요');
    expect(post).toContain('😷 미세먼지: 나쁨 (58)');
    expect(post).toContain('🥵 더위: 매우 위험 (35.6°C·습도 61%)');
    expect(post).toContain('🧴 자외선: 보통 (5)');
    expect(post).toContain('오늘은 트레드밀에서 만나요 💪');
  });

  it('uses Korean only — no English verdict words, no raw WBGT', () => {
    const post = buildKoreanPost(base, DT, 'hook', 'closing');
    expect(post).not.toMatch(/\b(GO|SKIP|CAUTION)\b/);
    expect(post).not.toContain('WBGT');
  });

  it('shows concrete golden windows when available', () => {
    const post = buildKoreanPost(
      {
        ...base,
        grade: 'GO',
        times: {
          kind: 'windows',
          windows: [
            { start: '05:00', end: '07:00', quality: 'best' },
            { start: '17:00', end: '19:00', quality: 'good' },
          ],
        },
      },
      DT,
      'hook',
      'go closing',
    );
    expect(post).toContain('⏰ 뛰기 좋은 시간: 05:00–07:00 · 17:00–19:00');
    expect(post).toContain('🟢 오늘은 달리기 딱 좋아요!');
  });

  it('suggests the coolest hour when no window qualifies', () => {
    expect(buildKoreanPost(base, DT, 'h', 'c')).toContain(
      '⏰ 뛰기 좋은 시간: 마땅한 때 없음 — 그나마 05:00 무렵',
    );
  });

  it('rounds numbers and keeps one decimal for temperature', () => {
    const post = buildKoreanPost(
      { ...base, pm25: 57.6, humidity: 60.5, uvi: 4.6, temp: 35.56 },
      DT,
      'h',
      'c',
    );
    expect(post).toContain('😷 미세먼지: 나쁨 (58)');
    expect(post).toContain('습도 61%');
    expect(post).toContain('🧴 자외선: 보통 (5)');
    expect(post).toContain('35.6°C');
  });
});
