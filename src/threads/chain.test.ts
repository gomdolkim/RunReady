import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { publishChain } from './chain.js';

const noSleep = async (): Promise<void> => {};

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('publishChain', () => {
  it('posts KO first, then EN and TH as replies to the KO id', async () => {
    const post = vi
      .fn()
      .mockResolvedValueOnce('ko1')
      .mockResolvedValueOnce('en1')
      .mockResolvedValueOnce('th1');
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await publishChain({ ko: 'K', en: 'E', th: 'T' }, post, sleep);

    expect(result).toEqual({ ko: 'ko1', en: 'en1', th: 'th1' });
    expect(post).toHaveBeenNthCalledWith(1, 'K');
    expect(post).toHaveBeenNthCalledWith(2, 'E', 'ko1');
    expect(post).toHaveBeenNthCalledWith(3, 'T', 'ko1');
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('skips a null translation', async () => {
    const post = vi.fn().mockResolvedValueOnce('ko1').mockResolvedValueOnce('th1');
    const result = await publishChain({ ko: 'K', en: null, th: 'T' }, post, noSleep);

    expect(result).toEqual({ ko: 'ko1', en: null, th: 'th1' });
    expect(post).toHaveBeenNthCalledWith(2, 'T', 'ko1');
  });

  it('continues to TH when the EN reply fails (best-effort)', async () => {
    const post = vi
      .fn()
      .mockResolvedValueOnce('ko1')
      .mockRejectedValueOnce(new Error('EN boom'))
      .mockResolvedValueOnce('th1');

    const result = await publishChain({ ko: 'K', en: 'E', th: 'T' }, post, noSleep);

    expect(result).toEqual({ ko: 'ko1', en: null, th: 'th1' });
  });

  it('throws when the KO main post fails and attempts no replies', async () => {
    const post = vi.fn().mockRejectedValueOnce(new Error('KO boom'));
    await expect(publishChain({ ko: 'K', en: 'E', th: 'T' }, post, noSleep)).rejects.toThrow(
      /KO boom/,
    );
    expect(post).toHaveBeenCalledTimes(1);
  });
});
