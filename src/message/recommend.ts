import type { Outcome } from '../types.js';
import { pickByDay } from '../util/time.js';

/**
 * Closing recommendation lines, one pool per outcome. The tone nudges people to
 * run at the better time (or indoors when neither works). A line is chosen per
 * day so the post stays fresh.
 */
export const RECOMMENDATIONS: Record<Outcome, readonly string[]> = {
  dawn: [
    '오늘은 새벽이 베스트! 시원할 때 달려요 🌅',
    '해 뜨기 전, 지금이 기회예요 🏃',
    '새벽 공기 마시며 가볍게 한 바퀴!',
    '오늘의 정답은 새벽 러닝이에요',
    '동트기 전에 살짝 다녀와요',
    '시원한 새벽, 놓치지 마세요!',
    '새벽에 달리면 하루가 상쾌해요 🌿',
    '오늘은 일찍 일어나 새벽 러닝 어때요?',
  ],
  evening: [
    '오늘은 해 질 녘이 좋아요 🌆',
    '저녁 러닝 추천! 선선할 때 나가요',
    '퇴근 후 한 바퀴 어때요? 🏃',
    '해 지면 시원해져요, 저녁을 노려요',
    '오늘은 저녁이 베스트!',
    '노을 보며 달리기 딱 좋은 날 🌇',
    '저녁에 가볍게 달려봐요',
    '하루 마무리 러닝, 저녁이 좋아요',
  ],
  both: [
    '새벽이든 저녁이든 좋아요! 골라서 뛰어요 🎉',
    '오늘은 아무 때나 달려도 좋은 날!',
    '하루 종일 러닝하기 좋은 날이에요 🏃',
    '원하는 시간에 마음껏 달려요!',
    '새벽도 저녁도 환영! 즐겁게 달려요',
    '컨디션 최고, 언제든 나가요',
    '골라 뛰는 행복, 오늘 누려요 😎',
    '오늘은 러닝하기 참 좋은 날!',
  ],
  indoor: [
    '오늘은 실내가 정답이에요 💪',
    '트레드밀에서 만나요 🏃‍♀️',
    '에어컨 아래 가볍게 몸 풀어요',
    '무리 말고 실내 운동 추천해요',
    '오늘은 쉬어가도 좋아요',
    '실내에서 코어 운동 어때요? 💥',
    '컨디션 관리도 실력! 오늘은 실내로',
    '바깥은 무리, 시원한 곳에서 운동해요',
  ],
} as const;

/** Pick today's recommendation for the outcome (rotates by day of year). */
export function pickRecommendation(outcome: Outcome, dtSeconds: number): string {
  return pickByDay(RECOMMENDATIONS[outcome], dtSeconds);
}
