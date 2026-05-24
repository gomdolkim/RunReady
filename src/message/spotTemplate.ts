import { airLabel, heatLabel, uvLabel } from '../logic/labels.js';
import type { Grade, SpotConditions } from '../types.js';
import { bangkokDateLabel } from '../util/time.js';

const GRADE_EMOJI: Record<Grade, string> = { GO: '🟢', CAUTION: '🟡', SKIP: '🔴' };
const GRADE_TEXT: Record<Grade, string> = {
  GO: '지금 뛰기 좋아요',
  CAUTION: '뛸 만해요, 컨디션 보며',
  SKIP: '오늘은 쉬엄쉬엄',
};

/** When to run: the qualifying window (start–end), or the best single hour. */
function windowText(c: SpotConditions): string {
  if (c.window) {
    const start = Number(c.window.start.slice(0, 2));
    const end = Number(c.window.end.slice(0, 2));
    return `${start}–${end}시`;
  }
  if (c.bestHour !== null) return `${c.bestHour}시쯤`;
  return '정보 없음';
}

/**
 * Build the Korean "spot of the day" post. Line 0 is the static header; line 1
 * is the date (localized in code for the EN/TH replies — translate() overrides
 * the second line). Hashtags are NOT included here; they are appended per
 * language at publish time (see message/tags.ts).
 */
export function buildSpotPost(c: SpotConditions, dtSeconds: number, coachLine: string): string {
  const lines = [
    '🐱 소이캣의 오늘의 스팟',
    bangkokDateLabel(dtSeconds),
    '',
    `📍 ${c.spot.nameKo} · ${c.spot.area}`,
    c.spot.blurbKo,
    '',
    `${GRADE_EMOJI[c.grade]} ${GRADE_TEXT[c.grade]}`,
    `🌡️ ${Math.round(c.temp)}°C ${heatLabel(c.wbgt)} · 💨 AQI ${c.aqi} ${airLabel(c.aqi)} · ☀️ 자외선 ${uvLabel(c.uvi)}`,
    `⏰ 뛰기 좋은 시간: ${windowText(c)}`,
  ];
  if (c.rainHint) lines.push(c.rainHint);
  lines.push('', `${coachLine} — 소이캣`);
  return lines.join('\n');
}
