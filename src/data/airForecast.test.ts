import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAirForecast } from './airForecast.js';

function mockFetch(payload: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => payload });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchAirForecast', () => {
  it('maps the hourly PM2.5 forecast list', async () => {
    const fn = mockFetch({
      list: [
        { dt: 100, components: { pm2_5: 20.1 } },
        { dt: 200, components: { pm2_5: 30.4 } },
      ],
    });
    const result = await fetchAirForecast('key123');
    expect(result).toEqual([
      { dt: 100, pm25: 20.1 },
      { dt: 200, pm25: 30.4 },
    ]);
    const url = String(fn.mock.calls[0]![0]);
    expect(url).toContain('air_pollution/forecast');
    expect(url).toContain('lat=13.7234');
    expect(url).toContain('lon=100.5601');
    expect(url).toContain('appid=key123');
  });

  it('rejects when the list is missing', async () => {
    mockFetch({});
    await expect(fetchAirForecast('key')).rejects.toThrow(/forecast/i);
  });
});
