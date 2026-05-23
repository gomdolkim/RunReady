import 'dotenv/config';
import { requireEnv } from './config.js';
import { fetchAirForecast } from './data/airForecast.js';
import { fetchAirQuality } from './data/airQuality.js';
import { fetchWeather } from './data/weather.js';
import { createClient, translate, type TargetLanguage } from './message/translate.js';
import { buildPost } from './pipeline.js';

/**
 * Phase 2 entry point: fetch data, build the Korean post, translate to English
 * and Thai, and print all three. Threads publishing (Phase 3) replaces the
 * console output later.
 *
 * Fail-visible: missing data/env aborts before any output. The Korean post is
 * required; each translation is best-effort (a failure is logged and skipped).
 */
async function main(): Promise<void> {
  const waqiToken = requireEnv('WAQI_TOKEN');
  const openweatherKey = requireEnv('OPENWEATHER_API_KEY');
  const anthropicKey = requireEnv('ANTHROPIC_API_KEY');

  const [airQuality, weather, forecast] = await Promise.all([
    fetchAirQuality(waqiToken),
    fetchWeather(openweatherKey),
    fetchAirForecast(openweatherKey),
  ]);

  const now = Math.floor(Date.now() / 1000);
  const koPost = buildPost(airQuality, weather, forecast, now);
  console.log(koPost);

  const client = createClient(anthropicKey);
  const targets: TargetLanguage[] = ['English', 'Thai'];
  for (const target of targets) {
    try {
      const translated = await translate(client, koPost, target, now);
      console.log(`\n--- ${target} ---\n${translated}`);
    } catch (err: unknown) {
      console.error(
        `[wat-run] ${target} translation skipped:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
}

main().catch((err: unknown) => {
  console.error('[wat-run] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
