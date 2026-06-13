/** Central configuration: constants and environment access. */

export const TIMEZONE = 'Asia/Bangkok';

/** Timezone for the Korean "돈의 진실" money/career fact series (posts ~17:30 KST). */
export const TIMEZONE_FACTS = 'Asia/Seoul';

/**
 * Launch date (KST, YYYY-MM-DD) the fact series starts at #1/50 and counts up,
 * cycling back to #1 every 50 days. Set this to the day you go live.
 */
export const FACTS_LAUNCH_DATE = '2026-06-13';

/** Anthropic model used for translation (Phase 2). */
export const TRANSLATION_MODEL = 'claude-haiku-4-5';

/**
 * Golden-window thresholds and the dawn/evening hour bands (Bangkok local).
 * `wbgt` is heat (°C); `aqi` is the WAQI/aqicn US AQI gate (≤50 good, ≤100
 * moderate). WBGT thresholds are tuned upward from textbook sports-medicine
 * values so the signal is useful for acclimatised Bangkok runners.
 */
export const GOLDEN = {
  best: { wbgt: 30, aqi: 50 },
  good: { wbgt: 32.5, aqi: 100 },
  bands: { dawn: [4, 9], evening: [17, 20] },
} as const;

/**
 * Read a required environment variable, throwing a clear error if it is
 * missing or blank. Fail-fast at system boundaries.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
