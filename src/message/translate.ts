import Anthropic from '@anthropic-ai/sdk';
import { TRANSLATION_MODEL } from '../config.js';
import { enDateLabel, thDateLabel } from '../util/time.js';
import { validateTranslation } from './validate.js';

export type TargetLanguage = 'English' | 'Thai';

const MAX_TOKENS = 1024;

/** Minimal structural view of the Anthropic client used here (eases testing). */
export interface TranslationClient {
  messages: {
    create(body: {
      model: string;
      max_tokens: number;
      system: string;
      messages: Array<{ role: 'user'; content: string }>;
    }): Promise<{ content: Array<{ type: string; text?: string }> }>;
  };
}

/** Build the translation system prompt for the target language (spec verbatim). */
export function buildSystemPrompt(target: TargetLanguage): string {
  return `You are translating a daily running-conditions post for Bangkok runners
from Korean to ${target}.

Rules:
- Translate EVERYTHING into ${target}. Do not leave any Korean words.
- Keep emojis and line breaks EXACTLY as in the source.
- Keep all numbers, times, and units unchanged (58, 35.6°C, 61%, 05:00, etc).
- Leave the SECOND line (the date) exactly as in the source; it is localized
  separately in code.
- Translate the FIRST line (the headline) naturally and catchily — it is a hook.
- Keep the traffic-light emojis (🟢 🟡 🔴) as-is; they signal today's verdict.
- Use a friendly, motivating social-media tone that encourages people to run.
- For Thai, use a casual but respectful tone.

Output the translation ONLY. No explanations.`;
}

function localizedDate(target: TargetLanguage, dtSeconds: number): string {
  return target === 'English' ? enDateLabel(dtSeconds) : thDateLabel(dtSeconds);
}

/**
 * Translate a Korean post to the target language and validate the result.
 * The date (second line) is set deterministically in code — LLMs are unreliable
 * at day-of-week and Buddhist-year conversion — overriding whatever the model
 * returned for that line.
 *
 * Throws if the model returns no text or the translation fails validation.
 * No prompt caching: the system prompt is below the cacheable minimum and the
 * bot runs once per day, so caching would never hit.
 */
export async function translate(
  client: TranslationClient,
  koText: string,
  target: TargetLanguage,
  dtSeconds: number,
): Promise<string> {
  const response = await client.messages.create({
    model: TRANSLATION_MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(target),
    messages: [{ role: 'user', content: koText }],
  });

  const block = response.content.find((b) => b.type === 'text' && typeof b.text === 'string');
  if (!block || typeof block.text !== 'string') {
    throw new Error(`translation to ${target} returned no text`);
  }

  const lines = block.text.trim().split('\n');
  lines[1] = localizedDate(target, dtSeconds); // date is the second line
  const text = lines.join('\n');

  validateTranslation(koText, text);
  return text;
}

/** Translate, returning null (and logging) on failure — replies are best-effort. */
export async function translateSafe(
  client: TranslationClient,
  koText: string,
  target: TargetLanguage,
  dtSeconds: number,
): Promise<string | null> {
  try {
    return await translate(client, koText, target, dtSeconds);
  } catch (err: unknown) {
    console.error(
      `[wat-run] ${target} translation skipped:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/** Create a real Anthropic client from an API key. */
export function createClient(apiKey: string): TranslationClient {
  return new Anthropic({ apiKey }) as unknown as TranslationClient;
}
