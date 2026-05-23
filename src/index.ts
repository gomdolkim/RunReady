import 'dotenv/config';
import { requireEnv } from './config.js';
import { fetchAirForecast } from './data/airForecast.js';
import { fetchAirQuality } from './data/airQuality.js';
import { fetchWeather } from './data/weather.js';
import {
  createClient,
  translate,
  type TargetLanguage,
  type TranslationClient,
} from './message/translate.js';
import { buildPost } from './pipeline.js';
import { publishChain, type PostFn } from './threads/chain.js';
import { publishPost } from './threads/post.js';

/** Translate, returning null (and logging) on failure — replies are best-effort. */
async function translateSafe(
  client: TranslationClient,
  ko: string,
  target: TargetLanguage,
  dt: number,
): Promise<string | null> {
  try {
    return await translate(client, ko, target, dt);
  } catch (err: unknown) {
    console.error(
      `[wat-run] ${target} translation skipped:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Entry point: fetch data → build Korean post → translate → publish the 3-post
 * Threads chain. Pass --dry-run to print the posts instead of publishing
 * (no Threads token required).
 *
 * Fail-visible: missing data/env aborts before anything is posted. The Korean
 * post is required; each translation/reply is best-effort.
 */
async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

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

  const client = createClient(anthropicKey);
  const en = await translateSafe(client, koPost, 'English', now);
  const th = await translateSafe(client, koPost, 'Thai', now);

  if (dryRun) {
    console.log(koPost);
    if (en) console.log(`\n--- English ---\n${en}`);
    if (th) console.log(`\n--- Thai ---\n${th}`);
    console.log('\n[wat-run] dry run — nothing posted.');
    return;
  }

  const token = requireEnv('THREADS_ACCESS_TOKEN');
  const post: PostFn = (text, replyToId) => publishPost(token, text, replyToId);
  const result = await publishChain({ ko: koPost, en, th }, post);
  console.log('[wat-run] posted:', JSON.stringify(result));
}

main().catch((err: unknown) => {
  console.error('[wat-run] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
