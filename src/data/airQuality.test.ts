import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSpotAir } from './airQuality.js';

function mockFetch(payload: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => payload });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchSpotAir', () => {
  it('returns the nearest station PM2.5 AQI and station name for the coords', async () => {
    const fn = mockFetch({
      status: 'ok',
      data: { aqi: 70, iaqi: { pm25: { v: 42 } }, city: { name: 'Bangkok – Chong Nonsi' } },
    });
    expect(await fetchSpotAir('tok', 13.73, 100.53)).toEqual({
      aqi: 42,
      station: 'Bangkok – Chong Nonsi',
    });
    const url = String(fn.mock.calls[0]![0]);
    expect(url).toContain('geo:13.73;100.53');
    expect(url).toContain('token=tok');
  });

  it('falls back to overall aqi when pm25 sub-index is absent', async () => {
    mockFetch({ status: 'ok', data: { aqi: 55, city: { name: 'X' } } });
    expect(await fetchSpotAir('tok', 1, 2)).toEqual({ aqi: 55, station: 'X' });
  });

  it('rejects when WAQI status is not ok', async () => {
    mockFetch({ status: 'error' });
    await expect(fetchSpotAir('bad', 1, 2)).rejects.toThrow(/WAQI/);
  });
});
