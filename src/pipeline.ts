import { recommendTimes } from './logic/goldenWindow.js';
import { verdict } from './logic/verdict.js';
import { wbgt } from './logic/wbgt.js';
import { pickClosingLine } from './message/closingLines.js';
import { pickHook } from './message/hooks.js';
import { buildKoreanPost } from './message/koTemplate.js';
import type { AirQuality, Conditions, HourlyPm25, Weather } from './types.js';

/** Combine raw data sources into the conditions used to render a post. */
export function buildConditions(
  aq: AirQuality,
  weather: Weather,
  forecast: HourlyPm25[],
): Conditions {
  const { temp, humidity, uvi } = weather.current;
  const wbgtValue = wbgt(temp, humidity);
  return {
    pm25: aq.pm25,
    temp,
    humidity,
    uvi,
    wbgt: wbgtValue,
    grade: verdict(aq.pm25, wbgtValue),
    times: recommendTimes(weather.hourly, forecast),
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
