import { bangkokDateLabel, pickByDay } from '../util/time.js';

/**
 * Light evening content bodies (the part under the header + date). A mix of
 * polls, Soi Cat haiku, Bangkok running trivia, and run-then-eat tips — variety
 * keeps the feed fresh and opens more discovery surfaces. Each is plain Korean;
 * EN/TH are translated and tagged at publish time.
 */
export const EVENING_POSTS: readonly string[] = [
  '내일은 어디서 뛸래?\n🌅 룸피니 / 🌆 강변 / 🏞️ 라마9 공원\n댓글로 알려줘 👇 내일 아침 소이캣이 컨디션 봐줄게.',
  '뛰고 나서 뭐 먹지? ☕\n공원 근처 카페에서 콜드브루 한 잔이 회복에 딱.\n너의 러닝 후 단골 메뉴는? 👇',
  '소이캣의 하이쿠 🐾\n새벽 공기 속\n발끝이 먼저 깨네\n도시는 아직 꿈',
  '방콕 러닝 팁 💡\n더운 날엔 시작을 평소보다 느리게.\n첫 1km는 몸을 깨우는 시간이야.',
  '오늘 달린 사람? 🙋\n거리는 중요하지 않아. 나간 것 자체가 멋져.\n오늘의 한 줄 후기를 남겨줘 👇',
  '소이캣의 하이쿠 🐾\n노을 지는 길\n그림자 길어질 때\n숨이 가벼워',
  '내일 목표 정하기 🎯\n거창하지 않아도 돼. "20분 천천히"도 훌륭한 계획이야.\n너의 내일 한 줄 목표는? 👇',
  '방콕 러닝 팁 💡\n수분은 뛰기 30분 전부터 미리.\n목 마르기 전에 마시는 게 핵심이야.',
  '뛰고 나서 어디서 쉴까? 🌳\n그늘 벤치에서 5분 스트레칭이면 회복이 빨라져.\n너의 쿨다운 루틴을 공유해줘 👇',
  '소이캣의 하이쿠 🐾\n빗방울 멎고\n젖은 길 위 발자국\n나만의 아침',
] as const;

/** Build today's evening post: header, date (line 2), then rotated content. */
export function buildEveningPost(dtSeconds: number): string {
  const body = pickByDay(EVENING_POSTS, dtSeconds);
  return ['🐱 소이캣의 저녁 한 컷', bangkokDateLabel(dtSeconds), '', body].join('\n');
}
