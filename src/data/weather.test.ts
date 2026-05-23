import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWeather } from './weather.js';

function mockFetch(payload: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => payload });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

const SAMPLE = {
  current: { temp: 28.4, humidity: 78, uvi: 4, feels_like: 31.2 },
  hourly: [
    { dt: 100, temp: 28.4, humidity: 78, uvi: 0 },
    { dt: 200, temp: 29.1, humidity: 75, uvi: 9 },
  ],
};

describe('fetchWeather', () => {
  it('maps current conditions and hourly forecast', async () => {
    const fn = mockFetch(SAMPLE);
    const result = await fetchWeather('key123');
    expect(result.current).toEqual({ temp: 28.4, humidity: 78, uvi: 4, feelsLike: 31.2 });
    expect(result.hourly).toEqual([
      { dt: 100, temp: 28.4, humidity: 78, uvi: 0 },
      { dt: 200, temp: 29.1, humidity: 75, uvi: 9 },
    ]);
    const url = String(fn.mock.calls[0]![0]);
    expect(url).toContain('onecall');
    expect(url).toContain('lat=13.7234');
    expect(url).toContain('lon=100.5601');
    expect(url).toContain('units=metric');
    expect(url).toContain('appid=key123');
  });

  it('rejects on a non-ok HTTP response', async () => {
    mockFetch({ message: 'Unauthorized' }, false);
    await expect(fetchWeather('bad')).rejects.toThrow();
  });

  it('rejects when the payload is missing current/hourly', async () => {
    mockFetch({ current: { temp: 1, humidity: 1, uvi: 1, feels_like: 1 } });
    await expect(fetchWeather('key')).rejects.toThrow(/hourly/);
  });
});
