import { describe, expect, it } from 'vitest';
import { assertUnder500, validateTranslation } from './validate.js';

const SOURCE = [
  '방콕, 오늘 뛸 수 있을까? 🏃',
  '2026.05.24 (일)',
  '',
  '🔴 한낮 실외는 무리예요',
  '',
  '😷 미세먼지: 나쁨 (58)',
  '🥵 더위: 매우 위험 (35.6°C·습도 61%)',
  '🧴 자외선: 보통 (5)',
  '',
  '⏰ 뛰기 좋은 시간: 마땅한 때 없음 — 그나마 05:00 무렵',
  '',
  '오늘은 트레드밀에서 만나요 💪',
].join('\n');

const VALID_EN = [
  'Can you run in Bangkok today? 🏃',
  'May 24, 2026 (Sun)',
  '',
  '🔴 Too hot to run outside at midday',
  '',
  '😷 Air quality: Bad (58)',
  '🥵 Heat: Extreme (35.6°C·61% humidity)',
  '🧴 UV: Moderate (5)',
  '',
  '⏰ Best time to run: none — 05:00 is the least bad',
  '',
  'See you on the treadmill 💪',
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

  it('allows the date line to localize the year (Thai Buddhist year)', () => {
    const th = VALID_EN.replace('May 24, 2026 (Sun)', '24 พ.ค. 2569 (อา.)');
    expect(() => validateTranslation(SOURCE, th)).not.toThrow();
  });

  it('rejects a translation that drops a data number', () => {
    const dropped = VALID_EN.replace('Bad (58)', 'Bad');
    expect(() => validateTranslation(SOURCE, dropped)).toThrow(/number/i);
  });

  it('rejects a translation that drops an emoji', () => {
    const dropped = VALID_EN.replace('😷 ', '');
    expect(() => validateTranslation(SOURCE, dropped)).toThrow(/emoji/i);
  });

  it('rejects a translation with a different line-break count', () => {
    const collapsed = VALID_EN.replace('\n\n😷', '\n😷');
    expect(() => validateTranslation(SOURCE, collapsed)).toThrow(/line-break/i);
  });

  it('rejects a translation over 500 characters', () => {
    const tooLong = VALID_EN + '\n' + 'x'.repeat(500);
    expect(() => validateTranslation(SOURCE, tooLong)).toThrow(/500/);
  });
});
