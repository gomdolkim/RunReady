import { goldenWindows } from './logic/goldenWindow.js';
import { verdict } from './logic/verdict.js';
import { wbgt } from './logic/wbgt.js';
import { pickClosingLine } from './message/closingLines.js';
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
    windows: goldenWindows(weather.hourly, forecast),
  };
}

/** Build the Korean post end-to-end. `rng` is injectable for deterministic tests. */
export function buildPost(
  aq: AirQuality,
  weather: Weather,
  forecast: HourlyPm25[],
  nowSeconds: number,
  rng: () => number = Math.random,
): string {
  const conditions = buildConditions(aq, weather, forecast);
  return buildKoreanPost(conditions, nowSeconds, pickClosingLine(conditions.grade, rng));
}
