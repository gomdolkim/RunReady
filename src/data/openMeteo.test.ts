import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWeather } from './openMeteo.js';
import { bangkokHour } from '../util/time.js';

function mockFetch(payload: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => payload });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

const SAMPLE = {
  utc_offset_seconds: 25200,
  hourly: {
    time: ['2026-05-24T05:00', '2026-05-24T06:00'],
    temperature_2m: [24.5, 25.1],
    relative_humidity_2m: [80, 78],
    uv_index: [0.4, 1.9],
    precipitation_probability: [10, 60],
  },
};

describe('fetchWeather (Open-Meteo)', () => {
  it('maps hourly arrays into HourlyWeather with Bangkok-correct hours', async () => {
    const fn = mockFetch(SAMPLE);
    const hours = await fetchWeather(13.72, 100.56);

    expect(hours).toHaveLength(2);
    expect(hours[0]).toMatchObject({ temp: 24.5, humidity: 80, uvi: 0.4, precipProb: 10 });
    expect(hours[1]).toMatchObject({ temp: 25.1, humidity: 78, uvi: 1.9, precipProb: 60 });
    expect(bangkokHour(hours[0]!.dt)).toBe(5);
    expect(bangkokHour(hours[1]!.dt)).toBe(6);

    const url = String(fn.mock.calls[0]![0]);
    expect(url).toContain('open-meteo.com');
    expect(url).toContain('latitude=13.72');
    expect(url).toContain('longitude=100.56');
    expect(url).toContain('precipitation_probability');
    expect(url).toContain('timezone=Asia%2FBangkok');
  });

  it('rejects on a non-ok HTTP response', async () => {
    mockFetch({}, false);
    await expect(fetchWeather(1, 2)).rejects.toThrow();
  });

  it('rejects when hourly data is missing', async () => {
    mockFetch({ utc_offset_seconds: 25200 });
    await expect(fetchWeather(1, 2)).rejects.toThrow(/hourly/);
  });
});
