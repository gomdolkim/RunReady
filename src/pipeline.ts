import { GOLDEN } from './config.js';
import { analyzeBand, decideOutcome } from './logic/bands.js';
import { pickHook } from './message/hooks.js';
import { buildKoreanPost } from './message/koTemplate.js';
import { pickRecommendation } from './message/recommend.js';
import type { AirQuality, Conditions, Weather } from './types.js';

/**
 * Combine raw data into runner-centric conditions: analyse the dawn and evening
 * bands (when to run + conditions then) gated by per-hour heat and the day's
 * air, then decide which band to recommend.
 */
export function buildConditions(aq: AirQuality, weather: Weather): Conditions {
  const dawn = analyzeBand(weather.hourly, GOLDEN.bands.dawn, aq.aqi);
  const evening = analyzeBand(weather.hourly, GOLDEN.bands.evening, aq.aqi);
  return { aqi: aq.aqi, dawn, evening, outcome: decideOutcome(dawn, evening) };
}

/**
 * Build the Korean post end-to-end. The hook and recommendation rotate by day
 * of year (passed via `nowSeconds`), so the post stays fresh without randomness.
 */
export function buildPost(aq: AirQuality, weather: Weather, nowSeconds: number): string {
  const conditions = buildConditions(aq, weather);
  const hook = pickHook(nowSeconds);
  const recommendation = pickRecommendation(conditions.outcome, nowSeconds);
  return buildKoreanPost(conditions, nowSeconds, hook, recommendation);
}
