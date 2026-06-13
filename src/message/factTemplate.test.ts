import { describe, expect, it } from 'vitest';
import { FACTS } from '../content/facts.js';
import { buildFactPost, SERIES_NAME } from './factTemplate.js';

describe('buildFactPost', () => {
  it('opens with the hook on the very first line (algorithm reads it first)', () => {
    const fact = FACTS[0]!;
    expect(buildFactPost(fact).split('\n')[0]).toBe(fact.hook);
  });

  it('includes the hook, body, kick and question', () => {
    const fact = FACTS[0]!;
    const post = buildFactPost(fact);
    expect(post).toContain(fact.hook);
    expect(post).toContain(fact.body);
    expect(post).toContain(fact.kick);
    expect(post).toContain(fact.question);
  });

  it('includes the numbered series signature', () => {
    expect(buildFactPost(FACTS[6]!)).toContain(`— ${SERIES_NAME} 7/50`);
  });

  it('includes the branded series hashtag and the fact tag', () => {
    const fact = FACTS[0]!;
    const post = buildFactPost(fact);
    expect(post).toContain('#돈의진실');
    expect(post).toContain(`#${fact.tag}`);
  });

  it('stays within the Threads 500-character limit for every fact', () => {
    for (const fact of FACTS) {
      expect(buildFactPost(fact).length).toBeLessThanOrEqual(500);
    }
  });

  it('never leaves a hashtag placeholder unfilled', () => {
    for (const fact of FACTS) {
      expect(buildFactPost(fact)).not.toMatch(/#(\s|$)/);
    }
  });
});
