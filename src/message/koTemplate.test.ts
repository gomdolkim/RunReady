import { describe, expect, it } from 'vitest';
import { buildKoreanPost } from './koTemplate.js';
import type { Conditions } from '../types.js';

// 2026-05-24 Bangkok (Sunday)
const DT = Date.UTC(2026, 4, 23, 22, 0, 0) / 1000;

const base: Conditions = {
  aqi: 111,
  dawn: {
    available: true,
    grade: 'CAUTION',
    window: { start: '05:00', end: '07:00', quality: 'good' },
    coolestHour: 5,
    wbgt: 31,
    temp: 28,
    uvi: 1,
  },
  evening: {
    available: true,
    grade: 'SKIP',
    window: null,
    coolestHour: 18,
    wbgt: 34,
    temp: 33,
    uvi: 3,
  },
  outcome: 'dawn',
};

describe('buildKoreanPost', () => {
  it('renders hook, date, air, dawn/evening bands, and the recommendation', () => {
    const post = buildKoreanPost(base, DT, '방콕, 오늘 언제 뛸까? 🏃', '오늘은 새벽이 베스트! 🌅');
    const lines = post.split('\n');
    expect(lines[0]).toBe('방콕, 오늘 언제 뛸까? 🏃');
    expect(lines[1]).toBe('2026.05.24 (일)');
    expect(post).toContain('😷 미세먼지: 나쁨 (AQI 111)');
    expect(post).toContain('🌅 새벽 🟡 5–7시 · 더위 주의 28°C · 자외선 낮음');
    expect(post).toContain('🌆 저녁 🔴 18시쯤 · 더위 위험 33°C · 자외선 보통');
    expect(post).toContain('오늘은 새벽이 베스트! 🌅');
  });

  it('uses Korean only — no English verdict words', () => {
    expect(buildKoreanPost(base, DT, 'hook', 'rec')).not.toMatch(/\b(GO|SKIP|CAUTION)\b/);
  });

  it('shows the good window as a range and a SKIP band as the coolest hour', () => {
    const post = buildKoreanPost(base, DT, 'h', 'r');
    expect(post).toContain('새벽 🟡 5–7시'); // window range
    expect(post).toContain('저녁 🔴 18시쯤'); // coolest-hour fallback
  });
});
