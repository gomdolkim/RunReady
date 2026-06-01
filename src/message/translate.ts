import Anthropic from '@anthropic-ai/sdk';
import { TRANSLATION_MODEL } from '../config.js';
import { enDateLabel, thDateLabel } from '../util/time.js';
import { validatePlaceTranslation, validateTranslation } from './validate.js';

export type TargetLanguage = 'English' | 'Thai';

/** A function that throws if `translated` does not faithfully render `source`. */
export type Validator = (source: string, translated: string) => void;

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
- "소이캣" is the mascot's name (a friendly Bangkok street cat). ALWAYS render it
  as "Soi Cat" in English and "ซอยแคท" in Thai — never translate it to a cat
  breed (e.g. "Siamese cat") or any other word.
- Use a friendly, motivating social-media tone that encourages people to run.
- For Thai, use a casual but respectful tone.

Output the translation ONLY. No explanations.`;
}

/** Build the translation system prompt for the "place of the day" post. */
export function buildPlaceSystemPrompt(target: TargetLanguage): string {
  return `You are translating a daily "Bangkok place of the day" post for
travellers, from Korean to ${target}. Each post recommends one real place to
visit in Bangkok (a temple, museum, park, market, landmark or viewpoint).

Rules:
- Translate EVERYTHING into ${target}. Do not leave any Korean words.
- Keep emojis and line breaks EXACTLY as in the source.
- Leave the SECOND line (the date) exactly as in the source; it is localized
  separately in code.
- Translate the FIRST line (the headline) naturally and catchily — it is a hook.
- Use the common English/Thai name for well-known places (e.g. "Wat Arun",
  "Grand Palace", "Chatuchak"). Keep BTS/MRT station names, pier names and line
  names recognizable to a visitor.
- Keep numbers and units sensible for the target language (e.g. "46m", heights,
  floor numbers); exact digit preservation is not required.
- "소이캣" is the mascot's name (a friendly Bangkok street cat). ALWAYS render it
  as "Soi Cat" in English and "ซอยแคท" in Thai — never translate it to a cat
  breed or any other word.
- Use a friendly, inviting travel tone that makes people want to go.
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
  return translateWith(client, koText, target, dtSeconds, buildSystemPrompt, validateTranslation);
}

/**
 * Translate a "place of the day" post. Same flow as {@link translate} but with
 * the travel system prompt and the place validator (no metric-number check).
 */
export async function translatePlace(
  client: TranslationClient,
  koText: string,
  target: TargetLanguage,
  dtSeconds: number,
): Promise<string> {
  return translateWith(
    client,
    koText,
    target,
    dtSeconds,
    buildPlaceSystemPrompt,
    validatePlaceTranslation,
  );
}

/** Shared translation core: call the model, fix the date line, then validate. */
async function translateWith(
  client: TranslationClient,
  koText: string,
  target: TargetLanguage,
  dtSeconds: number,
  systemPrompt: (target: TargetLanguage) => string,
  validate: Validator,
): Promise<string> {
  const response = await client.messages.create({
    model: TRANSLATION_MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt(target),
    messages: [{ role: 'user', content: koText }],
  });

  const block = response.content.find((b) => b.type === 'text' && typeof b.text === 'string');
  if (!block || typeof block.text !== 'string') {
    throw new Error(`translation to ${target} returned no text`);
  }

  const lines = block.text.trim().split('\n');
  lines[1] = localizedDate(target, dtSeconds); // date is the second line
  const text = lines.join('\n');

  validate(koText, text);
  return text;
}

/** Translate, returning null (and logging) on failure — replies are best-effort. */
export async function translateSafe(
  client: TranslationClient,
  koText: string,
  target: TargetLanguage,
  dtSeconds: number,
): Promise<string | null> {
  return safely(() => translate(client, koText, target, dtSeconds), target);
}

/** Place-post variant of {@link translateSafe}. */
export async function translatePlaceSafe(
  client: TranslationClient,
  koText: string,
  target: TargetLanguage,
  dtSeconds: number,
): Promise<string | null> {
  return safely(() => translatePlace(client, koText, target, dtSeconds), target);
}

async function safely(
  run: () => Promise<string>,
  target: TargetLanguage,
): Promise<string | null> {
  try {
    return await run();
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
