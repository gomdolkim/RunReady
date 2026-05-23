import { pickByDay } from '../util/time.js';

/** Public base URL for the committed cat images (served from the repo). */
const BASE = 'https://raw.githubusercontent.com/gomdolkim/RunReady/main/images';

/** The 10 cat-running images (images/1.jpg … images/10.jpg), one per day. */
export const CAT_IMAGES: readonly string[] = Array.from(
  { length: 10 },
  (_, i) => `${BASE}/${i + 1}.jpg`,
);

/** Pick today's cat image (rotates through the 10 by day of year). */
export function pickImage(dtSeconds: number): string {
  return pickByDay(CAT_IMAGES, dtSeconds);
}
