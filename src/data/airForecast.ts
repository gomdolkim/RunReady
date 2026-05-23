import { LOCATION } from '../config.js';
import type { HourlyPm25 } from '../types.js';
import { getJson } from '../util/http.js';

interface AirPollutionResponse {
  list?: Array<{ dt?: number; components?: { pm2_5?: number } }>;
}

/** Fetch the hourly PM2.5 forecast from OpenWeather Air Pollution. */
export async function fetchAirForecast(apiKey: string): Promise<HourlyPm25[]> {
  const url =
    `https://api.openweathermap.org/data/2.5/air_pollution/forecast` +
    `?lat=${LOCATION.lat}&lon=${LOCATION.lon}&appid=${encodeURIComponent(apiKey)}`;
  const body = (await getJson(url)) as AirPollutionResponse;

  if (!Array.isArray(body.list)) {
    throw new Error('Air pollution forecast missing list');
  }

  return body.list.map((entry) => {
    const pm25 = entry.components?.pm2_5;
    if (typeof entry.dt !== 'number' || typeof pm25 !== 'number') {
      throw new Error('Air pollution forecast entry missing fields');
    }
    return { dt: entry.dt, pm25 };
  });
}
