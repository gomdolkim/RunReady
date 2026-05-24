import { LOCATION } from '../config.js';
import type { AirQuality, SpotAir } from '../types.js';
import { getJson } from '../util/http.js';
import { bangkokDateKey } from '../util/time.js';

interface WaqiResponse {
  status?: string;
  data?: {
    iaqi?: { pm25?: { v?: number } };
    forecast?: { daily?: { pm25?: Array<{ day?: string; avg?: number; min?: number; max?: number }> } };
  };
}

/**
 * Fetch today's PM2.5 US AQI for the location from WAQI/aqicn (geo feed).
 * Prefers the daily forecast (avg/min/max for today) and falls back to the
 * current reading. The value is the US AQI — the same scale aqicn shows.
 */
export async function fetchAirQuality(token: string): Promise<AirQuality> {
  const url =
    `https://api.waqi.info/feed/geo:${LOCATION.lat};${LOCATION.lon}/` +
    `?token=${encodeURIComponent(token)}`;
  const body = (await getJson(url)) as WaqiResponse;

  if (body.status !== 'ok') {
    throw new Error(`WAQI returned status "${body.status ?? 'unknown'}"`);
  }

  const daily = body.data?.forecast?.daily?.pm25 ?? [];
  const todayKey = bangkokDateKey(Math.floor(Date.now() / 1000));
  const today = daily.find((d) => d.day === todayKey) ?? daily[0];

  if (today && typeof today.avg === 'number') {
    const avg = today.avg;
    return { avg, min: today.min ?? avg, max: today.max ?? avg };
  }

  const current = body.data?.iaqi?.pm25?.v;
  if (typeof current === 'number') {
    return { avg: current, min: current, max: current };
  }
  throw new Error('WAQI feed missing PM2.5 reading');
}

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
