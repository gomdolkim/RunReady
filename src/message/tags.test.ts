import { describe, expect, it } from 'vitest';
import { tagLine, appendTags, placeTagLine, appendPlaceTags } from './tags.js';

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

describe('placeTagLine', () => {
  it('uses travel base tags plus the English place tag', () => {
    expect(placeTagLine('ko', 'WatArun')).toBe('#방콕여행 #방콕가볼만한곳 #WatArun');
    expect(placeTagLine('en', 'WatArun')).toBe('#Bangkok #BangkokTravel #WatArun');
    expect(placeTagLine('th', 'WatArun')).toBe('#เที่ยวกรุงเทพ #กรุงเทพ #WatArun');
  });

  it('omits the place tag when none is given', () => {
    expect(placeTagLine('en')).toBe('#Bangkok #BangkokTravel');
  });
});

describe('appendPlaceTags', () => {
  it('appends the travel tag line after a blank line', () => {
    expect(appendPlaceTags('hello', 'en', 'WatArun')).toBe('hello\n\n#Bangkok #BangkokTravel #WatArun');
  });
});
