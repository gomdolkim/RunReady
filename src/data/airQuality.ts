import type { SpotAir } from '../types.js';
import { getJson } from '../util/http.js';

interface WaqiSpotResponse {
  status?: string;
  data?: {
    aqi?: number;
    iaqi?: { pm25?: { v?: number } };
    city?: { name?: string };
  };
}

/**
 * Fetch the air reading at a spot from the WAQI station nearest its coordinates
 * (the geo feed auto-selects the closest station). Prefers the PM2.5 sub-index
 * (what runners care about), falling back to the overall AQI.
 */
export async function fetchSpotAir(token: string, lat: number, lon: number): Promise<SpotAir> {
  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${encodeURIComponent(token)}`;
  const body = (await getJson(url)) as WaqiSpotResponse;

  if (body.status !== 'ok') {
    throw new Error(`WAQI returned status "${body.status ?? 'unknown'}"`);
  }
  const pm25 = body.data?.iaqi?.pm25?.v;
  const value = typeof pm25 === 'number' ? pm25 : body.data?.aqi;
  if (typeof value !== 'number') {
    throw new Error('WAQI feed missing AQI reading');
  }
  return { aqi: Math.round(value), station: body.data?.city?.name ?? 'Unknown station' };
}
