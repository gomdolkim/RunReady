import { postForm } from '../util/http.js';

const API_BASE = 'https://graph.threads.net/v1.0';

export interface PublishOptions {
  /** Publish as an IMAGE post with this public image URL (else a TEXT post). */
  imageUrl?: string;
  /** Injectable delay (for tests). */
  sleep?: (ms: number) => Promise<void>;
  /** Extra publish attempts after the first (default 2). */
  publishRetries?: number;
  /** Delay between publish attempts in ms (default 3000). */
  retryDelayMs?: number;
}

const realSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Publish a single text post: create a TEXT container, then publish it.
 * Pass `replyToId` to make it a reply (used for the EN/TH chain replies).
 *
 * The publish step is retried because Threads can briefly return "resource does
 * not exist" right after container creation (eventual consistency). Returns the
 * published thread id.
 */
export async function publishPost(
  token: string,
  text: string,
  replyToId?: string,
  options: PublishOptions = {},
): Promise<string> {
  const sleep = options.sleep ?? realSleep;
  const retries = options.publishRetries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 3000;

  const createParams: Record<string, string> = options.imageUrl
    ? { media_type: 'IMAGE', image_url: options.imageUrl, text, access_token: token }
    : { media_type: 'TEXT', text, access_token: token };
  if (replyToId) createParams.reply_to_id = replyToId;

  const container = (await postForm(`${API_BASE}/me/threads`, createParams)) as { id?: string };
  if (!container.id) {
    throw new Error('Threads container creation returned no id');
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(retryDelayMs);
    try {
      const published = (await postForm(`${API_BASE}/me/threads_publish`, {
        creation_id: container.id,
        access_token: token,
      })) as { id?: string };
      if (!published.id) {
        throw new Error('Threads publish returned no id');
      }
      return published.id;
    } catch (err: unknown) {
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
