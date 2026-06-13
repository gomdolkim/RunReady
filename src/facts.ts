import 'dotenv/config';
import { requireEnv } from './config.js';
import { pickFact } from './content/facts.js';
import { buildFactPost } from './message/factTemplate.js';
import { publishPost } from './threads/post.js';

/**
 * Evening entry (≈17:30 KST): pick today's "돈의 진실" money/career fact (one of
 * 50, interleaved by bucket, cycling every 50 days), build the Korean post, and
 * publish it as a text post.
 *
 * Korean only — no translation, no image. Uses its own account token
 * (THREADS_ACCESS_TOKEN_FACTS) since this is a separate brand from the Bangkok
 * place/run bot. Pass --dry-run to print the post without publishing.
 */
async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const now = Math.floor(Date.now() / 1000);
  const fact = pickFact(now);
  const post = buildFactPost(fact);

  if (dryRun) {
    console.log(post);
    console.log(`\n📊 #${fact.n}/50 · ${fact.bucket} · ${fact.id} (${post.length} chars)`);
    console.log('\n[wat-run facts] dry run — nothing posted.');
    return;
  }

  const token = requireEnv('THREADS_ACCESS_TOKEN_FACTS');
  const id = await publishPost(token, post);
  console.log('[wat-run facts] posted:', JSON.stringify({ id }));
}

main().catch((err: unknown) => {
  console.error('[wat-run facts] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
