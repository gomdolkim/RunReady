import type { Conditions, Grade, GoldenWindow } from '../types.js';
import { bangkokDateLabel } from '../util/time.js';

const GRADE_EMOJI: Record<Grade, string> = { GO: '🟢', CAUTION: '🟡', SKIP: '🔴' };
const QUALITY_LABEL = { best: '최적', good: '양호' } as const;

function windowLine(w: GoldenWindow): string {
  return `${w.start}–${w.end} (${QUALITY_LABEL[w.quality]})`;
}

/** The first line of every post: brand + localized date label. */
export function postHeader(dateLabel: string): string {
  return `☀️ Wat Run? — ${dateLabel}`;
}

/** Build the Korean main post from conditions, the post date, and a closing line. */
export function buildKoreanPost(c: Conditions, dtSeconds: number, closingLine: string): string {
  const windows = c.windows.length > 0 ? c.windows.map(windowLine) : ['추천 시간대 없음'];

  return [
    postHeader(bangkokDateLabel(dtSeconds)),
    `오늘 컨디션: ${GRADE_EMOJI[c.grade]} ${c.grade}`,
    '',
    `📊 PM2.5: ${Math.round(c.pm25)} μg/m³`,
    `🌡️ 기온: ${c.temp.toFixed(1)}°C (WBGT ${c.wbgt.toFixed(1)})`,
    `💧 습도: ${Math.round(c.humidity)}%`,
    `☂️ UV: ${Math.round(c.uvi)}`,
    '',
    '🌅 골든 윈도우',
    ...windows,
    '',
    closingLine,
  ].join('\n');
}
