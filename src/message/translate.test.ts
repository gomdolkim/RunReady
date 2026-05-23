import { describe, expect, it, vi } from 'vitest';
import { buildSystemPrompt, translate, type TranslationClient } from './translate.js';

// 2026-05-24 Bangkok (Sunday)
const DT = Date.UTC(2026, 4, 23, 22, 0, 0) / 1000;

const KO = [
  '☀️ Wat Run? — 2026.05.24 (일)',
  '오늘 컨디션: 🟢 GO',
  '📊 PM2.5: 32 μg/m³',
  '뛰러 가요! 🏃',
].join('\n');

const EN = [
  '☀️ Wat Run? — May 24, 2026 (Sun)',
  'Today: 🟢 GO',
  '📊 PM2.5: 32 μg/m³',
  "Let's run! 🏃",
].join('\n');

function mockClient(text: unknown, blockType = 'text') {
  const create = vi.fn().mockResolvedValue({ content: [{ type: blockType, text }] });
  const client = { messages: { create } } as unknown as TranslationClient;
  return { client, create };
}

describe('buildSystemPrompt', () => {
  it('targets English and keeps the core rules', () => {
    const p = buildSystemPrompt('English');
    expect(p).toContain('from Korean to English');
    expect(p).toContain('Keep emojis and line breaks EXACTLY');
    expect(p).toContain('date header');
    expect(p).toContain('GO / CAUTION / SKIP');
    expect(p).toContain('Output the translation ONLY');
  });

  it('targets Thai', () => {
    expect(buildSystemPrompt('Thai')).toContain('from Korean to Thai');
  });
});

describe('translate', () => {
  it('sends the system prompt and Korean text to the model', async () => {
    const { client, create } = mockClient(EN);
    await translate(client, KO, 'English', DT);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-haiku-4-5',
        system: expect.stringContaining('from Korean to English'),
        messages: [{ role: 'user', content: KO }],
      }),
    );
  });

  it('overrides the date header with the correct localized date (model got it wrong)', async () => {
    // Model returns the wrong weekday; code must fix it to Sunday.
    const { client } = mockClient(EN.replace('(Sun)', '(Sat)'));
    expect(await translate(client, KO, 'English', DT)).toBe(EN);
  });

  it('localizes the date header to Thai (Buddhist year)', async () => {
    const th = [
      '☀️ Wat Run? — whatever the model wrote',
      'วันนี้: 🟢 GO',
      '📊 PM2.5: 32 μg/m³',
      'ไปวิ่งกันเถอะ! 🏃',
    ].join('\n');
    const { client } = mockClient(th);
    const out = await translate(client, KO, 'Thai', DT);
    expect(out.split('\n')[0]).toBe('☀️ Wat Run? — 24 พ.ค. 2569 (อา.)');
  });

  it('trims surrounding whitespace from the model output', async () => {
    const { client } = mockClient(`\n${EN}\n`);
    expect(await translate(client, KO, 'English', DT)).toBe(EN);
  });

  it('throws when the response has no text block', async () => {
    const { client } = mockClient(undefined, 'tool_use');
    await expect(translate(client, KO, 'English', DT)).rejects.toThrow(/no text/i);
  });

  it('throws when the translation fails validation (dropped number)', async () => {
    const { client } = mockClient(EN.replace('PM2.5: 32', 'PM2.5:'));
    await expect(translate(client, KO, 'English', DT)).rejects.toThrow(/number/i);
  });
});
