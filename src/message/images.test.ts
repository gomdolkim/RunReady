import { describe, expect, it } from 'vitest';
import { CAT_IMAGES, pickImage } from './images.js';

const DT = Date.UTC(2026, 4, 23, 22, 0, 0) / 1000;

describe('cat images', () => {
  it('has 10 image URLs', () => {
    expect(CAT_IMAGES).toHaveLength(10);
  });

  it('are public URLs to the images folder', () => {
    for (const url of CAT_IMAGES) expect(url).toMatch(/^https:\/\/.+\/images\/\d+\.jpg$/);
  });

  it('pickImage returns a member, deterministically per day', () => {
    expect(CAT_IMAGES).toContain(pickImage(DT));
    expect(pickImage(DT)).toBe(pickImage(DT));
  });

  it('an offset picks a different image on the same day', () => {
    expect(pickImage(DT, 5)).not.toBe(pickImage(DT));
    expect(CAT_IMAGES).toContain(pickImage(DT, 5));
  });
});
