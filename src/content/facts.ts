import { FACTS_LAUNCH_DATE, TIMEZONE_FACTS } from '../config.js';

/**
 * "돈의 진실" — a 50-day Korean money/career fact series for Threads.
 *
 * One surprising-but-true fact per day, posted ~17:30 KST. Each fact follows the
 * same five-part franchise structure so the feed reads as one recognisable series
 * (and people follow to not miss the next number):
 *
 *   ① hook      — a curiosity gap / a punchy number (becomes the post's first line)
 *   ② body      — the fact in plain language with a concrete number or mechanism
 *   ③ kick      — the screenshot-worthy reframe
 *   ④ question  — a one-line prompt that invites replies (engagement → reach)
 *
 * CATALOG groups the seeds by bucket (easy to scan/maintain). The daily feed does
 * NOT walk the raw order — FACTS below interleaves the five buckets round-robin so
 * consecutive days alternate topics (invest → salary → spending → career → tax),
 * cycling back to the start after 50 days. The series number (n) is assigned by
 * that interleaved order.
 *
 * Figures are accurate as of 2026-06 for a Korean audience; Korea-specific tax
 * thresholds (pension credit, card deduction rates, gift exemption) reflect
 * current rules and should be re-checked if they change.
 */
export type FactBucket = 'invest' | 'salary' | 'spending' | 'career' | 'tax';

/** Round-robin order the daily feed cycles through. */
export const BUCKET_ORDER: readonly FactBucket[] = [
  'invest',
  'salary',
  'spending',
  'career',
  'tax',
] as const;

interface FactSeed {
  id: string;
  bucket: FactBucket;
  /** One short topic hashtag (Korean), appended after the series + bucket tags. */
  tag: string;
  hook: string;
  body: string;
  kick: string;
  question: string;
}

/** A resolved fact: a seed plus its series number (1..50) in rotation order. */
export interface Fact extends FactSeed {
  n: number;
}

