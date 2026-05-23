/** Fetch JSON, throwing on a non-2xx response. Query string (which may carry
 *  a token) is stripped from error messages to avoid leaking secrets in logs. */
export async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    const safe = url.split('?')[0];
    throw new Error(`HTTP ${res.status} for ${safe}`);
  }
  return res.json();
}

/**
 * POST form-encoded params and parse the JSON response, throwing on a non-2xx.
 * The token travels in the body (not the URL), and any `error.message` from the
 * response is surfaced for debugging.
 */
export async function postForm(url: string, params: Record<string, string>): Promise<unknown> {
  const res = await fetch(url, { method: 'POST', body: new URLSearchParams(params) });
  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      detail = body?.error?.message ?? '';
    } catch {
      // non-JSON error body; status alone will have to do
    }
    throw new Error(`HTTP ${res.status} for ${url.split('?')[0]}${detail ? `: ${detail}` : ''}`);
  }
  return res.json();
}
