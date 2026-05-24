/** Central configuration: constants and environment access. */

export const TIMEZONE = 'Asia/Bangkok';

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
