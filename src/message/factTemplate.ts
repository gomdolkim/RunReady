import type { Fact, FactBucket } from '../content/facts.js';

/** Series brand. Used in the signature and (space-stripped) as the lead hashtag. */
export const SERIES_NAME = '돈의 진실';

/** Total number of facts in the series, shown in the "n/50" signature. */
const SERIES_SIZE = 50;

/** Korean bucket hashtag, appended after the series tag for topic discovery. */
const BUCKET_TAG: Record<FactBucket, string> = {
  invest: '재테크',
  salary: '연봉',
  spending: '돈관리',
  career: '커리어',
  tax: '세금',
};

/**
 * Build the Korean fact post. The hook is the very first line on purpose — the
 * Threads feed and previews lead with it, so the curiosity gap has to land
 * before anything else. Order: hook → body → kick → question → numbered
 * signature → hashtag line (series + bucket + fact topic).
 */
export function buildFactPost(fact: Fact): string {
  // De-dup tags (some career facts carry tag "커리어", same as the bucket tag).
  const tags = [...new Set([SERIES_NAME.replace(/\s+/g, ''), BUCKET_TAG[fact.bucket], fact.tag])];
  return [
    fact.hook,
    '',
    fact.body,
    '',
    fact.kick,
    '',
    fact.question,
    '',
    `— ${SERIES_NAME} ${fact.n}/${SERIES_SIZE}`,
    tags.map((t) => `#${t}`).join(' '),
  ].join('\n');
}
