import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAirQuality } from './airQuality.js';

function mockFetch(payload: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => payload });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchAirQuality', () => {
  it("uses today's daily forecast avg/min/max when available", async () => {
    const fn = mockFetch({
      status: 'ok',
      data: {
        iaqi: { pm25: { v: 53 } },
        forecast: { daily: { pm25: [{ day: '2099-01-01', avg: 107, min: 68, max: 152 }] } },
      },
    });
    expect(await fetchAirQuality('tok123')).toEqual({ avg: 107, min: 68, max: 152 });
    const url = String(fn.mock.calls[0]![0]);
    expect(url).toContain('waqi.info');
    expect(url).toContain('geo:13.7234;100.5601');
    expect(url).toContain('token=tok123');
  });

  it('falls back to the current AQI (flat range) when there is no forecast', async () => {
    mockFetch({ status: 'ok', data: { iaqi: { pm25: { v: 53 } } } });
    expect(await fetchAirQuality('tok')).toEqual({ avg: 53, min: 53, max: 53 });
  });

  it('rejects when WAQI status is not ok', async () => {
    mockFetch({ status: 'error', data: 'Invalid key' });
    await expect(fetchAirQuality('bad')).rejects.toThrow(/WAQI/);
  });

  it('rejects when PM2.5 is absent entirely', async () => {
    mockFetch({ status: 'ok', data: { iaqi: {} } });
    await expect(fetchAirQuality('tok')).rejects.toThrow(/PM2\.5/);
  });
});
