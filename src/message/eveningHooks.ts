import { pickByDay } from '../util/time.js';

/** Rotating opening hooks for the evening post (tomorrow's workout tone). */
export const EVENING_HOOKS: readonly string[] = [
  '내일은 어떤 운동? 💪',
  '내일의 러닝 메뉴 🏃',
  '내일 뭐 뛸까? 미리 체크!',
  '내일의 트레이닝 예고 📋',
  '내일 러닝, 미리 준비해요',
  '내일은 이거 뛰어요!',
  '내일의 운동 미리보기 👀',
  '내일 러닝 계획 세우기 ✅',
  '내일은 무슨 훈련일까?',
  '내일 달리기 전, 오늘 미리 알아둬요',
  '내일의 러닝 숙제 📒',
  '내일 뭐 할지 정해뒀어요!',
  '내일 러닝 준비물: 이 운동 💪',
  '내일은 이렇게 달려봐요',
  '내일의 러닝 한 스푼 🥄',
  '내일 운동, 살짝 스포일러 👀',
  '내일 러너 여러분 주목! 📢',
  '내일의 트레이닝 픽 🎯',
  '내일은 어떻게 뛸까요?',
  '내일 러닝, 이걸로 정했어요',
  '내일의 운동 미리 알림 ⏰',
  '내일 러닝 메뉴 나왔습니다 🍽️',
  '내일은 이 운동으로!',
  '내일의 달리기, 준비됐나요?',
  '내일 러닝 미리 예약 🗓️',
];

/** Pick today's evening hook (rotates by day of year). */
export function pickEveningHook(dtSeconds: number): string {
  return pickByDay(EVENING_HOOKS, dtSeconds);
}
