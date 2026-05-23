import type { Grade } from '../types.js';
import { pickByDay } from '../util/time.js';

/**
 * Closing call-to-action lines, one pool per verdict. The tone always nudges
 * people toward running (outdoors when good, indoors/cooler hours when not).
 * A line is chosen per day so the post stays fresh.
 */
export const CLOSING_LINES: Record<Grade, readonly string[]> = {
  GO: [
    '이런 날 안 뛰면 손해예요! 🏃',
    '지금 바로 나가서 달려요!',
    '오늘 같은 날이 PR 찬스 ⏱️',
    '상쾌한 공기, 마음껏 달려봐요 🌿',
    '컨디션 최고! 신나게 한 바퀴',
    '망설일 이유가 없어요, 출발! 👟',
    '오늘의 러닝, 분명 기분 좋을 거예요',
    '가볍게라도 꼭 나가보세요!',
    '완벽한 날씨, 러닝화 신을 시간 ⏰',
    '오늘 달리면 하루가 달라져요',
    '햇살 받으며 기분 좋게 달려요 ☀️',
    '이 컨디션, 놓치면 아쉬워요!',
    '오늘은 페이스 한번 올려볼까요? 🔥',
    '친구도 불러서 같이 달려요 👯',
    '딱 좋은 날, 즐겁게 뛰어요!',
  ],
  CAUTION: [
    '워밍업 충분히, 천천히 가봐요',
    '물 꼭 챙기고 무리는 금물 💧',
    '오늘은 회복런이 딱이에요',
    '페이스 욕심은 잠시 넣어두고 🐢',
    '그늘 코스로 가볍게 달려요',
    '짧게라도 좋으니 나가봐요!',
    '무리 말고 즐기는 만큼만 🙆',
    '수분 보충 잊지 말고 출발!',
    '살살, 그래도 오늘도 달려요',
    '컨디션 보며 천천히 가요',
    '이른 새벽이나 저녁을 노려요 🌅',
    '가벼운 조깅으로 몸 풀어요',
    '충분히 마시고, 충분히 쉬며 💧',
    '오늘은 거리보다 기분으로 달려요',
    '무리 없이, 꾸준함이 이겨요!',
  ],
  SKIP: [
    '한낮은 피하고, 새벽이나 실내로!',
    '오늘은 트레드밀에서 만나요 💪',
    '에어컨 아래 가볍게 몸 풀어요',
    '실내 러닝도 훌륭한 훈련이에요',
    '무리는 금물, 컨디션 관리도 실력 🧘',
    '오늘은 스트레칭으로 대신해요',
    '시원한 헬스장에서 한 바퀴 어때요?',
    '쉬는 것도 내일을 위한 투자예요',
    '실내에서 코어 운동 어떠세요? 💥',
    '더위는 잠깐, 꾸준함은 오래가요',
    '오늘은 실내, 내일은 야외! 🏠',
    '가벼운 실내 운동으로 리듬 유지해요',
    '무리하지 말고 몸을 아껴요',
    '트레드밀 위에서도 우리는 러너 🏃‍♀️',
    '오늘은 푹 쉬고 컨디션 채워요',
  ],
} as const;

/** Pick today's closing line for the grade (rotates by day of year). */
export function pickClosingLine(grade: Grade, dtSeconds: number): string {
  return pickByDay(CLOSING_LINES[grade], dtSeconds);
}
