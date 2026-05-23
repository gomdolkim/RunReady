import { describe, expect, it } from 'vitest';
import { assertUnder500, validateTranslation } from './validate.js';

const SOURCE = [
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
  '',
  '뛰러 가요! 🏃',
].join('\n');

const VALID_EN = [
  '☀️ Wat Run? — May 24, 2026 (Sun)',
  'Today: 🟢 GO',
  '',
  '📊 PM2.5: 32 μg/m³',
  '🌡️ Temp: 28.4°C (WBGT 26.8)',
  '💧 Humidity: 78%',
  '☂️ UV: 4',
  '',
  '🌅 Golden windows',
  '05:00–07:00 (best)',
  '',
  "Let's run! 🏃",
].join('\n');

describe('assertUnder500', () => {
  it('passes for text at or under 500 characters', () => {
    expect(() => assertUnder500('a'.repeat(500))).not.toThrow();
  });
  it('throws for text over 500 characters', () => {
    expect(() => assertUnder500('a'.repeat(501))).toThrow(/500/);
  });
});

describe('validateTranslation', () => {
  it('accepts a faithful translation', () => {
    expect(() => validateTranslation(SOURCE, VALID_EN)).not.toThrow();
  });

  it('allows the date header to localize the year (Thai Buddhist year)', () => {
    const th = VALID_EN.replace('May 24, 2026 (Sun)', '24 พ.ค. 2569 (อา.)');
    expect(() => validateTranslation(SOURCE, th)).not.toThrow();
  });

  it('rejects a translation that drops a data number', () => {
    const dropped = VALID_EN.replace('PM2.5: 32', 'PM2.5:');
    expect(() => validateTranslation(SOURCE, dropped)).toThrow(/number/i);
  });

  it('rejects a translation that drops an emoji', () => {
    const dropped = VALID_EN.replace('🟢 ', '');
    expect(() => validateTranslation(SOURCE, dropped)).toThrow(/emoji/i);
  });

  it('rejects a translation with a different line-break count', () => {
    const collapsed = VALID_EN.replace('\n\n🌅', '\n🌅');
    expect(() => validateTranslation(SOURCE, collapsed)).toThrow(/line-break/i);
  });

  it('rejects a translation over 500 characters', () => {
    const tooLong = VALID_EN + '\n' + 'x'.repeat(500);
    expect(() => validateTranslation(SOURCE, tooLong)).toThrow(/500/);
  });
});
