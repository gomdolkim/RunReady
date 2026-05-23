import { pickByDay } from '../util/time.js';

/** Public base URL for the committed cat images (served from the repo). */
const BASE = 'https://raw.githubusercontent.com/gomdolkim/RunReady/main/images';

/** The 10 cat-running images (images/1.jpg … images/10.jpg), one per day. */
export const CAT_IMAGES: readonly string[] = Array.from(
  { length: 10 },
  (_, i) => `${BASE}/${i + 1}.jpg`,
);

/** Pick a cat image (rotates by day of year). `offset` lets a second post pick
 *  a different image on the same day. */
export function pickImage(dtSeconds: number, offset = 0): string {
  return pickByDay(CAT_IMAGES, dtSeconds, offset);
}
