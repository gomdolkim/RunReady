import 'dotenv/config';
import { requireEnv } from './config.js';
import { buildEveningPost } from './message/eveningRotation.js';
import { pickImage } from './message/images.js';
import { appendTags } from './message/tags.js';
import { createClient, translateSafe } from './message/translate.js';
import { publishChain, type PostFn } from './threads/chain.js';
import { publishPost } from './threads/post.js';

/**
 * Evening entry (≈18:00 Bangkok): a light rotation post (poll / haiku / trivia /
 * run-then-eat) to keep the account alive and varied. Builds the Korean post,
 * translates to EN/TH, appends base hashtags, and publishes the chain with a cat
 * image (offset so it differs from the morning). Needs ANTHROPIC + THREADS.
 */
async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const anthropicKey = requireEnv('ANTHROPIC_API_KEY');

  const now = Math.floor(Date.now() / 1000);
  const koBody = buildEveningPost(now);

  const client = createClient(anthropicKey);
  const enBody = await translateSafe(client, koBody, 'English', now);
  const thBody = await translateSafe(client, koBody, 'Thai', now);

  const ko = appendTags(koBody, 'ko');
  const en = enBody ? appendTags(enBody, 'en') : null;
  const th = thBody ? appendTags(thBody, 'th') : null;
  const imageUrl = pickImage(now, 5); // offset so it differs from the morning image

  if (dryRun) {
    console.log(ko);
    console.log(`\n🖼️  image: ${imageUrl}`);
    if (en) console.log(`\n--- English ---\n${en}`);
    if (th) console.log(`\n--- Thai ---\n${th}`);
    console.log('\n[wat-run evening] dry run — nothing posted.');
    return;
  }

  const token = requireEnv('THREADS_ACCESS_TOKEN');
  const post: PostFn = (text, replyToId, imgUrl) =>
    publishPost(token, text, replyToId, { imageUrl: imgUrl });
  const result = await publishChain({ ko, en, th }, post, undefined, imageUrl);
  console.log('[wat-run evening] posted:', JSON.stringify(result));
}

main().catch((err: unknown) => {
  console.error('[wat-run evening] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
