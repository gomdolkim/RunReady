import { afterEach, describe, expect, it, vi } from 'vitest';
import { publishPost } from './post.js';

function mockFetchSequence(payloads: unknown[], ok = true) {
  const fn = vi.fn();
  for (const p of payloads) {
    fn.mockResolvedValueOnce({ ok, status: ok ? 200 : 400, json: async () => p });
  }
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('publishPost', () => {
  it('creates a TEXT container then publishes, returning the published id', async () => {
    const fn = mockFetchSequence([{ id: 'container1' }, { id: 'thread1' }]);
    const id = await publishPost('tok', 'hello');

    expect(id).toBe('thread1');

    const [createUrl, createInit] = fn.mock.calls[0]!;
    expect(String(createUrl)).toContain('/me/threads');
    const createBody = String((createInit as RequestInit).body);
    expect(createBody).toContain('media_type=TEXT');
    expect(createBody).toContain('access_token=tok');
    expect(decodeURIComponent(createBody)).toContain('text=hello');
    expect(createBody).not.toContain('reply_to_id');

    const [pubUrl, pubInit] = fn.mock.calls[1]!;
    expect(String(pubUrl)).toContain('/me/threads_publish');
    expect(String((pubInit as RequestInit).body)).toContain('creation_id=container1');
  });

  it('includes reply_to_id when replying', async () => {
    const fn = mockFetchSequence([{ id: 'c2' }, { id: 't2' }]);
    await publishPost('tok', 'reply', 'parent99');
    expect(String((fn.mock.calls[0]![1] as RequestInit).body)).toContain('reply_to_id=parent99');
  });

  it('throws when container creation returns no id', async () => {
    mockFetchSequence([{ error: 'bad' }]);
    await expect(publishPost('tok', 'x')).rejects.toThrow(/container/i);
  });

  it('throws on a non-ok HTTP response', async () => {
    mockFetchSequence([{ error: { message: 'Invalid token' } }], false);
    await expect(publishPost('tok', 'x')).rejects.toThrow(/Invalid token/);
  });
});
