/** Validation for translated posts: length, structure, and content preservation. */

const MAX_LENGTH = 500;
const EMOJI_RE = /\p{Extended_Pictographic}/gu;
const NUMBER_RE = /\d+(?:\.\d+)?/g;

/** Throw if text exceeds the Threads 500-character limit. */
export function assertUnder500(text: string, label = 'post'): void {
  if (text.length > MAX_LENGTH) {
    throw new Error(`${label} exceeds ${MAX_LENGTH} characters (got ${text.length})`);
  }
}

function multiset(items: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}

/** Items in `required` not covered (by count) in `present`. */
function missing(required: string[], present: string[]): string[] {
  const have = multiset(present);
  const out: string[] = [];
  for (const [key, count] of multiset(required)) {
    if ((have.get(key) ?? 0) < count) out.push(key);
  }
  return out;
}

function emojis(text: string): string[] {
  return text.match(EMOJI_RE) ?? [];
}

/**
 * Metric numbers to preserve: everything below the hook and date lines, minus
 * clock times (Korean "5–7시" / "19시쯤"), which legitimately localize between
 * languages (e.g. 19시 → 7 PM). What remains is AQI and temperatures.
 */
function dataNumbers(text: string): string[] {
  const body = text.split('\n').slice(2).join('\n').replace(/\d+(?:–\d+)?시/g, '');
  return body.match(NUMBER_RE) ?? [];
}

function lineBreaks(text: string): number {
  return (text.match(/\n/g) ?? []).length;
}

/** Shared structural checks: length, no leftover Korean, line breaks, emojis. */
function validateStructure(source: string, translated: string): void {
  assertUnder500(translated, 'translation');

  // EN/TH output must not retain Korean — catches partial/incomplete translations.
  if (/[가-힣]/.test(translated)) {
    throw new Error('translation still contains untranslated Korean');
  }

  if (lineBreaks(source) !== lineBreaks(translated)) {
    throw new Error(
      `translation line-break count (${lineBreaks(translated)}) != source (${lineBreaks(source)})`,
    );
  }

  const droppedEmoji = missing(emojis(source), emojis(translated));
  if (droppedEmoji.length > 0) {
    throw new Error(`translation dropped emoji(s): ${droppedEmoji.join(' ')}`);
  }
}

/**
 * Ensure a translation preserves the source's structure and data: under 500
 * characters, same line-break count, all source emojis present, and all data
 * numbers (every line but the date header) preserved.
 */
export function validateTranslation(source: string, translated: string): void {
  validateStructure(source, translated);

  const droppedNumber = missing(dataNumbers(source), dataNumbers(translated));
  if (droppedNumber.length > 0) {
    throw new Error(`translation dropped number(s): ${droppedNumber.join(', ')}`);
  }
}

/**
 * Validate a "place of the day" translation. Same structural guarantees as
 * {@link validateTranslation} but WITHOUT the metric-number check: place posts
 * have no critical metrics, and numbers legitimately change form across
 * languages (e.g. "라마 8세" → "Rama VIII", "84층" → "84th floor").
 */
export function validatePlaceTranslation(source: string, translated: string): void {
  validateStructure(source, translated);
}
