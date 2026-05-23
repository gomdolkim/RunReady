import { peakHeat, peakUv } from './logic/daySummary.js';
import { recommendTimes } from './logic/goldenWindow.js';
import { verdictFromTimes } from './logic/verdict.js';
import { wbgt } from './logic/wbgt.js';
import { pickClosingLine } from './message/closingLines.js';
import { pickHook } from './message/hooks.js';
import { buildKoreanPost } from './message/koTemplate.js';
import type { AirQuality, Conditions, Weather } from './types.js';

/**
 * Combine raw data into conditions, summarized over the whole day's hourly
 * forecast: today's PM2.5 AQI (WAQI), the midday heat/UV peaks, and the running
 * windows. The verdict follows from the windows. Peaks fall back to the current
 * reading only when the hourly forecast is unavailable.
 */
export function buildConditions(aq: AirQuality, weather: Weather): Conditions {
  const times = recommendTimes(weather.hourly, aq.aqi);
  const heat = peakHeat(weather.hourly);
  const uv = peakUv(weather.hourly);

  return {
    grade: verdictFromTimes(times),
    aqi: aq.aqi,
    peakTemp: heat?.temp ?? weather.current.temp,
    peakWbgt: heat?.wbgt ?? wbgt(weather.current.temp, weather.current.humidity),
    peakUv: uv ?? weather.current.uvi,
    times,
  };
}

/**
 * Build the Korean post end-to-end. The hook and closing line rotate by day of
 * year (passed via `nowSeconds`), so the post stays fresh without randomness.
 */
export function buildPost(aq: AirQuality, weather: Weather, nowSeconds: number): string {
  const conditions = buildConditions(aq, weather);
  const hook = pickHook(nowSeconds);
  const closing = pickClosingLine(conditions.grade, nowSeconds);
  return buildKoreanPost(conditions, nowSeconds, hook, closing);
}