const CATALOG: readonly FactSeed[] = [
  // ── 복리·투자 (invest) ─────────────────────────────────────────────
  {
    id: 'rule-72', bucket: 'invest', tag: '복리',
    hook: '72를 수익률로 나누면, 내 돈이 두 배 되는 데 걸리는 시간이 나옵니다.',
    body: '연 6%면 72÷6=12년, 연 8%면 9년.\n근데 은행 이자 2%는? 무려 36년이에요.',
    kick: '같은 1,000만원인데 누구는 9년, 누구는 36년입니다.',
    question: '지금 당신 돈은 몇 %로 굴러가고 있나요?',
  },
  {
    id: 'inflation-cash', bucket: 'invest', tag: '인플레이션',
    hook: '물가가 매년 3%만 올라도, 24년 뒤 1억의 가치는 5천만원이 됩니다.',
    body: '현금으로만 들고 있으면 가만히 있어도 가치가 반토막.\n"안전하게 현금"이 사실은 가장 천천히 잃는 방법일 수 있어요.',
    kick: '통장에 묵힌 돈은 안전한 게 아니라, 조용히 녹고 있습니다.',
    question: '지금 통장에 생활비 몇 달치 이상 자고 있나요?',
  },
  {
    id: 'start-early', bucket: 'invest', tag: '복리',
    hook: '20대에 8년만 붓고 멈춘 사람이, 30대부터 40년 부은 사람을 이깁니다.',
    body: '복리에서는 "얼마"보다 "언제 시작했나"가 더 셉니다.\n시간이 원금보다 더 많은 일을 하거든요.',
    kick: '가장 비싼 건 돈이 아니라, 흘려보낸 시간이에요.',
    question: '당신이 투자를 시작한(또는 시작할) 나이는 몇 살인가요?',
  },
  {
    id: 'best-days', bucket: 'invest', tag: '투자심리',
    hook: '지난 20년, 가장 많이 오른 "며칠"만 놓쳐도 수익이 반토막 났습니다.',
    body: '그런데 그 며칠은 대부분 폭락 직후에 옵니다.\n무서워서 팔고 나간 사람이 정확히 그날을 놓쳐요.',
    kick: '시장을 "맞히려는" 사람보다, 버티고 있는 사람이 이깁니다.',
    question: '당신은 폭락장에서 팔아봤나요, 버텨봤나요?',
  },
  {
    id: 'fee-drag', bucket: 'invest', tag: '수수료',
    hook: '연 1% 수수료가 별거 아니라고요? 30년이면 최종 수익의 4분의 1을 가져갑니다.',
    body: '수수료도 복리로 빠져나가거든요.\n1%와 0.1% 상품의 30년 뒤 차이는 수천만원입니다.',
    kick: '수익률은 못 정해도, 수수료는 당신이 정할 수 있어요.',
    question: '지금 들고 있는 상품의 보수율, 알고 계신가요?',
  },
  {
    id: 'loss-recovery', bucket: 'invest', tag: '투자심리',
    hook: '50%를 잃으면, 100%를 벌어야 겨우 본전입니다.',
    body: '반토막 난 계좌는 두 배가 올라야 제자리.\n그래서 크게 잃지 않는 게 크게 버는 것보다 중요해요.',
    kick: '부자가 되는 첫 번째 규칙은 "잃지 않는 것"입니다.',
    question: '당신의 투자에서 "최악의 경우"를 계산해본 적 있나요?',
  },
  {
    id: 'real-return', bucket: 'invest', tag: '예금',
    hook: '예금 이자 3%를 받아도, 실제로는 마이너스일 수 있습니다.',
    body: '이자에서 세금 15.4%를 떼고, 물가 상승까지 빼면\n손에 남는 실질 수익은 0에 가깝거나 마이너스예요.',
    kick: '"원금 보장"이 "가치 보장"은 아닙니다.',
    question: '당신의 예금은 지금 물가를 이기고 있나요?',
  },
  {
    id: 'dividend', bucket: 'invest', tag: '배당',
    hook: '주식 장기 수익의 상당 부분은 주가 상승이 아니라 "배당 재투자"에서 나옵니다.',
    body: '받은 배당으로 다시 사는 것만으로 수익이 눈덩이처럼 커져요.\n수십 년을 보면 그 차이가 전체 수익을 가릅니다.',
    kick: '조용히 들어오는 배당이, 가장 꾸준한 복리 엔진입니다.',
    question: '당신은 배당을 다시 투자하나요, 써버리나요?',
  },
  {
    id: 'index-beats', bucket: 'invest', tag: '투자',
    hook: '10년 넘게 보면, 전문가가 굴리는 펀드 10개 중 8~9개가 시장 지수를 못 이깁니다.',
    body: '비싼 수수료를 내고도 그래요.\n그래서 "그냥 지수에 묻어둔" 사람이 대부분의 전문가를 이깁니다.',
    kick: '이기려 애쓰지 않는 게, 가장 자주 이기는 전략이에요.',
    question: '당신은 종목을 고르나요, 시장을 통째로 사나요?',
  },
  {
    id: 'lottery-ev', bucket: 'invest', tag: '돈상식',
    hook: '복권 1등 확률은, 벼락에 맞을 확률보다 훨씬 낮습니다.',
    body: '매주 5천원씩 40년을 사도 1등 기대값은 거의 0.\n그 돈을 묻어뒀다면 수천만원이 됐을 거예요.',
    kick: '복권은 "확률을 모르는 사람을 위한 세금"이라고도 불려요.',
    question: '복권값을 투자로 돌린다면, 어디에 넣고 싶나요?',
  },

  // ── 연봉·이직·협상 (salary) ────────────────────────────────────────
  {
    id: 'job-hop-raise', bucket: 'salary', tag: '이직',
    hook: '한 회사에 오래 다니면 오히려 손해 보는 이유.',
    body: '내부 연봉 인상률은 평균 3~5%.\n이직할 때 인상률은 평균 10~20%예요.',
    kick: '회사는 "안 나갈 사람"에게 굳이 더 줄 이유가 없거든요.',
    question: '마지막으로 본인 몸값을 점검한 게 언제인가요?',
  },
  {
    id: 'first-offer', bucket: 'salary', tag: '연봉협상',
    hook: '회사가 처음 부른 연봉은, 보통 "줄 수 있는 최대치"가 아닙니다.',
    body: '첫 제안엔 협상 여지가 남아 있는 경우가 많아요.\n그냥 "감사합니다"만 하면 그 여지는 회사 몫이 됩니다.',
    kick: '한 번의 정중한 역제안이, 평생 연봉의 출발점을 올립니다.',
    question: '당신은 첫 제안을 그냥 받아들인 적 있나요?',
  },
  {
    id: 'salary-anchor', bucket: 'salary', tag: '연봉협상',
    hook: '연봉 협상에선 숫자를 먼저 부르는 게 유리할 때가 많습니다.',
    body: '처음 나온 숫자가 "기준점(앵커)"이 돼서\n최종 합의가 그 근처에서 정해지거든요.',
    kick: '먼저 말하지 않으면, 상대의 숫자가 기준이 됩니다.',
    question: '당신은 협상에서 먼저 숫자를 부르는 편인가요?',
  },
  {
    id: 'counteroffer-trap', bucket: 'salary', tag: '이직',
    hook: '퇴사하겠다니까 회사가 더 주겠다? 그거 받고 남으면 대개 곧 다시 나갑니다.',
    body: '돈은 올라도 떠나려던 진짜 이유는 그대로거든요.\n게다가 회사는 이제 당신을 "떠날 사람"으로 봅니다.',
    kick: '카운터오퍼는 문제를 푸는 게 아니라, 미루는 겁니다.',
    question: '당신이 떠나고 싶은 진짜 이유는 돈인가요, 다른 건가요?',
  },
  {
    id: 'raise-base', bucket: 'salary', tag: '연봉',
    hook: '보너스보다 "기본급 인상"을 챙겨야 하는 이유.',
    body: '기본급은 다음 해 인상률·퇴직금·이직 기준이 다 여기서 출발해요.\n일회성 보너스는 그 자리에서 끝나고요.',
    kick: '보너스는 한 번 쓰면 끝, 기본급은 평생 복리로 따라옵니다.',
    question: '당신이라면 보너스 500과 기본급 +300, 어느 쪽인가요?',
  },
  {
    id: 'salary-transparency', bucket: 'salary', tag: '연봉',
    hook: '동료가 얼마 받는지 모르면, 손해 보는 건 대개 당신입니다.',
    body: '연봉 정보가 막혀 있을수록 협상력은 회사로 쏠려요.\n"비밀 유지"가 누구에게 유리한지 생각해보세요.',
    kick: '정보가 없으면, 당신은 "부르는 게 값"인 사람이 됩니다.',
    question: '당신은 자기 직무의 시장 연봉을 알고 있나요?',
  },
  {
    id: 'promotion-vs-jobhop', bucket: 'salary', tag: '이직',
    hook: '승진 한 번 기다리는 동안, 이직하면 두 단계를 뛰기도 합니다.',
    body: '내부 승진은 자리·예산·순번에 묶여 있어요.\n밖에서는 당신의 "지금 실력"으로 새로 값이 매겨집니다.',
    kick: '충성은 이력서에 적히지 않습니다.',
    question: '지금 자리에서 다음 단계까지 몇 년이 걸리나요?',
  },
  {
    id: 'negotiate-nonsalary', bucket: 'salary', tag: '연봉협상',
    hook: '연봉이 안 오르면, 연봉 말고 다른 걸 협상하세요.',
    body: '사이닝 보너스, 추가 휴가, 재택, 직책, 교육비.\n회사가 "현금"보다 내주기 쉬운 카드들이 있어요.',
    kick: '협상 테이블엔 숫자 하나만 있는 게 아닙니다.',
    question: '돈 말고, 당신에게 가장 값진 조건은 무엇인가요?',
  },
  {
    id: 'raise-timing', bucket: 'salary', tag: '연봉',
    hook: '연봉 인상은 "타이밍"이 절반입니다.',
    body: '큰 성과를 낸 직후, 그리고 회사가 내년 예산을 짜기 전에 말하세요.\n평가가 다 끝난 뒤엔 이미 숫자가 정해져 있어요.',
    kick: '같은 말도, 언제 하느냐가 결과를 바꿉니다.',
    question: '당신 회사가 "예산을 짜는 시기"는 언제인가요?',
  },
  {
    id: 'starting-salary', bucket: 'salary', tag: '연봉',
    hook: '사회 초년의 연봉 차이는, 평생을 따라다닙니다.',
    body: '다음 연봉은 지금 연봉에서 출발하니까요.\n첫 단추가 몇 % 낮으면, 그 격차가 수십 년 복리로 벌어집니다.',
    kick: '첫 연봉 협상은, 사실 미래의 나를 위한 협상이에요.',
    question: '첫 직장 연봉, 당신은 협상해봤나요?',
  },

  // ── 소비·심리 (spending) ───────────────────────────────────────────
  {
    id: 'latte-factor', bucket: 'spending', tag: '돈관리',
    hook: '커피 끊어서 부자 된 사람은 없습니다.',
    body: '하루 5천원 커피 = 1년 180만원.\n근데 집·차·대출이자 "큰 3개"에서 새는 돈은 그 10배예요.',
    kick: '부자는 작은 걸 아끼는 게 아니라, 큰 결정 3개를 안 틀립니다.',
    question: '당신의 "큰 3개"는 지금 괜찮은가요?',
  },
  {
    id: 'lifestyle-creep', bucket: 'spending', tag: '소비심리',
    hook: '연봉이 올랐는데 왜 통장은 그대로일까요?',
    body: '소득이 늘면 지출도 슬그머니 따라 올라요. (라이프스타일 인플레)\n더 좋은 집, 더 좋은 차… 그렇게 "오른 만큼" 사라집니다.',
    kick: '버는 속도보다 쓰는 속도가 빠르면, 연봉은 의미가 없어요.',
    question: '최근 연봉이 오른 만큼, 저축도 늘었나요?',
  },
  {
    id: 'anchoring-price', bucket: 'spending', tag: '소비심리',
    hook: '"정가 10만원 → 3만원" 이 가격표는 당신을 속이는 장치입니다.',
    body: '안 팔리던 10만원이 진짜인지 아무도 몰라요.\n높은 "원래 가격"은 3만원을 싸 보이게 만드는 미끼일 뿐.',
    kick: '할인율이 아니라, "이게 나에게 3만원어치인가"를 보세요.',
    question: '최근 "할인"이라서 산 물건, 정말 필요했나요?',
  },
  {
    id: 'loss-aversion', bucket: 'spending', tag: '소비심리',
    hook: '사람은 만원을 버는 기쁨보다, 만원을 잃는 고통을 두 배로 느낍니다.',
    body: '그래서 환불·해지가 그렇게 어려운 거예요.\n기업은 이 "손실 회피" 심리를 정확히 노립니다.',
    kick: '"이미 낸 돈이 아까워서" 계속 쓰고 있진 않나요?',
    question: '지금 손해가 아까워서 못 끊고 있는 게 있나요?',
  },
  {
    id: 'subscription-leak', bucket: 'spending', tag: '돈관리',
    hook: '당신 통장에서 매달 조용히 빠지는 구독료, 다 기억하나요?',
    body: '월 1만원짜리 구독 5개면 1년에 60만원.\n"한 달에 얼마 안 해서" 시작한 게 모이면 큰돈이에요.',
    kick: '안 쓰는 구독은, 매달 자동으로 새는 구멍입니다.',
    question: '지금 당장 떠오르지 않는 구독, 몇 개나 있을까요?',
  },
  {
    id: 'free-trial', bucket: 'spending', tag: '소비심리',
    hook: '"무료 체험"이 공짜가 아닌 이유.',
    body: '한 번 내 것이 되면 사람은 그걸 과대평가해서 못 놓아요. (보유효과)\n기업은 당신이 해지 날짜를 잊을 거란 데 베팅합니다.',
    kick: '무료 체험의 진짜 상품은, 당신의 "깜빡함"이에요.',
    question: '해지하려다 그냥 둔 무료 체험, 있었나요?',
  },
  {
    id: 'pay-pain', bucket: 'spending', tag: '소비심리',
    hook: '같은 물건도 카드로 사면 더 비싸게 삽니다.',
    body: '현금은 "돈이 나가는 아픔"이 바로 느껴져요.\n카드·간편결제는 그 아픔을 지워서 더 쉽게 쓰게 만듭니다.',
    kick: '결제가 편할수록, 지갑은 더 빨리 비어요.',
    question: '큰 지출, 카드 말고 현금으로 내본 적 있나요?',
  },
  {
    id: 'decoy-pricing', bucket: 'spending', tag: '소비심리',
    hook: '카페의 "중간 사이즈"는 사실 당신을 큰 사이즈로 보내려는 미끼입니다.',
    body: '작은 것과 큰 것 사이에 애매한 중간을 끼워두면,\n사람들은 "큰 게 이득"이라며 더 비싼 걸 골라요.',
    kick: '선택지는 우연이 아니라, 설계된 함정일 때가 많아요.',
    question: '당신은 "이왕이면 큰 거"를 자주 고르나요?',
  },
  {
    id: 'mental-accounting', bucket: 'spending', tag: '소비심리',
    hook: '보너스와 월급은 같은 돈인데, 보너스는 더 헤프게 쓰게 됩니다.',
    body: '"공돈" "보너스"라고 이름 붙이는 순간 마음속 통장이 달라져요. (심리적 회계)\n같은 100만원인데 출처에 따라 쓰임이 달라집니다.',
    kick: '돈에는 꼬리표가 없어요. 꼬리표는 당신이 붙이는 거예요.',
    question: '이번 보너스, 월급이었다면 똑같이 썼을까요?',
  },
  {
    id: 'sunk-cost', bucket: 'spending', tag: '소비심리',
    hook: '재미없는 영화를 끝까지 보는 습관, 그게 당신 돈도 새게 합니다.',
    body: '"이미 낸 돈이 아까워서" 더 붓는 게 매몰비용의 함정.\n이미 나간 돈은 어떤 선택을 해도 돌아오지 않아요.',
    kick: '지난 돈이 아니라, 지금부터의 득실만 보세요.',
    question: '아까워서 못 놓고 있는 것, 지금 떠오르나요?',
  },

  // ── 커리어·일머리 (career) ─────────────────────────────────────────
  {
    id: 'visibility', bucket: 'career', tag: '커리어',
    hook: '일 잘하는 사람이 아니라, 일 잘하는 게 "보이는" 사람이 승진합니다.',
    body: '상사는 당신이 한 일의 절반도 몰라요.\n조용히 해내는 사람보다, 성과를 "보고하는" 사람이 앞섭니다.',
    kick: '실력은 입장권일 뿐, 승진은 가시성이 만듭니다.',
    question: '이번 주 당신의 성과, 윗사람이 알고 있나요?',
  },
  {
    id: 'weak-ties', bucket: 'career', tag: '커리어',
    hook: '좋은 이직 기회는 친한 친구가 아니라, "어쩌다 아는 사람"에게서 옵니다.',
    body: '가까운 사람들은 나와 같은 정보 안에 있어요.\n새로운 기회는 약하게 연결된 사람들에게서 흘러옵니다.',
    kick: '인맥의 힘은 "깊이"가 아니라 "넓이"에서 나올 때가 많아요.',
    question: '당신의 마지막 기회는 누구를 통해 왔나요?',
  },
  {
    id: 'skill-vs-reputation', bucket: 'career', tag: '커리어',
    hook: '실력은 입장권, 평판은 통행증입니다.',
    body: '실력만으로 들어갈 순 있어도, 멀리 가려면 평판이 필요해요.\n사람들은 "무엇을 했나"보다 "같이 일하고 싶나"로 당신을 기억합니다.',
    kick: '당신이 없는 자리에서 사람들이 하는 말, 그게 평판이에요.',
    question: '동료들은 당신을 한 문장으로 어떻게 말할까요?',
  },
  {
    id: 'first-impression', bucket: 'career', tag: '일머리',
    hook: '첫인상은 몇 초 만에 정해지고, 몇 달을 갑니다.',
    body: '사람은 첫 판단을 바꾸기보다, 그 판단을 "증명"하려 들어요.\n새 팀, 새 회사에서 첫 몇 주가 그래서 중요합니다.',
    kick: '두 번째 기회는, 첫인상을 이겨야 옵니다.',
    question: '새 환경에서 당신의 첫 2주, 어떻게 보내나요?',
  },
  {
    id: 'saying-no', bucket: 'career', tag: '일머리',
    hook: '다 받아주는 사람은 인정받는 게 아니라, 만만해집니다.',
    body: '모든 일에 "예"하면, 정작 중요한 일에 쓸 시간이 사라져요.\n잘 거절하는 사람이 핵심 일을 맡습니다.',
    kick: '"아니오"를 못 하면, 당신의 우선순위는 남이 정해요.',
    question: '최근 거절했어야 했는데 못 한 일, 있나요?',
  },
  {
    id: 'document-work', bucket: 'career', tag: '일머리',
    hook: '기억하는 사람이 아니라, 기록하는 사람이 인정받습니다.',
    body: '말로 한 성과는 휘발돼요.\n적어두고 공유한 사람의 일이, 회의에서 "사실"이 됩니다.',
    kick: '남는 건 한 일이 아니라, 적어둔 일이에요.',
    question: '당신의 이번 분기 성과, 한 장으로 정리돼 있나요?',
  },
  {
    id: 'quit-boss', bucket: 'career', tag: '커리어',
    hook: '사람들은 회사를 떠나는 게 아니라, 상사를 떠납니다.',
    body: '연봉·복지가 좋아도, 매일 마주하는 상사가 별로면 버티기 힘들어요.\n반대로 좋은 상사 하나가 사람을 붙잡습니다.',
    kick: '당신이 누구 밑에서 일하느냐가, 회사 이름보다 중요해요.',
    question: '당신은 지금 상사에게 배우고 있나요?',
  },
  {
    id: 'busy-vs-productive', bucket: 'career', tag: '일머리',
    hook: '바쁜 것과 성과를 내는 것은 전혀 다른 일입니다.',
    body: '하루 종일 메일·회의로 꽉 차도, 중요한 일은 안 했을 수 있어요.\n"바빠 보이는 것"으로 평가받던 시대는 지났습니다.',
    kick: '움직임이 아니라, 결과가 당신을 증명합니다.',
    question: '오늘 가장 중요한 일 하나, 끝냈나요?',
  },
  {
    id: 'power-vs-title', bucket: 'career', tag: '커리어',
    hook: '진짜 권력은 직책이 아니라, 예산과 결정권에서 나옵니다.',
    body: '거창한 직함이 있어도 정작 정하는 게 없으면 힘이 없어요.\n작아 보여도 "돈과 결정"을 쥔 자리가 진짜 핵심입니다.',
    kick: '명함이 아니라, 무엇을 결정할 수 있는지를 보세요.',
    question: '당신의 자리는 무엇을 "결정"할 수 있나요?',
  },
  {
    id: 'learning-compounds', bucket: 'career', tag: '커리어',
    hook: '커리어 초반의 배움은, 돈보다 빠르게 복리로 불어납니다.',
    body: '지금 익힌 실력이 다음 기회를 부르고, 그게 또 다음을 불러요.\n그래서 초반엔 연봉보다 "얼마나 배우나"가 더 큰 자산입니다.',
    kick: '20대의 실력은, 30·40대 연봉의 원금이에요.',
    question: '지금 자리에서 당신은 여전히 배우고 있나요?',
  },

  // ── 세금·제도·꿀팁 (tax) ───────────────────────────────────────────
  {
    id: 'marginal-tax', bucket: 'tax', tag: '세금',
    hook: '연봉이 한 구간 올라 세율이 높아져도, 전체 월급에 그 세율이 붙는 게 아닙니다.',
    body: '높은 세율은 "넘어선 부분"에만 붙어요. (누진세)\n그래서 연봉이 올랐는데 실수령이 줄어드는 일은 없습니다.',
    kick: '"세금 때문에 더 받으면 손해"는 거의 항상 오해예요.',
    question: '혹시 이 오해 때문에 더 벌기를 망설인 적 있나요?',
  },
  {
    id: 'card-deduction', bucket: 'tax', tag: '연말정산',
    hook: '같은 돈을 써도, 체크카드·현금영수증이 신용카드보다 더 많이 돌려받습니다.',
    body: '연말정산 소득공제율이 신용카드는 15%, 체크·현금은 30%예요.\n총급여의 25%를 넘게 쓴 부분부터 공제가 시작됩니다.',
    kick: '25%까진 신용카드, 그 위부턴 체크카드 — 순서가 절세예요.',
    question: '당신은 신용·체크카드를 전략적으로 나눠 쓰나요?',
  },
  {
    id: 'pension-credit', bucket: 'tax', tag: '연금',
    hook: '연금저축·IRP에 넣은 돈은, 그해 세금에서 최대 16.5%를 돌려받습니다.',
    body: '두 계좌 합쳐 연 900만원까지 세액공제 대상이에요.\n900만원을 채우면 최대 148만원을 환급받습니다. (총급여에 따라 13.2~16.5%)',
    kick: '노후 준비를 하는데, 나라가 보너스까지 얹어주는 셈이에요.',
    question: '당신은 올해 연금 계좌를 얼마나 채웠나요?',
  },
  {
    id: 'isa-account', bucket: 'tax', tag: '절세',
    hook: 'ISA 계좌 하나로, 투자 수익에 붙는 세금을 크게 줄일 수 있습니다.',
    body: '일반 계좌는 이자·배당에 15.4% 세금이 붙어요.\nISA는 일정 한도까지 비과세, 넘는 부분도 낮은 세율로 분리과세입니다.',
    kick: '같은 투자, 다른 계좌 — 세금에서 차이가 납니다.',
    question: '당신은 투자할 때 "어떤 계좌"인지 따져보나요?',
  },
  {
    id: 'financial-income-tax', bucket: 'tax', tag: '세금',
    hook: '이자·배당 소득이 연 2천만원을 넘으면, 세금 구조가 통째로 바뀝니다.',
    body: '2천만원까진 15.4% 분리과세로 끝나요.\n넘으면 다른 소득과 합쳐 "금융소득종합과세" 대상이 됩니다.',
    kick: '돈이 돈을 버는 단계에선, 세금 설계가 수익률을 가릅니다.',
    question: '당신의 금융소득은 지금 어느 구간에 있나요?',
  },
  {
    id: 'monthly-rent-credit', bucket: 'tax', tag: '연말정산',
    hook: '월세 사는 직장인이라면, 낸 월세의 일부를 세금에서 돌려받을 수 있습니다.',
    body: '조건을 맞추면 연말정산에서 월세 세액공제를 받아요.\n신청 안 하면 그냥 사라지는, "아는 사람만 받는 돈"입니다.',
    kick: '제도는 자동이 아니에요. 챙기는 사람만 돌려받습니다.',
    question: '당신은 받을 수 있는 공제를 다 챙기고 있나요?',
  },
  {
    id: 'gift-exemption', bucket: 'tax', tag: '증여',
    hook: '성인 자녀에게는 10년에 5천만원까지, 세금 없이 물려줄 수 있습니다.',
    body: '이 비과세 한도는 10년마다 새로 생겨요.\n그래서 "일찍, 나눠서" 주는 게 한 번에 몰아주는 것보다 유리합니다.',
    kick: '증여는 금액보다 "타이밍"의 게임이에요.',
    question: '가족 간 돈, 계획을 세워본 적 있나요?',
  },
  {
    id: 'housing-subscription', bucket: 'tax', tag: '절세',
    hook: '주택청약통장은 집을 노리는 용도이자, 연말정산 공제 수단이기도 합니다.',
    body: '무주택 세대주 조건을 맞추면 납입액의 일부를 소득공제받아요.\n집을 사기 전까지도 "절세 통장"으로 일하는 셈이죠.',
    kick: '한 통장이 두 가지 일을 하게 만드는 게 재테크예요.',
    question: '당신의 청약통장은 지금 일하고 있나요?',
  },
  {
    id: 'health-insurance', bucket: 'tax', tag: '돈상식',
    hook: '퇴사하면 건강보험료가 갑자기 오를 수 있습니다.',
    body: '직장에선 회사가 절반을 내주거든요.\n지역가입자가 되면 소득뿐 아니라 재산·차까지 보험료에 반영돼요.',
    kick: '퇴사·이직 사이의 "공백"엔, 숨은 비용이 숨어 있어요.',
    question: '이직 공백기의 건강보험, 생각해본 적 있나요?',
  },
  {
    id: 'year-end-truth', bucket: 'tax', tag: '연말정산',
    hook: '연말정산은 "13월의 월급"이 아닙니다.',
    body: '미리 떼간 세금을 정산해서, 더 냈으면 돌려주고 덜 냈으면 더 받는 것뿐이에요.\n환급은 보너스가 아니라, 원래 내 돈을 돌려받는 겁니다.',
    kick: '많이 돌려받았다는 건, 그동안 이자 없이 빌려줬다는 뜻이기도 해요.',
    question: '당신은 환급파인가요, 추가납부파인가요?',
  },
] as const;

