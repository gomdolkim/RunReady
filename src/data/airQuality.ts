import { LOCATION } from '../config.js';
import type { AirQuality } from '../types.js';
import { getJson } from '../util/http.js';
import { bangkokDateKey } from '../util/time.js';

interface WaqiResponse {
  status?: string;
  data?: {
    iaqi?: { pm25?: { v?: number } };
    forecast?: { daily?: { pm25?: Array<{ day?: string; avg?: number }> } };
  };
}

/**
 * Fetch today's PM2.5 US AQI for the location from WAQI/aqicn (geo feed).
 * Prefers the daily forecast average for today (whole-day) and falls back to
 * the current reading. The value is the US AQI — the same scale aqicn shows.
 */
export async function fetchAirQuality(token: string): Promise<AirQuality> {
  const url =
    `https://api.waqi.info/feed/geo:${LOCATION.lat};${LOCATION.lon}/` +
    `?token=${encodeURIComponent(token)}`;
  const body = (await getJson(url)) as WaqiResponse;

  if (body.status !== 'ok') {
    throw new Error(`WAQI returned status "${body.status ?? 'unknown'}"`);
  }

  const current = body.data?.iaqi?.pm25?.v;
  const daily = body.data?.forecast?.daily?.pm25 ?? [];
  const todayKey = bangkokDateKey(Math.floor(Date.now() / 1000));
  const todayEntry = daily.find((d) => d.day === todayKey) ?? daily[0];

  const aqi = todayEntry?.avg ?? current;
  if (typeof aqi !== 'number') {
    throw new Error('WAQI feed missing PM2.5 reading');
  }
  return { aqi };
}
