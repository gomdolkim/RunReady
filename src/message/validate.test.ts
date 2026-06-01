import { describe, expect, it } from 'vitest';
import { assertUnder500, validateTranslation, validatePlaceTranslation } from './validate.js';

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

const PLACE_KO = [
  '🐱 소이캣의 오늘의 방콕',
  '2026.05.24 (일)',
  '',
  '📍 라마 8세 다리 · 강변',
  '우아한 비대칭 사장교.',
  '',
  '👀 볼거리: 84층 전망, 야경',
  '🚇 가는 법: 택시가 편해요',
  '',
  '오늘은 여기 어때요? 소이캣과 함께 🐾',
].join('\n');

const PLACE_EN = [
  'Soi Cat’s Bangkok pick of the day 🐱',
  'May 24, 2026 (Sun)',
  '',
  '📍 Rama VIII Bridge · Riverside',
  'An elegant asymmetric cable-stayed bridge.',
  '',
  '👀 See: 84th-floor view, night scenery',
  '🚇 Getting there: a taxi is easiest',
  '',
  'How about here today? With Soi Cat 🐾',
].join('\n');

describe('validatePlaceTranslation', () => {
  it('accepts a faithful place translation', () => {
    expect(() => validatePlaceTranslation(PLACE_KO, PLACE_EN)).not.toThrow();
  });

  it('allows numbers to change form across languages (8세 → VIII)', () => {
    // "라마 8세" becomes "Rama VIII" — the digit 8 disappears, which is fine.
    expect(PLACE_EN).not.toContain('8 ');
    expect(() => validatePlaceTranslation(PLACE_KO, PLACE_EN)).not.toThrow();
  });

  it('still rejects leftover Korean', () => {
    const partial = PLACE_EN.replace('night scenery', '야경');
    expect(() => validatePlaceTranslation(PLACE_KO, partial)).toThrow(/Korean/i);
  });

  it('still rejects a dropped emoji', () => {
    const dropped = PLACE_EN.replace('🚇 ', '');
    expect(() => validatePlaceTranslation(PLACE_KO, dropped)).toThrow(/emoji/i);
  });

  it('still rejects a different line-break count', () => {
    const collapsed = PLACE_EN.replace('\n\n📍', '\n📍');
    expect(() => validatePlaceTranslation(PLACE_KO, collapsed)).toThrow(/line-break/i);
  });
});
