import { requireEnv } from './config.js';
import { fetchAirForecast } from './data/airForecast.js';
import { fetchAirQuality } from './data/airQuality.js';
import { fetchWeather } from './data/weather.js';
import { buildPost } from './pipeline.js';

/**
 * Phase 1 entry point: fetch data, build the Korean post, print it.
 * Translation (Phase 2) and Threads publishing (Phase 3) are added later.
 *
 * Fail-visible: any fetch/validation error aborts with a non-zero exit code
 * rather than posting partial or wrong information.
 */
async function main(): Promise<void> {
  const waqiToken = requireEnv('WAQI_TOKEN');
  const openweatherKey = requireEnv('OPENWEATHER_API_KEY');

  const [airQuality, weather, forecast] = await Promise.all([
    fetchAirQuality(waqiToken),
    fetchWeather(openweatherKey),
    fetchAirForecast(openweatherKey),
  ]);

  const now = Math.floor(Date.now() / 1000);
  const post = buildPost(airQuality, weather, forecast, now);

  console.log(post);
}

main().catch((err: unknown) => {
  console.error('[wat-run] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
