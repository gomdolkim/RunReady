/** Publish the 3-post thread chain: Korean main + English/Thai replies. */

export interface ChainTexts {
  ko: string;
  /** Translated text, or null if its translation failed upstream. */
  en: string | null;
  th: string | null;
}

export interface ChainResult {
  ko: string;
  en: string | null;
  th: string | null;
}

export type PostFn = (text: string, replyToId?: string) => Promise<string>;
export type SleepFn = (ms: number) => Promise<void>;

const REPLY_DELAY_MS = 2000;
const realSleep: SleepFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Publish the chain. The Korean main post is required — if it fails, the error
 * propagates and no replies are attempted (no partial chain). Each reply is
 * best-effort: a failure is logged and the rest continue. `post`/`sleep` are
 * injected for testing.
 */
export async function publishChain(
  texts: ChainTexts,
  post: PostFn,
  sleep: SleepFn = realSleep,
): Promise<ChainResult> {
  const koId = await post(texts.ko);
  const result: ChainResult = { ko: koId, en: null, th: null };

  const replies: Array<['en' | 'th', string | null]> = [
    ['en', texts.en],
    ['th', texts.th],
  ];

  for (const [lang, text] of replies) {
    if (!text) continue;
    await sleep(REPLY_DELAY_MS);
    try {
      result[lang] = await post(text, koId);
    } catch (err: unknown) {
      console.error(`[wat-run] ${lang} reply skipped:`, err instanceof Error ? err.message : err);
    }
  }

  return result;
}
