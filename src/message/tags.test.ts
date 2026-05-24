import { describe, expect, it } from 'vitest';
import { tagLine, appendTags } from './tags.js';

describe('tagLine', () => {
  it('uses a language-specific base tag plus the English spot tag', () => {
    expect(tagLine('ko', 'Lumpini')).toBe('#방콕러닝 #BangkokRunning #Lumpini');
    expect(tagLine('en', 'Lumpini')).toBe('#RunBangkok #BangkokRunning #Lumpini');
    expect(tagLine('th', 'Lumpini')).toBe('#วิ่งกรุงเทพ #BangkokRunning #Lumpini');
  });

  it('omits the spot tag when none is given (evening posts)', () => {
    expect(tagLine('ko')).toBe('#방콕러닝 #BangkokRunning');
  });
});

describe('appendTags', () => {
  it('appends the tag line after a blank line', () => {
    expect(appendTags('hello', 'en', 'Lumpini')).toBe('hello\n\n#RunBangkok #BangkokRunning #Lumpini');
  });
});
