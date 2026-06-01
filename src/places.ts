import 'dotenv/config';
import { requireEnv } from './config.js';
import { pickPlace } from './content/places.js';
import { pickImage } from './message/images.js';
import { buildPlacePost } from './message/placeTemplate.js';
import { appendPlaceTags } from './message/tags.js';
import { publishPost } from './threads/post.js';

/**
 * Morning entry (≈05:00 Bangkok): pick today's Bangkok place (one of 50, in
 * order, cycling every 50 days), build the Korean "place of the day" post,
 * append Korean travel hashtags, and publish it with a Soi Cat image.
 *
 * Korean only — no EN/TH translation or replies. Needs only THREADS_ACCESS_TOKEN.
 * Pass --dry-run to print the post without publishing.
 */
async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const now = Math.floor(Date.now() / 1000);
  const place = pickPlace(now);
  const koBody = buildPlacePost(place, now);
  const ko = appendPlaceTags(koBody, 'ko', place.tag);
  const imageUrl = pickImage(now);

  if (dryRun) {
    console.log(ko);
    console.log(`\n🖼️  image: ${imageUrl}  ·  📍 ${place.nameEn}`);
    console.log('\n[wat-run place] dry run — nothing posted.');
    return;
  }

  const token = requireEnv('THREADS_ACCESS_TOKEN');
  const id = await publishPost(token, ko, undefined, { imageUrl });
  console.log('[wat-run place] posted:', JSON.stringify({ ko: id }));
}

main().catch((err: unknown) => {
  console.error('[wat-run place] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
