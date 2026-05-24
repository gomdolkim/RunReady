import { GOLDEN } from './config.js';
import { analyzeBand } from './logic/bands.js';
import { rainHint } from './logic/rain.js';
import type { HourlyWeather, Spot, SpotAir, SpotConditions } from './types.js';

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
