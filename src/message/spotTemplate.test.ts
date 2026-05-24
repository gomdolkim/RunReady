import { describe, expect, it } from 'vitest';
import { buildSpotPost } from './spotTemplate.js';
import type { SpotConditions } from '../types.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

const base: SpotConditions = {
  spot: {
    id: 'benjakitti', nameKo: '벤짜낏 포레스트파크', nameEn: 'Benjakitti', nameTh: 'เบญจกิติ',
    area: '아속/클롱토이', blurbKo: '도심 속 숲길과 호수 데크 루프. 그늘이 많아요.',
    lat: 13.72, lon: 100.56, loopKm: 1.9, shade: 2, tag: 'Benjakitti',
  },
  grade: 'GO',
  window: { start: '05:00', end: '07:00', quality: 'best' },
  bestHour: 5,
  wbgt: 26, temp: 26, uvi: 1,
  aqi: 42, station: 'Bangkok – Sathon',
  rainHint: null,
};

describe('buildSpotPost', () => {
  it('renders header, date on line 2, spot, condition and coach line', () => {
    const post = buildSpotPost(base, bkk(5), '오늘은 여기야. 천천히 한 바퀴');
    const lines = post.split('\n');
    expect(lines[0]).toBe('🐱 소이캣의 오늘의 스팟');
    expect(lines[1]).toBe('2026.05.24 (일)');
    expect(post).toContain('📍 벤짜낏 포레스트파크 · 아속/클롱토이');
    expect(post).toContain('🟢 지금 뛰기 좋아요');
    expect(post).toContain('🌡️ 26°C 좋음 · 💨 AQI 42 좋음 · ☀️ 자외선 낮음');
    expect(post).toContain('⏰ 베스트 창: 5–7시');
    expect(post).toContain('오늘은 여기야. 천천히 한 바퀴 — 소이캣');
    expect(post).not.toContain('🌧️');
    expect(post).not.toMatch(/\b(GO|CAUTION|SKIP)\b/);
  });

  it('includes the rain hint line when present', () => {
    const post = buildSpotPost({ ...base, rainHint: '🌧️ 6–7시 소나기 가능 — 우산 챙겨요' }, bkk(5), 'x');
    expect(post).toContain('🌧️ 6–7시 소나기 가능 — 우산 챙겨요');
  });

  it('falls back to the best hour when there is no window', () => {
    const post = buildSpotPost({ ...base, grade: 'CAUTION', window: null, bestHour: 6 }, bkk(5), 'x');
    expect(post).toContain('🟡 뛸 만해요, 컨디션 보며');
    expect(post).toContain('⏰ 베스트 창: 6시쯤');
  });
});
