import type { Spot } from '../types.js';
import { pickByDay } from '../util/time.js';

/** Curated, real Bangkok running spots. Seed set — append more over time. */
export const SPOTS: readonly Spot[] = [
  {
    id: 'lumpini', nameKo: '룸피니 공원', nameEn: 'Lumpini Park', nameTh: 'สวนลุมพินี',
    area: '실롬/사라댕', blurbKo: '방콕 러너의 성지. 약 2.5km 외곽 루프, 호수와 나무 그늘.',
    lat: 13.7307, lon: 100.5418, loopKm: 2.5, shade: 2, tag: 'Lumpini',
  },
  {
    id: 'benjakitti', nameKo: '벤짜낏 포레스트파크', nameEn: 'Benjakitti Forest Park', nameTh: 'สวนป่าเบญจกิติ',
    area: '아속/클롱토이', blurbKo: '도심 속 숲길과 호수 데크 루프. 그늘이 많아 더위에 강해요.',
    lat: 13.7234, lon: 100.5601, loopKm: 1.9, shade: 2, tag: 'Benjakitti',
  },
  {
    id: 'benjasiri', nameKo: '벤짜시리 공원', nameEn: 'Benjasiri Park', nameTh: 'สวนเบญจสิริ',
    area: '프롬퐁', blurbKo: 'BTS 프롬퐁 바로 앞. 작지만 접근성 최고, 짧게 끊어 달리기 좋아요.',
    lat: 13.7300, lon: 100.5697, loopKm: 0.9, shade: 2, tag: 'Benjasiri',
  },
  {
    id: 'chatuchak', nameKo: '짜뚜짝 공원', nameEn: 'Chatuchak Park', nameTh: 'สวนจตุจักร',
    area: '짜뚜짝', blurbKo: '넓은 잔디와 가로수 길. 주말 시장 옆, 큰 한 바퀴가 시원해요.',
    lat: 13.8077, lon: 100.5530, loopKm: 3.0, shade: 3, tag: 'Chatuchak',
  },
  {
    id: 'rotfai', nameKo: '롯파이 공원(철도공원)', nameEn: 'Wachirabenchathat (Rot Fai) Park', nameTh: 'สวนวชิรเบญจทัศ',
    area: '짜뚜짝', blurbKo: '자전거·러닝 천국. 길이 넓고 평탄해 페이스 잡기 좋아요.',
    lat: 13.8170, lon: 100.5430, loopKm: 3.0, shade: 2, tag: 'RotFai',
  },
  {
    id: 'ramaIX', nameKo: '수안루앙 라마9 공원', nameEn: 'Suan Luang Rama IX', nameTh: 'สวนหลวง ร.๙',
    area: '쁘라웻', blurbKo: '방콕 최대 공원. 호수와 정원 사이 긴 루프, 롱런에 제격.',
    lat: 13.6970, lon: 100.6580, loopKm: 4.0, shade: 2, tag: 'RamaIX',
  },
  {
    id: 'skypark', nameKo: '짜오프라야 스카이파크', nameEn: 'Chao Phraya Sky Park', nameTh: 'สวนลอยฟ้าเจ้าพระยา',
    area: '강변(타딘댕)', blurbKo: '강 위를 가로지르는 짧은 다리 공원. 일출 전망이 일품이에요.',
    lat: 13.7250, lon: 100.4940, loopKm: 0.3, shade: 1, tag: 'SkyPark',
  },
  {
    id: 'chongnonsi', nameKo: '총논시 운하공원', nameEn: 'Chong Nonsi Canal Park', nameTh: 'สวนเฉลิมพระเกียรติฯ ช่องนนทรี',
    area: '사톤', blurbKo: '운하를 따라 길게 뻗은 도심 산책로. 출근 전 가볍게 한 바퀴.',
    lat: 13.7190, lon: 100.5330, loopKm: 0.8, shade: 1, tag: 'ChongNonsi',
  },
  {
    id: 'princessmother', nameKo: '프린세스마더 기념공원', nameEn: 'Princess Mother Memorial Park', nameTh: 'อุทยานเฉลิมพระเกียรติสมเด็จย่า',
    area: '클롱산(톤부리)', blurbKo: '톤부리 강변의 조용한 정원. 한적하게 마음 비우며 달려요.',
    lat: 13.7330, lon: 100.4990, loopKm: 0.5, shade: 2, tag: 'PrincessMother',
  },
  {
    id: 'saranrom', nameKo: '사란롬 공원', nameEn: 'Saranrom Park', nameTh: 'สวนสราญรมย์',
    area: '라따나꼬신(올드타운)', blurbKo: '왕궁 근처 옛 정원. 큰 나무 그늘 아래 운치 있는 코스.',
    lat: 13.7480, lon: 100.4940, loopKm: 0.6, shade: 3, tag: 'Saranrom',
  },
  {
    id: 'queensirikit', nameKo: '퀸 시리킷 공원', nameEn: 'Queen Sirikit Park', nameTh: 'สวนสมเด็จพระนางเจ้าสิริกิติ์',
    area: '짜뚜짝', blurbKo: '짜뚜짝 옆 식물원 같은 공원. 그늘 많고 공기가 맑아요.',
    lat: 13.8130, lon: 100.5500, loopKm: 2.0, shade: 3, tag: 'QueenSirikit',
  },
  {
    id: 'bangkrachao', nameKo: '방까쩌(방콕의 허파)', nameEn: 'Bang Krachao Green Lung', nameTh: 'บางกะเจ้า',
    area: '프라쁘라댕', blurbKo: '강 건너 초록 섬. 흙길과 나무터널, 도심을 잊게 하는 공기.',
    lat: 13.6900, lon: 100.5560, loopKm: 5.0, shade: 3, tag: 'BangKrachao',
  },
] as const;

/** Pick today's spot (rotates through the set by day of year, no repeats until exhausted). */
export function pickSpot(dtSeconds: number): Spot {
  return pickByDay(SPOTS, dtSeconds);
}
