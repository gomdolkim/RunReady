import { bangkokWeekday, pickByDay } from '../util/time.js';

export interface Workout {
  /** Workout type, e.g. "인터벌", "장거리(LSD)", "휴식". */
  type: string;
  /** Specific session for the day, e.g. "400m × 5 (사이 200m 조깅 회복)". */
  detail: string;
  /** True for rest days. */
  isRest: boolean;
}

interface DayPlan {
  type: string;
  isRest: boolean;
  details: readonly string[];
}

/**
 * A simple weekly training rhythm (0 = Sun … 6 = Sat). Each weekday has a type;
 * the specific session rotates by week so the same weekday varies week to week.
 * Intensities are intentionally moderate — every post also reminds runners to
 * adjust to their condition.
 */
const PLAN: Record<number, DayPlan> = {
  0: { type: '회복런', isRest: false, details: ['20분 가볍게 조깅', '3~4km 아주 천천히', '편하게 30분, 대화 가능 페이스'] },
  1: { type: '휴식', isRest: true, details: ['완전 휴식 — 푹 쉬기', '가벼운 산책 + 스트레칭', '폼롤러로 뭉친 곳 풀기'] },
  2: { type: '인터벌', isRest: false, details: ['400m × 5 (사이 200m 조깅 회복)', '800m × 3 (사이 400m 조깅)', '200m × 8 (사이 200m 걷기·조깅)', '1km × 3 (사이 3분 휴식)'] },
  3: { type: '이지런', isRest: false, details: ['30~40분 편하게', '5km 회복 페이스', '40분 대화 가능 페이스'] },
  4: { type: '템포런', isRest: false, details: ['20분 템포 (약간 힘든 페이스)', '3km 템포 + 앞뒤 1km 조깅', '5km 빌드업 (점점 빠르게)'] },
  5: { type: '휴식', isRest: true, details: ['완전 휴식 — 내일 장거리 준비', '가벼운 스트레칭·폼롤러', '잘 자고 푹 쉬기'] },
  6: { type: '장거리(LSD)', isRest: false, details: ['10km 천천히', '12~14km 대화 페이스', '90분 LSD (수분 보충 챙기기)'] },
};

/** Build the workout for the given day (weekday → type, week → specific session). */
export function buildWorkout(dtSeconds: number): Workout {
  const plan = PLAN[bangkokWeekday(dtSeconds)]!;
  return { type: plan.type, detail: pickByDay(plan.details, dtSeconds), isRest: plan.isRest };
}

/** Rotating coach notes (condition-aware, encouraging). */
export const WORKOUT_TIPS: readonly string[] = [
  '무리는 금물, 컨디션 따라 조절해요',
  '워밍업·쿨다운 잊지 마세요',
  '수분 충분히 챙기고 출발 💧',
  '폼이 흐트러지면 잠깐 쉬어가요',
  '페이스보다 꾸준함이 이겨요',
  '운동 후 가벼운 스트레칭 잊지 말기',
  '잘 먹고 잘 자는 것도 훈련의 일부예요',
  '아프면 멈추기 — 내일이 있으니까요',
  '기록보다 오늘의 컨디션을 믿어요',
  '즐기면서 달리는 게 제일 빨라요 🏃',
];

/** Pick today's coach note (rotates by day of year). */
export function pickTip(dtSeconds: number): string {
  return pickByDay(WORKOUT_TIPS, dtSeconds);
}
