import 'dotenv/config';
import { requireEnv } from './config.js';
import { buildWorkout, pickTip } from './content/workout.js';
import { pickEveningHook } from './message/eveningHooks.js';
import { buildEveningPost } from './message/eveningTemplate.js';
import { pickImage } from './message/images.js';
import { createClient, translateSafe } from './message/translate.js';
import { publishChain, type PostFn } from './threads/chain.js';
import { publishPost } from './threads/post.js';

/**
 * Evening entry point (18:00 Bangkok): announce TOMORROW's workout. Builds the
 * Korean post, translates to EN/TH, and publishes the 3-post chain with a cat
 * image. Pass --dry-run to print instead of publish. Needs ANTHROPIC + THREADS
 * (no weather/air data).
 */
async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const anthropicKey = requireEnv('ANTHROPIC_API_KEY');

  // The evening post is about TOMORROW.
  const tomorrow = Math.floor(Date.now() / 1000) + 86_400;

  const workout = buildWorkout(tomorrow);
  const hook = pickEveningHook(tomorrow);
  const tip = pickTip(tomorrow);
  const koPost = buildEveningPost(workout, tomorrow, hook, tip);

  const client = createClient(anthropicKey);
  const en = await translateSafe(client, koPost, 'English', tomorrow);
  const th = await translateSafe(client, koPost, 'Thai', tomorrow);
  const imageUrl = pickImage(tomorrow, 5); // offset so it differs from the morning image

  if (dryRun) {
    console.log(koPost);
    console.log(`\n🖼️  image: ${imageUrl}`);
    if (en) console.log(`\n--- English ---\n${en}`);
    if (th) console.log(`\n--- Thai ---\n${th}`);
    console.log('\n[wat-run evening] dry run — nothing posted.');
    return;
  }

  const token = requireEnv('THREADS_ACCESS_TOKEN');
  const post: PostFn = (text, replyToId, imgUrl) =>
    publishPost(token, text, replyToId, { imageUrl: imgUrl });
  const result = await publishChain({ ko: koPost, en, th }, post, undefined, imageUrl);
  console.log('[wat-run evening] posted:', JSON.stringify(result));
}

main().catch((err: unknown) => {
  console.error('[wat-run evening] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
