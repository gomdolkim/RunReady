import { LOCATION } from '../config.js';
import type { AirQuality } from '../types.js';
import { getJson } from '../util/http.js';

interface WaqiResponse {
  status?: string;
  data?: { iaqi?: { pm25?: { v?: number } } };
}

/** Fetch current PM2.5 for the location from the WAQI nearest-station (geo) feed. */
export async function fetchAirQuality(token: string): Promise<AirQuality> {
  const url =
    `https://api.waqi.info/feed/geo:${LOCATION.lat};${LOCATION.lon}/` +
    `?token=${encodeURIComponent(token)}`;
  const body = (await getJson(url)) as WaqiResponse;

  if (body.status !== 'ok') {
    throw new Error(`WAQI returned status "${body.status ?? 'unknown'}"`);
  }
  const pm25 = body.data?.iaqi?.pm25?.v;
  if (typeof pm25 !== 'number') {
    throw new Error('WAQI feed missing PM2.5 reading');
  }
  return { pm25 };
}
