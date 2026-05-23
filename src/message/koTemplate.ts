import { airLabel, heatLabel, uvLabel } from '../logic/labels.js';
import type { BandReport, Conditions, Grade } from '../types.js';
import { bangkokDateLabel } from '../util/time.js';

const GRADE_EMOJI: Record<Grade, string> = { GO: '🟢', CAUTION: '🟡', SKIP: '🔴' };

/** When in the band to run: the good window range, or the coolest hour. */
function timeText(band: BandReport): string {
  if (band.window) {
    const start = Number(band.window.start.slice(0, 2));
    const end = Number(band.window.end.slice(0, 2));
    return `${start}–${end}시`;
  }
  if (band.coolestHour !== null) return `${band.coolestHour}시쯤`;
  return '정보 없음';
}

/** Air-quality line value: label range + AQI range (collapses when min === max). */
function airText(min: number, max: number): string {
  const loLabel = airLabel(min);
  const hiLabel = airLabel(max);
  const label = loLabel === hiLabel ? loLabel : `${loLabel}~${hiLabel}`;
  const value = min === max ? `AQI ${min}` : `AQI ${min}~${max}`;
  return `${label} (${value})`;
}

function bandLine(emoji: string, label: string, band: BandReport): string {
  if (!band.available) return `${emoji} ${label}: 정보 없음`;
  return (
    `${emoji} ${label} ${GRADE_EMOJI[band.grade]} ${timeText(band)} · ` +
    `더위 ${heatLabel(band.wbgt)} ${Math.round(band.temp)}°C · 자외선 ${uvLabel(band.uvi)}`
  );
}

/**
 * Build the Korean post: a rotating hook, the date, the day's air quality, then
 * the dawn and evening bands (when to run + conditions then), and a rotating
 * recommendation. Line 1 is the date (localized in code for the replies).
 */
export function buildKoreanPost(
  c: Conditions,
  dtSeconds: number,
  hook: string,
  recommendation: string,
): string {
  return [
    hook,
    bangkokDateLabel(dtSeconds),
    '',
    `😷 미세먼지: ${airText(Math.round(c.aqiMin), Math.round(c.aqiMax))}`,
    '',
    bandLine('🌅', '새벽', c.dawn),
    bandLine('🌆', '저녁', c.evening),
    '',
    recommendation,
  ].join('\n');
}
