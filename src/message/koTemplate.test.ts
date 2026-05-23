import { describe, expect, it } from 'vitest';
import { buildKoreanPost } from './koTemplate.js';
import type { Conditions } from '../types.js';

// 2026-05-24 05:00 Bangkok
const DT = Date.UTC(2026, 4, 23, 22, 0, 0) / 1000;

const baseConditions: Conditions = {
  pm25: 32,
  temp: 28.4,
  humidity: 78,
  uvi: 4,
  wbgt: 26.8,
  grade: 'GO',
  windows: [
    { start: '05:00', end: '07:00', quality: 'best' },
    { start: '17:00', end: '19:00', quality: 'good' },
  ],
};

describe('buildKoreanPost', () => {
  it('renders the full template', () => {
    const expected = [
      '☀️ Wat Run? — 2026.05.24 (일)',
      '오늘 컨디션: 🟢 GO',
      '',
      '📊 PM2.5: 32 μg/m³',
      '🌡️ 기온: 28.4°C (WBGT 26.8)',
      '💧 습도: 78%',
      '☂️ UV: 4',
      '',
      '🌅 골든 윈도우',
      '05:00–07:00 (최적)',
      '17:00–19:00 (양호)',
      '',
      '뛰러 가요! 🏃',
    ].join('\n');
    expect(buildKoreanPost(baseConditions, DT, '뛰러 가요! 🏃')).toBe(expected);
  });

  it('rounds PM2.5, humidity and UV but keeps one decimal for temp/WBGT', () => {
    const post = buildKoreanPost(
      { ...baseConditions, pm25: 32.7, humidity: 77.6, uvi: 3.5, temp: 28.46, wbgt: 26.84 },
      DT,
      'x',
    );
    expect(post).toContain('📊 PM2.5: 33 μg/m³');
    expect(post).toContain('💧 습도: 78%');
    expect(post).toContain('☂️ UV: 4');
    expect(post).toContain('🌡️ 기온: 28.5°C (WBGT 26.8)');
  });

  it('uses the matching grade emoji', () => {
    expect(buildKoreanPost({ ...baseConditions, grade: 'CAUTION' }, DT, 'x')).toContain('오늘 컨디션: 🟡 CAUTION');
    expect(buildKoreanPost({ ...baseConditions, grade: 'SKIP' }, DT, 'x')).toContain('오늘 컨디션: 🔴 SKIP');
  });

  it('shows a fallback line when there are no golden windows', () => {
    const post = buildKoreanPost({ ...baseConditions, windows: [] }, DT, 'x');
    expect(post).toContain('🌅 골든 윈도우\n추천 시간대 없음');
  });
});
