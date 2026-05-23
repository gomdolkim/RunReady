import { postForm } from '../util/http.js';

const API_BASE = 'https://graph.threads.net/v1.0';

/**
 * Publish a single text post: create a TEXT container, then publish it.
 * Pass `replyToId` to make it a reply (used for the EN/TH chain replies).
 * Returns the published thread id.
 */
export async function publishPost(
  token: string,
  text: string,
  replyToId?: string,
): Promise<string> {
  const createParams: Record<string, string> = {
    media_type: 'TEXT',
    text,
    access_token: token,
  };
  if (replyToId) createParams.reply_to_id = replyToId;

  const container = (await postForm(`${API_BASE}/me/threads`, createParams)) as { id?: string };
  if (!container.id) {
    throw new Error('Threads container creation returned no id');
  }

  const published = (await postForm(`${API_BASE}/me/threads_publish`, {
    creation_id: container.id,
    access_token: token,
  })) as { id?: string };
  if (!published.id) {
    throw new Error('Threads publish returned no id');
  }

  return published.id;
}
