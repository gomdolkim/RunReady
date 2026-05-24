import type { HourlyWeather } from '../types.js';
import { getJson } from '../util/http.js';

interface OpenMeteoResponse {
  utc_offset_seconds?: number;
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    uv_index?: number[];
    precipitation_probability?: number[];
  };
}

/**
 * Fetch today's + tomorrow's hourly weather for a coordinate from Open-Meteo
 * (no API key required). Times come back as local ISO (Asia/Bangkok) without an
 * offset, so each hour's UNIX timestamp is reconstructed from `utc_offset_seconds`.
 */
export async function fetchWeather(lat: number, lon: number): Promise<HourlyWeather[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,relative_humidity_2m,uv_index,precipitation_probability` +
    `&timezone=Asia%2FBangkok&forecast_days=2`;
  const body = (await getJson(url)) as OpenMeteoResponse;

  const h = body.hourly;
  if (
    !h ||
    !Array.isArray(h.time) ||
    !Array.isArray(h.temperature_2m) ||
    !Array.isArray(h.relative_humidity_2m)
  ) {
    throw new Error('Open-Meteo response missing hourly data');
  }
  const offset = typeof body.utc_offset_seconds === 'number' ? body.utc_offset_seconds : 25200;

  const out: HourlyWeather[] = [];
  for (let i = 0; i < h.time.length; i++) {
    const iso = h.time[i];
    const temp = h.temperature_2m[i];
    const humidity = h.relative_humidity_2m[i];
    if (typeof iso !== 'string' || typeof temp !== 'number' || typeof humidity !== 'number') continue;
    const dt = Math.floor(Date.parse(`${iso}:00Z`) / 1000) - offset;
    out.push({
      dt,
      temp,
      humidity,
      uvi: typeof h.uv_index?.[i] === 'number' ? h.uv_index[i]! : 0,
      precipProb:
        typeof h.precipitation_probability?.[i] === 'number' ? h.precipitation_probability[i]! : 0,
    });
  }
  if (out.length === 0) throw new Error('Open-Meteo returned no usable hours');
  return out;
}
