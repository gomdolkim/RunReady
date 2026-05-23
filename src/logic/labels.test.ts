import { describe, expect, it } from 'vitest';
import { pm25Label, heatLabel, uvLabel } from './labels.js';

describe('pm25Label', () => {
  it('labels by Korean air-quality grade', () => {
    expect(pm25Label(20)).toBe('좋음');
    expect(pm25Label(34)).toBe('좋음');
    expect(pm25Label(35)).toBe('보통');
    expect(pm25Label(54)).toBe('보통');
    expect(pm25Label(55)).toBe('나쁨');
    expect(pm25Label(74)).toBe('나쁨');
    expect(pm25Label(75)).toBe('매우 나쁨');
    expect(pm25Label(120)).toBe('매우 나쁨');
  });
});

describe('heatLabel', () => {
  it('labels heat danger from WBGT, aligned with the verdict thresholds', () => {
    expect(heatLabel(25)).toBe('좋음');
    expect(heatLabel(29.9)).toBe('좋음');
    expect(heatLabel(30)).toBe('주의');
    expect(heatLabel(32.4)).toBe('주의');
    expect(heatLabel(32.5)).toBe('위험');
    expect(heatLabel(34.9)).toBe('위험');
    expect(heatLabel(35)).toBe('매우 위험');
    expect(heatLabel(38)).toBe('매우 위험');
  });
});

describe('uvLabel', () => {
  it('labels by WHO UV index bands', () => {
    expect(uvLabel(0)).toBe('낮음');
    expect(uvLabel(2)).toBe('낮음');
    expect(uvLabel(3)).toBe('보통');
    expect(uvLabel(5)).toBe('보통');
    expect(uvLabel(6)).toBe('높음');
    expect(uvLabel(7)).toBe('높음');
    expect(uvLabel(8)).toBe('매우 높음');
    expect(uvLabel(10)).toBe('매우 높음');
    expect(uvLabel(11)).toBe('위험');
  });
});
