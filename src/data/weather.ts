import { LOCATION } from '../config.js';
import type { Weather } from '../types.js';
import { getJson } from '../util/http.js';

interface OneCallResponse {
  current?: { temp?: number; humidity?: number; uvi?: number; feels_like?: number };
  hourly?: Array<{ dt?: number; temp?: number; humidity?: number; uvi?: number }>;
}

/** Fetch current + hourly Bangkok weather from OpenWeather One Call 3.0. */
export async function fetchWeather(apiKey: string): Promise<Weather> {
  const url =
    `https://api.openweathermap.org/data/3.0/onecall` +
    `?lat=${LOCATION.lat}&lon=${LOCATION.lon}&units=metric` +
    `&exclude=minutely,daily,alerts&appid=${encodeURIComponent(apiKey)}`;
  const body = (await getJson(url)) as OneCallResponse;

  const current = body.current;
  if (!current || typeof current.temp !== 'number' || typeof current.humidity !== 'number') {
    throw new Error('OpenWeather response missing current conditions');
  }
  if (!Array.isArray(body.hourly)) {
    throw new Error('OpenWeather response missing hourly forecast');
  }

  const hourly = body.hourly.map((h) => {
    if (typeof h.dt !== 'number' || typeof h.temp !== 'number' || typeof h.humidity !== 'number') {
      throw new Error('OpenWeather hourly entry missing fields');
    }
    return { dt: h.dt, temp: h.temp, humidity: h.humidity, uvi: typeof h.uvi === 'number' ? h.uvi : 0 };
  });

  return {
    current: {
      temp: current.temp,
      humidity: current.humidity,
      uvi: current.uvi ?? 0,
      feelsLike: current.feels_like ?? current.temp,
    },
    hourly,
  };
}
