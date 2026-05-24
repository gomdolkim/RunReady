import { describe, expect, it } from 'vitest';
import { buildSpotConditions } from './pipeline.js';
import type { HourlyWeather, Spot, SpotAir } from './types.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

const spot: Spot = {
  id: 'benjakitti', nameKo: '벤짜낏', nameEn: 'Benjakitti', nameTh: 'เบญจกิติ',
  area: '아속', blurbKo: '숲길', lat: 13.72, lon: 100.56, loopKm: 1.9, shade: 2, tag: 'Benjakitti',
};

const cleanDawn: HourlyWeather[] = [
  { dt: bkk(5), temp: 24, humidity: 50, uvi: 1, precipProb: 0 },
  { dt: bkk(6), temp: 24, humidity: 50, uvi: 1, precipProb: 0 },
  { dt: bkk(13), temp: 36, humidity: 55, uvi: 11, precipProb: 0 },
];

describe('buildSpotConditions', () => {
  it('grades the dawn band with the spot air and reports conditions + station', () => {
    const air: SpotAir = { aqi: 42, station: 'Bangkok – Sathon' };
    const c = buildSpotConditions(spot, cleanDawn, air);
    expect(c.spot.id).toBe('benjakitti');
    expect(c.grade).toBe('GO');
    expect(c.window).toEqual({ start: '05:00', end: '07:00', quality: 'best' });
    expect(c.aqi).toBe(42);
    expect(c.station).toBe('Bangkok – Sathon');
    expect(c.rainHint).toBeNull();
    expect(Math.round(c.temp)).toBe(24);
  });

  it('downgrades and surfaces a rain hint when air is bad and dawn is wet', () => {
    const wet: HourlyWeather[] = [
      { dt: bkk(5), temp: 24, humidity: 50, uvi: 1, precipProb: 80 },
      { dt: bkk(6), temp: 24, humidity: 50, uvi: 1, precipProb: 70 },
    ];
    const air: SpotAir = { aqi: 160, station: 'X' }; // above good gate (100)
    const c = buildSpotConditions(spot, wet, air);
    expect(c.grade).toBe('SKIP');
    expect(c.rainHint).toBe('🌧️ 5–6시 소나기 가능 — 우산 챙겨요');
  });
});
