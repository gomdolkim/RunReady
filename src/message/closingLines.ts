import type { Grade } from '../types.js';

/** Closing-line pools, one per verdict. A line is picked at random each day. */
export const CLOSING_LINES: Record<Grade, readonly string[]> = {
  GO: ['뛰러 가요! 🏃', '오늘 같은 날 안 뛰면 손해!', 'PR 노리기 좋은 날씨네요'],
  CAUTION: ['워밍업 충분히, 페이스 조절하세요', '수분 많이 챙기고 다녀와요 💧', '오늘은 회복런 정도가 딱'],
  SKIP: ['오늘은 트레드밀 데이 🏃‍♀️🚪', '헬스장에서 만나요 💪', '실내 운동 + 스트레칭 추천'],
} as const;

/** Pick a closing line for the grade. `rng` is injectable for deterministic tests. */
export function pickClosingLine(grade: Grade, rng: () => number = Math.random): string {
  const pool = CLOSING_LINES[grade];
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[index]!;
}
