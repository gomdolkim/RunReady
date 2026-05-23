import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAirQuality } from './airQuality.js';

function mockFetch(payload: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => payload });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchAirQuality', () => {
  it('extracts current PM2.5 from the WAQI feed', async () => {
    const fn = mockFetch({ status: 'ok', data: { iaqi: { pm25: { v: 32 } } } });
    const result = await fetchAirQuality('tok123');
    expect(result).toEqual({ pm25: 32 });
    const url = String(fn.mock.calls[0]![0]);
    expect(url).toContain('waqi.info');
    expect(url).toContain('geo:13.7234;100.5601');
    expect(url).toContain('token=tok123');
  });

  it('rejects when WAQI status is not ok', async () => {
    mockFetch({ status: 'error', data: 'Invalid key' });
    await expect(fetchAirQuality('bad')).rejects.toThrow(/WAQI/);
  });

  it('rejects when PM2.5 is absent from the feed', async () => {
    mockFetch({ status: 'ok', data: { iaqi: {} } });
    await expect(fetchAirQuality('tok')).rejects.toThrow(/PM2\.5/);
  });
});
