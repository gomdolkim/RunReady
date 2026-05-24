import 'dotenv/config';
import { requireEnv } from './config.js';
import { fetchSpotAir } from './data/airQuality.js';
import { fetchWeather } from './data/openMeteo.js';
import { pickCoachLine } from './content/coachLines.js';
import { pickSpot } from './content/spots.js';
import { buildSpotConditions } from './pipeline.js';
import { pickImage } from './message/images.js';
import { buildSpotPost } from './message/spotTemplate.js';
import { appendTags } from './message/tags.js';
import { createClient, translateSafe } from './message/translate.js';
import { publishChain, type PostFn } from './threads/chain.js';
import { publishPost } from './threads/post.js';

/**
 * Morning entry (≈05:00 Bangkok): pick today's spot, fetch its weather + air,
 * build the Korean "spot of the day" post, translate to EN/TH, append per-language
 * hashtags, and publish the connected KO→EN→TH chain with a cat image.
 *
 * Fail-visible: missing data/env aborts before posting. The Korean post is
 * required; each translation/reply is best-effort. Pass --dry-run to print only.
 */
async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const waqiToken = requireEnv('WAQI_TOKEN');
  const anthropicKey = requireEnv('ANTHROPIC_API_KEY');

  const now = Math.floor(Date.now() / 1000);
  const spot = pickSpot(now);

  const [hourly, air] = await Promise.all([
    fetchWeather(spot.lat, spot.lon),
    fetchSpotAir(waqiToken, spot.lat, spot.lon),
  ]);

  const conditions = buildSpotConditions(spot, hourly, air);
  const coach = pickCoachLine(conditions.grade, now);
  const koBody = buildSpotPost(conditions, now, coach);

  const client = createClient(anthropicKey);
  const enBody = await translateSafe(client, koBody, 'English', now);
  const thBody = await translateSafe(client, koBody, 'Thai', now);

  const ko = appendTags(koBody, 'ko', spot.tag);
  const en = enBody ? appendTags(enBody, 'en', spot.tag) : null;
  const th = thBody ? appendTags(thBody, 'th', spot.tag) : null;
  const imageUrl = pickImage(now);

  if (dryRun) {
    console.log(ko);
    console.log(`\n🖼️  image: ${imageUrl}  ·  📡 station: ${air.station}`);
    if (en) console.log(`\n--- English ---\n${en}`);
    if (th) console.log(`\n--- Thai ---\n${th}`);
    console.log('\n[wat-run] dry run — nothing posted.');
    return;
  }

  const token = requireEnv('THREADS_ACCESS_TOKEN');
  const post: PostFn = (text, replyToId, imgUrl) =>
    publishPost(token, text, replyToId, { imageUrl: imgUrl });
  const result = await publishChain({ ko, en, th }, post, undefined, imageUrl);
  console.log('[wat-run] posted:', JSON.stringify(result));
}

main().catch((err: unknown) => {
  console.error('[wat-run] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
