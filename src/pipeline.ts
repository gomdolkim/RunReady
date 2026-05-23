import { avgPm25Today, peakHeat, peakUv } from './logic/daySummary.js';
import { recommendTimes } from './logic/goldenWindow.js';
import { verdictFromTimes } from './logic/verdict.js';
import { wbgt } from './logic/wbgt.js';
import { pickClosingLine } from './message/closingLines.js';
import { pickHook } from './message/hooks.js';
import { buildKoreanPost } from './message/koTemplate.js';
import type { AirQuality, Conditions, HourlyPm25, Weather } from './types.js';

/**
 * Combine raw data into conditions, summarized over the whole day's hourly
 * forecast: average PM2.5, the midday heat/UV peaks, and the running windows.
 * The verdict follows from the windows. Falls back to current readings only if
 * the hourly forecast is unavailable.
 */
export function buildConditions(
  aq: AirQuality,
  weather: Weather,
  forecast: HourlyPm25[],
): Conditions {
  const times = recommendTimes(weather.hourly, forecast);
  const heat = peakHeat(weather.hourly);
  const uv = peakUv(weather.hourly);
  const pm25 = avgPm25Today(forecast);

  return {
    grade: verdictFromTimes(times),
    pm25: pm25 ?? aq.pm25,
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
export function buildPost(
  aq: AirQuality,
  weather: Weather,
  forecast: HourlyPm25[],
  nowSeconds: number,
): string {
  const conditions = buildConditions(aq, weather, forecast);
  const hook = pickHook(nowSeconds);
  const closing = pickClosingLine(conditions.grade, nowSeconds);
  return buildKoreanPost(conditions, nowSeconds, hook, closing);
}
