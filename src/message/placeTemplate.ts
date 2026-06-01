import type { Place } from '../types.js';
import { bangkokDateLabel, pickByDay } from '../util/time.js';

/**
 * Closing lines, rotated by day so the post never feels canned. Each ends with
 * the mascot's paw print. The mascot name "소이캣" is preserved across languages
 * by the translator (see message/translate.ts).
 */
const CLOSINGS: readonly string[] = [
  '오늘은 여기 어때요? 소이캣과 함께 🐾',
  '천천히 둘러보고 와요. 소이캣이 응원할게요 🐾',
  '방콕의 또 다른 얼굴, 같이 보러 가요 🐾',
  '오늘의 한 곳, 마음에 들었으면 좋겠어요 🐾',
  '사진 한 장 남기기 좋은 곳이에요. 소이캣과 함께 🐾',
] as const;

/**
 * Build the Korean "place of the day" post. Line 0 is the static brand header;
 * line 1 is the date (the translator leaves it as-is — it is localized in code
 * for the EN/TH replies). Hashtags are NOT included here; they are appended per
 * language at publish time (see message/tags.ts).
 */
export function buildPlacePost(place: Place, dtSeconds: number): string {
  const closing = pickByDay(CLOSINGS, dtSeconds);
  return [
    '🐱 소이캣의 오늘의 방콕',
    bangkokDateLabel(dtSeconds),
    '',
    `📍 ${place.nameKo} · ${place.area}`,
    place.blurbKo,
    '',
    `👀 볼거리: ${place.seeKo}`,
    `🚇 가는 법: ${place.goKo}`,
    '',
    closing,
  ].join('\n');
}
