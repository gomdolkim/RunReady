import { describe, expect, it } from 'vitest';
import { buildPlacePost } from './placeTemplate.js';
import { assertUnder500 } from './validate.js';
import { PLACES } from '../content/places.js';
import type { Place } from '../types.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

const sample: Place = {
  id: 'wat-arun', nameKo: '왓 아룬(새벽사원)', nameEn: 'Wat Arun', nameTh: 'วัดอรุณ',
  area: '톤부리 강변',
  blurbKo: '강 건너에서 빛나는 도자기 탑.',
  seeKo: '거대한 중앙 쁘랑, 강 전망과 일몰',
  goKo: '따띠엔 선착장에서 크로스리버 페리',
  lat: 13.7437, lon: 100.4889, tag: 'WatArun',
};

describe('buildPlacePost', () => {
  it('renders the brand header, date on line 2, place, see and go lines', () => {
    const post = buildPlacePost(sample, bkk(5));
    const lines = post.split('\n');
    expect(lines[0]).toBe('🐱 소이캣의 오늘의 방콕');
    expect(lines[1]).toBe('2026.05.24 (일)');
    expect(post).toContain('📍 왓 아룬(새벽사원) · 톤부리 강변');
    expect(post).toContain('👀 볼거리: 거대한 중앙 쁘랑, 강 전망과 일몰');
    expect(post).toContain('🚇 가는 법: 따띠엔 선착장에서 크로스리버 페리');
    expect(post).toContain('🐾');
  });

  it('keeps every real place post under the 500-character limit', () => {
    for (const place of PLACES) {
      const post = buildPlacePost(place, bkk(5));
      expect(() => assertUnder500(post, place.id)).not.toThrow();
    }
  });

  it('rotates the closing line across days but keeps the header fixed', () => {
    const a = buildPlacePost(sample, bkk(5)).split('\n');
    const b = buildPlacePost(sample, bkk(5) + 86_400).split('\n');
    expect(a[0]).toBe(b[0]); // header fixed
    expect(a.at(-1)).not.toBe(b.at(-1)); // closing rotates
  });
});
