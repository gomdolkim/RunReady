import { describe, expect, it } from 'vitest';
import { assertUnder500, validateTranslation } from './validate.js';

const SOURCE = [
  '방콕, 오늘 언제 뛸까? 🏃',
  '2026.05.24 (일)',
  '',
  '😷 미세먼지: 나쁨 (AQI 111)',
  '',
  '🌅 새벽 🔴 5시쯤 · 더위 좋음 26°C · 자외선 낮음',
  '🌆 저녁 🔴 19시쯤 · 더위 위험 31°C · 자외선 낮음',
  '',
  '오늘은 실내가 정답이에요 💪',
].join('\n');

// Times localize (5시 → 5 AM, 19시 → 7 PM); AQI and temps stay.
const VALID_EN = [
  'When should you run in Bangkok today? 🏃',
  'May 24, 2026 (Sun)',
  '',
  '😷 Air quality: Poor (AQI 111)',
  '',
  '🌅 Dawn 🔴 around 5 AM · Heat fine 26°C · UV low',
  '🌆 Evening 🔴 around 7 PM · Heat dangerous 31°C · UV low',
  '',
  'Indoor is the answer today 💪',
].join('\n');

describe('assertUnder500', () => {
  it('passes at or under 500 characters', () => {
    expect(() => assertUnder500('a'.repeat(500))).not.toThrow();
  });
  it('throws over 500 characters', () => {
    expect(() => assertUnder500('a'.repeat(501))).toThrow(/500/);
  });
});

describe('validateTranslation', () => {
  it('accepts a faithful translation, even when 24h times become AM/PM', () => {
    expect(() => validateTranslation(SOURCE, VALID_EN)).not.toThrow();
  });

  it('allows the date line to localize the year (Thai Buddhist year)', () => {
    const th = VALID_EN.replace('May 24, 2026 (Sun)', '24 พ.ค. 2569 (อา.)');
    expect(() => validateTranslation(SOURCE, th)).not.toThrow();
  });

  it('rejects a dropped metric number (temperature)', () => {
    const dropped = VALID_EN.replace('26°C', '°C');
    expect(() => validateTranslation(SOURCE, dropped)).toThrow(/number/i);
  });

  it('rejects a translation that left Korean untranslated', () => {
    const partial = VALID_EN.replace('Poor', '나쁨'); // model left a Korean word
    expect(() => validateTranslation(SOURCE, partial)).toThrow(/Korean/i);
  });

  it('rejects a dropped emoji', () => {
    const dropped = VALID_EN.replace('😷 ', '');
    expect(() => validateTranslation(SOURCE, dropped)).toThrow(/emoji/i);
  });

  it('rejects a different line-break count', () => {
    const collapsed = VALID_EN.replace('\n\n😷', '\n😷');
    expect(() => validateTranslation(SOURCE, collapsed)).toThrow(/line-break/i);
  });

  it('rejects over 500 characters', () => {
    expect(() => validateTranslation(SOURCE, VALID_EN + '\n' + 'x'.repeat(500))).toThrow(/500/);
  });
});
