import { describe, expect, it, vi } from 'vitest';
import { buildSystemPrompt, translate, type TranslationClient } from './translate.js';

// 2026-05-24 Bangkok (Sunday)
const DT = Date.UTC(2026, 4, 23, 22, 0, 0) / 1000;

const KO = [
  '방콕, 오늘 뛸 수 있을까? 🏃',
  '2026.05.24 (일)',
  '😷 미세먼지: 나쁨 (58)',
  '🔴 오늘은 실내로',
].join('\n');

const EN = [
  'Can you run in Bangkok today? 🏃',
  'May 24, 2026 (Sun)',
  '😷 Air quality: Bad (58)',
  '🔴 Stay indoors today',
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
    expect(p).toContain('date');
    expect(p).toContain('Output the translation ONLY');
  });

  it('targets Thai', () => {
    expect(buildSystemPrompt('Thai')).toContain('from Korean to Thai');
  });

  it('pins the mascot name so 소이캣 is not translated to a breed', () => {
    expect(buildSystemPrompt('English')).toContain('Soi Cat');
    expect(buildSystemPrompt('Thai')).toContain('ซอยแคท');
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

  it('overrides the date line with the correct localized date (model got it wrong)', async () => {
    const { client } = mockClient(EN.replace('(Sun)', '(Sat)'));
    expect(await translate(client, KO, 'English', DT)).toBe(EN);
  });

  it('localizes the date to Thai (Buddhist year)', async () => {
    const th = [
      'วิ่งที่กรุงเทพวันนี้ได้ไหม? 🏃',
      '(date is overridden in code)',
      '😷 ฝุ่น PM2.5: แย่ (58)',
      '🔴 วันนี้อยู่ในร่ม',
    ].join('\n');
    const { client } = mockClient(th);
    const out = await translate(client, KO, 'Thai', DT);
    expect(out.split('\n')[1]).toBe('24 พ.ค. 2569 (อา.)');
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
    const { client } = mockClient(EN.replace('Bad (58)', 'Bad'));
    await expect(translate(client, KO, 'English', DT)).rejects.toThrow(/number/i);
  });
});
