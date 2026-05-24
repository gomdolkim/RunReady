import type { Grade } from '../types.js';
import { pickByDay } from '../util/time.js';

/**
 * Soi Cat's coaching lines — warm, encouraging, low-pressure. One pool per
 * grade; a line is chosen per day so posts stay fresh. The "— 소이캣" signature
 * is appended by the template, not here.
 */
const COACH_LINES: Record<Grade, readonly string[]> = {
  GO: [
    '오늘은 여기야. 천천히 한 바퀴, 무리하지 말고',
    '컨디션 좋은 날이야. 가볍게 즐기면서 달려',
    '시원할 때 딱이야. 끝나고 물 한 잔 잊지 말고',
    '발걸음 가벼운 아침이야. 호흡만 편하게',
    '좋아, 오늘은 기분 좋게 달릴 수 있어',
    '딱 좋은 날이야. 욕심내지 말고 미소 지으며',
    '바람이 좋아. 천천히 시작해서 몸을 깨워',
    '오늘은 나가길 잘했다 싶을 거야. 편하게 가',
  ],
  CAUTION: [
    '나쁘진 않아. 페이스 줄이고 그늘 위주로 돌자',
    '조금 더워. 짧게 끊어 달리고 수분 자주 챙겨',
    '무리는 금물이야. 힘들면 걷기로 바꿔도 좋아',
    '살펴 가며 달리자. 몸이 보내는 신호를 들어',
    '천천히, 오늘은 기록보다 컨디션이 먼저야',
    '괜찮아, 대신 짧게. 무리하면 내가 속상해',
    '그늘 따라 가볍게. 끝나고 충분히 식혀줘',
    '여유 있게 가자. 더우면 언제든 멈춰도 돼',
  ],
  SKIP: [
    '오늘은 쉬엄쉬엄. 무리하면 내일이 힘들어',
    '바깥은 좀 버거워. 가볍게 몸만 풀어도 충분해',
    '쉬는 것도 훈련이야. 오늘은 나처럼 그늘에서',
    '안 좋은 날이야. 실내 스트레칭으로 대신하자',
    '오늘은 회복에 집중해. 내일 더 잘 달리려고',
    '무리 말고 쉬어가. 컨디션 지키는 게 실력이야',
    '바깥 공기가 별로야. 오늘은 쉬어도 괜찮아',
    '쉬어가는 용기도 필요해. 내일 같이 달리자',
  ],
} as const;

/** Pick today's coach line for the grade (rotates by day of year). */
export function pickCoachLine(grade: Grade, dtSeconds: number): string {
  return pickByDay(COACH_LINES[grade], dtSeconds);
}
