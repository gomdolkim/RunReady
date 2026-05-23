import { heatLabel, pm25Label, uvLabel } from '../logic/labels.js';
import type { Conditions, Grade, TimeAdvice } from '../types.js';
import { bangkokDateLabel } from '../util/time.js';

const VERDICT_EMOJI: Record<Grade, string> = { GO: '🟢', CAUTION: '🟡', SKIP: '🔴' };
const VERDICT_LINE: Record<Grade, string> = {
  GO: '오늘은 달리기 딱 좋아요!',
  CAUTION: '뛸 수 있어요, 무리만 마세요',
  SKIP: '한낮 실외는 무리예요',
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
    `😷 미세먼지: ${pm25Label(c.pm25)} (${Math.round(c.pm25)})`,
    `🥵 더위: ${heatLabel(c.wbgt)} (${c.temp.toFixed(1)}°C·습도 ${Math.round(c.humidity)}%)`,
    `🧴 자외선: ${uvLabel(c.uvi)} (${Math.round(c.uvi)})`,
    '',
    `⏰ 뛰기 좋은 시간: ${timeAdviceText(c.times)}`,
    '',
    closingLine,
  ].join('\n');
}
