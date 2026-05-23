/** Central configuration: constants and environment access. */

export const TIMEZONE = 'Asia/Bangkok';

/** Target location for weather and air-quality lookups: Benjakitti Park,
 *  a popular Bangkok running spot (approximate coordinates). */
export const LOCATION = { name: 'Benjakitti Park', lat: 13.7234, lon: 100.5601 } as const;

/** Anthropic model used for translation (Phase 2). */
export const TRANSLATION_MODEL = 'claude-haiku-4-5';

/**
 * Verdict thresholds (μg/m³ for PM2.5, °C for WBGT).
 * Grade is GO below `go`, CAUTION up to and including `caution`, SKIP above.
 *
 * WBGT thresholds are recalibrated upward from textbook sports-medicine values
 * so the verdict is a useful *relative* daily signal for acclimatised Bangkok
 * runners (where dawn WBGT is typically ~28–34) rather than a near-constant SKIP.
 */
export const THRESHOLDS = {
  pm25: { go: 35, caution: 55 },
  wbgt: { go: 30, caution: 32.5 },
} as const;

/** Golden-window thresholds and the dawn/evening hour bands (Bangkok local). */
export const GOLDEN = {
  best: { wbgt: 30, pm25: 35 },
  good: { wbgt: 32.5, pm25: 50 },
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
