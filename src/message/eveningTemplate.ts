import type { Workout } from '../content/workout.js';
import { bangkokDateLabel } from '../util/time.js';

/**
 * Build the Korean evening post announcing tomorrow's workout: a rotating hook,
 * tomorrow's date, the workout (or rest), a heat reminder, and a coach note.
 * Line 1 is the date (localized in code for the EN/TH replies).
 */
export function buildEveningPost(
  workout: Workout,
  dtSeconds: number,
  hook: string,
  tip: string,
): string {
  const head = workout.isRest ? `🛌 내일은 ${workout.type}` : `🏃 내일 운동: ${workout.type}`;
  const note = workout.isRest
    ? '잘 쉬는 것도 훈련이에요 😌'
    : '🌡️ 한낮은 피하고 새벽·저녁에 · 수분 충분히 💧';

  return [hook, bangkokDateLabel(dtSeconds), '', head, workout.detail, '', note, `💪 ${tip}`].join(
    '\n',
  );
}
