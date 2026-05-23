import { airLabel, heatLabel, uvLabel } from '../logic/labels.js';
import type { Conditions, Grade, TimeAdvice } from '../types.js';
import { bangkokDateLabel } from '../util/time.js';

const VERDICT_EMOJI: Record<Grade, string> = { GO: '🟢', CAUTION: '🟡', SKIP: '🔴' };
const VERDICT_LINE: Record<Grade, string> = {
  GO: '오늘은 달리기 딱 좋아요!',
  CAUTION: '새벽·저녁이라면 뛸 만해요',
  SKIP: '오늘은 실외 러닝 비추천',
};

/** Render the "best time to run" line value from the time advice. */
function timeAdviceText(times: TimeAdvice): string {
  switch (times.kind) {
    case 'windows':
      return times.windows.map((w) => `${w.start}–${w.end}`).join(' · ');
    case 'coolest':
      return `마땅한 때 없음 — 그나마 ${times.start} 무렵`;
    case 'none':
      return '오늘은 정보가 없어요';
  }
}

/**
 * Build the Korean post: a rotating hook, the date, a plain-Korean verdict,
 * labeled metrics (no cryptic units), time-of-day advice, and a rotating
 * closing call-to-action. Line 1 is the date (localized in code for replies).
 */
export function buildKoreanPost(
  c: Conditions,
  dtSeconds: number,
  hook: string,
  closingLine: string,
): string {
  return [
    hook,
    bangkokDateLabel(dtSeconds),
    '',
    `${VERDICT_EMOJI[c.grade]} ${VERDICT_LINE[c.grade]}`,
    '',
    `😷 미세먼지: ${airLabel(c.aqi)} (AQI ${Math.round(c.aqi)})`,
    `🥵 한낮 더위: ${heatLabel(c.peakWbgt)} (최고 ${c.peakTemp.toFixed(1)}°C)`,
    `🧴 한낮 자외선: ${uvLabel(c.peakUv)} (최고 ${Math.round(c.peakUv)})`,
    '',
    `⏰ 뛰기 좋은 시간: ${timeAdviceText(c.times)}`,
    '',
    closingLine,
  ].join('\n');
}
