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
