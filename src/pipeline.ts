import { GOLDEN } from './config.js';
import { analyzeBand, decideOutcome } from './logic/bands.js';
import { rainHint } from './logic/rain.js';
import { pickHook } from './message/hooks.js';
import { buildKoreanPost } from './message/koTemplate.js';
import { pickRecommendation } from './message/recommend.js';
import type {
  AirQuality,
  Conditions,
  HourlyWeather,
  Spot,
  SpotAir,
  SpotConditions,
  Weather,
} from './types.js';

/**
 * Combine raw data into runner-centric conditions: analyse the dawn and evening
 * bands (when to run + conditions then) gated by per-hour heat and the day's
 * air, then decide which band to recommend.
 */
export function buildConditions(aq: AirQuality, weather: Weather): Conditions {
  const dawn = analyzeBand(weather.hourly, GOLDEN.bands.dawn, aq.avg);
  const evening = analyzeBand(weather.hourly, GOLDEN.bands.evening, aq.avg);
  return { aqiMin: aq.min, aqiMax: aq.max, dawn, evening, outcome: decideOutcome(dawn, evening) };
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

/**
 * Combine a spot, its hourly weather, and its air reading into the data a
 * "spot of the day" post needs: grade + best window for the dawn band (gated by
 * per-hour heat and the spot's air), conditions at the best hour, and a rain hint.
 */
export function buildSpotConditions(
  spot: Spot,
  hourly: HourlyWeather[],
  air: SpotAir,
): SpotConditions {
  const band = analyzeBand(hourly, GOLDEN.bands.dawn, air.aqi);
  return {
    spot,
    grade: band.grade,
    window: band.window,
    bestHour: band.coolestHour,
    wbgt: band.wbgt,
    temp: band.temp,
    uvi: band.uvi,
    aqi: air.aqi,
    station: air.station,
    rainHint: rainHint(hourly, GOLDEN.bands.dawn),
  };
}