/**
 * Interleave the buckets round-robin (one from each bucket per round) so the
 * daily feed alternates topics. Fail-fast if the buckets are unbalanced.
 */
function buildRotation(seeds: readonly FactSeed[]): readonly FactSeed[] {
  const byBucket = BUCKET_ORDER.map((bucket) => seeds.filter((s) => s.bucket === bucket));
  const rounds = byBucket[0]!.length;
  for (const [i, group] of byBucket.entries()) {
    if (group.length !== rounds) {
      throw new Error(
        `facts: bucket "${BUCKET_ORDER[i]}" has ${group.length} entries, expected ${rounds}`,
      );
    }
  }
  const rotation: FactSeed[] = [];
  for (let round = 0; round < rounds; round += 1) {
    for (const group of byBucket) rotation.push(group[round]!);
  }
  return rotation;
}

/** The 50 facts in interleaved rotation order, numbered 1..50. */
export const FACTS: readonly Fact[] = buildRotation(CATALOG).map((seed, i) => ({
  ...seed,
  n: i + 1,
}));

/** Midnight (UTC ms) of the Seoul calendar date for a UNIX-seconds timestamp. */
function seoulMidnightUtc(dtSeconds: number): number {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_FACTS,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const p: Record<string, string> = {};
  for (const part of fmt.formatToParts(dtSeconds * 1000)) p[part.type] = part.value;
  return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day));
}

const LAUNCH_MIDNIGHT_UTC = (() => {
  const [y, m, d] = FACTS_LAUNCH_DATE.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`facts: invalid FACTS_LAUNCH_DATE "${FACTS_LAUNCH_DATE}"`);
  return Date.UTC(y, m - 1, d);
})();

/**
 * Pick today's fact. The series counts up from #1 on FACTS_LAUNCH_DATE and
 * cycles back to #1 every 50 days. Dates before launch wrap correctly too.
 */
export function pickFact(dtSeconds: number): Fact {
  const days = Math.round((seoulMidnightUtc(dtSeconds) - LAUNCH_MIDNIGHT_UTC) / 86_400_000);
  const index = ((days % FACTS.length) + FACTS.length) % FACTS.length;
  return FACTS[index]!;
}
