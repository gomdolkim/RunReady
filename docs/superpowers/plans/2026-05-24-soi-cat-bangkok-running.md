# 소이캣의 방콕 러닝 (Wat Run? v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Threads bot from an abstract dawn-vs-evening weather utility into "소이캣의 오늘의 스팟" — a warm cat coach that each morning recommends one real Bangkok running spot with accurate per-spot conditions, plus a light evening rotation post, to drive discovery and follower growth.

**Architecture:** Morning pipeline = pick a spot (day rotation) → fetch that spot's weather (Open-Meteo) + air (WAQI geo feed at the spot's coordinates) → grade the dawn band with the existing WBGT/air logic → render a Korean "spot of the day" post → translate to EN/TH → append per-language hashtags → publish the connected KO→EN→TH chain with a cat image. Evening pipeline = pick a light rotation post (poll/haiku/trivia/cafe) → translate → tag → publish. Data sources change (Open-Meteo replaces OpenWeather; WAQI becomes per-spot); the grading logic, translation+validation, date-in-code, thread chaining, and image rotation are reused.

**Tech Stack:** TypeScript (ESM, `.js` import specifiers), Node ≥20, Vitest, Anthropic SDK (`claude-haiku-4-5` for translation), Open-Meteo (no key), WAQI/aqicn (token), Threads Graph API.

**Spec:** `docs/superpowers/specs/2026-05-24-soi-cat-bangkok-running-design.md`

---

## File Structure

**New files:**
- `src/data/openMeteo.ts` — `fetchWeather(lat, lon): Promise<HourlyWeather[]>` (replaces OpenWeather)
- `src/content/spots.ts` — `SPOTS: readonly Spot[]`, `pickSpot(dtSeconds): Spot`
- `src/content/coachLines.ts` — `pickCoachLine(grade, dtSeconds): string`
- `src/logic/rain.ts` — `rainHint(hourly, band): string | null`
- `src/message/spotTemplate.ts` — `buildSpotPost(c, dtSeconds, coachLine): string`
- `src/message/tags.ts` — `tagLine(lang, spotTag?)`, `appendTags(body, lang, spotTag?)`
- `src/message/eveningRotation.ts` — `buildEveningPost(dtSeconds): string`

**Modified files:**
- `src/types.ts` — add `precipProb?` to `HourlyWeather`; add `Spot`, `SpotAir`, `SpotConditions`
- `src/data/airQuality.ts` — add `fetchSpotAir(token, lat, lon): Promise<SpotAir>`
- `src/pipeline.ts` — add `buildSpotConditions(spot, hourly, air): SpotConditions`
- `src/index.ts` — rewrite morning entry (spot-of-the-day)
- `src/evening.ts` — rewrite evening entry (rotation)
- `src/config.ts` — drop unused `LOCATION` (at cleanup)
- `.env.example`, `README.md`, `.github/workflows/morning-post.yml`

**Deleted at cleanup (with their `.test.ts`):**
- `src/data/weather.ts`, `src/content/workout.ts`, `src/message/eveningTemplate.ts`,
  `src/message/eveningHooks.ts`, `src/message/recommend.ts`, `src/message/hooks.ts`,
  `src/message/koTemplate.ts`
- From `src/types.ts`: `AirQuality`, `Weather`, `Conditions`, `Outcome`
- From `src/logic/bands.ts`: `decideOutcome` (+ its tests)
- From `src/data/airQuality.ts`: old `fetchAirQuality`
- From `src/pipeline.ts`: old `buildConditions`, `buildPost`

**Ordering principle:** new modules are added *alongside* the old ones so the suite stays green; the switchover (Tasks 10–11) and deletion (Task 12) happen only after the new path works.

---

## Task 1: Open-Meteo weather source

**Files:**
- Modify: `src/types.ts` (add optional `precipProb`)
- Create: `src/data/openMeteo.ts`
- Test: `src/data/openMeteo.test.ts`

- [ ] **Step 1: Add `precipProb` to `HourlyWeather`**

In `src/types.ts`, change the `HourlyWeather` interface to add an optional field (optional keeps the old `data/weather.ts` compiling until cleanup):

```typescript
/** A single hour of weather. */
export interface HourlyWeather {
  dt: number;
  /** Air temperature in °C. */
  temp: number;
  /** Relative humidity in %. */
  humidity: number;
  /** UV index for the hour. */
  uvi: number;
  /** Precipitation probability in % (Open-Meteo). Optional for legacy sources. */
  precipProb?: number;
}
```

- [ ] **Step 2: Write the failing test**

Create `src/data/openMeteo.test.ts`:

```typescript
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWeather } from './openMeteo.js';
import { bangkokHour } from '../util/time.js';

function mockFetch(payload: unknown, ok = true) {
  const fn = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => payload });
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

const SAMPLE = {
  utc_offset_seconds: 25200,
  hourly: {
    time: ['2026-05-24T05:00', '2026-05-24T06:00'],
    temperature_2m: [24.5, 25.1],
    relative_humidity_2m: [80, 78],
    uv_index: [0.4, 1.9],
    precipitation_probability: [10, 60],
  },
};

describe('fetchWeather (Open-Meteo)', () => {
  it('maps hourly arrays into HourlyWeather with Bangkok-correct hours', async () => {
    const fn = mockFetch(SAMPLE);
    const hours = await fetchWeather(13.72, 100.56);

    expect(hours).toHaveLength(2);
    expect(hours[0]).toMatchObject({ temp: 24.5, humidity: 80, uvi: 0.4, precipProb: 10 });
    expect(hours[1]).toMatchObject({ temp: 25.1, humidity: 78, uvi: 1.9, precipProb: 60 });
    expect(bangkokHour(hours[0]!.dt)).toBe(5);
    expect(bangkokHour(hours[1]!.dt)).toBe(6);

    const url = String(fn.mock.calls[0]![0]);
    expect(url).toContain('open-meteo.com');
    expect(url).toContain('latitude=13.72');
    expect(url).toContain('longitude=100.56');
    expect(url).toContain('precipitation_probability');
    expect(url).toContain('timezone=Asia%2FBangkok');
  });

  it('rejects on a non-ok HTTP response', async () => {
    mockFetch({}, false);
    await expect(fetchWeather(1, 2)).rejects.toThrow();
  });

  it('rejects when hourly data is missing', async () => {
    mockFetch({ utc_offset_seconds: 25200 });
    await expect(fetchWeather(1, 2)).rejects.toThrow(/hourly/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/data/openMeteo.test.ts`
Expected: FAIL — `Cannot find module './openMeteo.js'`.

- [ ] **Step 4: Write the implementation**

Create `src/data/openMeteo.ts`:

```typescript
import type { HourlyWeather } from '../types.js';
import { getJson } from '../util/http.js';

interface OpenMeteoResponse {
  utc_offset_seconds?: number;
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    relative_humidity_2m?: number[];
    uv_index?: number[];
    precipitation_probability?: number[];
  };
}

/**
 * Fetch today's + tomorrow's hourly weather for a coordinate from Open-Meteo
 * (no API key required). Times come back as local ISO (Asia/Bangkok) without an
 * offset, so each hour's UNIX timestamp is reconstructed from `utc_offset_seconds`.
 */
export async function fetchWeather(lat: number, lon: number): Promise<HourlyWeather[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,relative_humidity_2m,uv_index,precipitation_probability` +
    `&timezone=Asia%2FBangkok&forecast_days=2`;
  const body = (await getJson(url)) as OpenMeteoResponse;

  const h = body.hourly;
  if (
    !h ||
    !Array.isArray(h.time) ||
    !Array.isArray(h.temperature_2m) ||
    !Array.isArray(h.relative_humidity_2m)
  ) {
    throw new Error('Open-Meteo response missing hourly data');
  }
  const offset = typeof body.utc_offset_seconds === 'number' ? body.utc_offset_seconds : 25200;

  const out: HourlyWeather[] = [];
  for (let i = 0; i < h.time.length; i++) {
    const iso = h.time[i];
    const temp = h.temperature_2m[i];
    const humidity = h.relative_humidity_2m[i];
    if (typeof iso !== 'string' || typeof temp !== 'number' || typeof humidity !== 'number') continue;
    const dt = Math.floor(Date.parse(`${iso}:00Z`) / 1000) - offset;
    out.push({
      dt,
      temp,
      humidity,
      uvi: typeof h.uv_index?.[i] === 'number' ? h.uv_index[i]! : 0,
      precipProb: typeof h.precipitation_probability?.[i] === 'number' ? h.precipitation_probability[i]! : 0,
    });
  }
  if (out.length === 0) throw new Error('Open-Meteo returned no usable hours');
  return out;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/data/openMeteo.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/data/openMeteo.ts src/data/openMeteo.test.ts
git commit -m "feat: Open-Meteo per-coordinate hourly weather source"
```

---

## Task 2: WAQI per-spot air source

**Files:**
- Modify: `src/types.ts` (add `SpotAir`)
- Modify: `src/data/airQuality.ts` (add `fetchSpotAir`, keep old `fetchAirQuality`)
- Test: `src/data/airQuality.test.ts` (add cases)

- [ ] **Step 1: Add the `SpotAir` type**

Append to `src/types.ts`:

```typescript
/** Air reading at a specific spot, from the WAQI station nearest its coords. */
export interface SpotAir {
  /** PM2.5 US AQI (rounded). */
  aqi: number;
  /** Name of the WAQI station the reading came from. */
  station: string;
}
```

- [ ] **Step 2: Write the failing test**

Append to `src/data/airQuality.test.ts` (keep the existing `import` line for `fetchAirQuality`, add `fetchSpotAir`):

```typescript
import { fetchSpotAir } from './airQuality.js';

describe('fetchSpotAir', () => {
  it('returns the nearest station PM2.5 AQI and station name for the coords', async () => {
    const fn = mockFetch({
      status: 'ok',
      data: { aqi: 70, iaqi: { pm25: { v: 42 } }, city: { name: 'Bangkok – Chong Nonsi' } },
    });
    expect(await fetchSpotAir('tok', 13.73, 100.53)).toEqual({
      aqi: 42,
      station: 'Bangkok – Chong Nonsi',
    });
    const url = String(fn.mock.calls[0]![0]);
    expect(url).toContain('geo:13.73;100.53');
    expect(url).toContain('token=tok');
  });

  it('falls back to overall aqi when pm25 sub-index is absent', async () => {
    mockFetch({ status: 'ok', data: { aqi: 55, city: { name: 'X' } } });
    expect(await fetchSpotAir('tok', 1, 2)).toEqual({ aqi: 55, station: 'X' });
  });

  it('rejects when WAQI status is not ok', async () => {
    mockFetch({ status: 'error' });
    await expect(fetchSpotAir('bad', 1, 2)).rejects.toThrow(/WAQI/);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/data/airQuality.test.ts`
Expected: FAIL — `fetchSpotAir` is not exported.

- [ ] **Step 4: Write the implementation**

Append to `src/data/airQuality.ts` (keep the existing imports and `fetchAirQuality`; add the import of `SpotAir` to the existing type import line):

```typescript
import type { AirQuality, SpotAir } from '../types.js';

interface WaqiSpotResponse {
  status?: string;
  data?: {
    aqi?: number;
    iaqi?: { pm25?: { v?: number } };
    city?: { name?: string };
  };
}

/**
 * Fetch the air reading at a spot from the WAQI station nearest its coordinates
 * (the geo feed auto-selects the closest station). Prefers the PM2.5 sub-index
 * (what runners care about), falling back to the overall AQI.
 */
export async function fetchSpotAir(token: string, lat: number, lon: number): Promise<SpotAir> {
  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${encodeURIComponent(token)}`;
  const body = (await getJson(url)) as WaqiSpotResponse;

  if (body.status !== 'ok') {
    throw new Error(`WAQI returned status "${body.status ?? 'unknown'}"`);
  }
  const pm25 = body.data?.iaqi?.pm25?.v;
  const value = typeof pm25 === 'number' ? pm25 : body.data?.aqi;
  if (typeof value !== 'number') {
    throw new Error('WAQI feed missing AQI reading');
  }
  return { aqi: Math.round(value), station: body.data?.city?.name ?? 'Unknown station' };
}
```

Note: the existing `import type { AirQuality } from '../types.js';` line must become `import type { AirQuality, SpotAir } from '../types.js';` (do not create a second import line for the same module).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/data/airQuality.test.ts`
Expected: PASS (old 4 + new 3 = 7 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/data/airQuality.ts src/data/airQuality.test.ts
git commit -m "feat: WAQI per-spot air reading (fetchSpotAir)"
```

---

## Task 3: Spot dataset + daily rotation

**Files:**
- Modify: `src/types.ts` (add `Spot`)
- Create: `src/content/spots.ts`
- Test: `src/content/spots.test.ts`

- [ ] **Step 1: Add the `Spot` type**

Append to `src/types.ts`:

```typescript
/** A real Bangkok running spot. Coordinates are approximate park centroids. */
export interface Spot {
  /** Stable slug id. */
  id: string;
  nameKo: string;
  nameEn: string;
  nameTh: string;
  /** Korean neighbourhood label, e.g. "아속/클롱토이". */
  area: string;
  /** One-line Korean description (vibe + why it's good to run). */
  blurbKo: string;
  lat: number;
  lon: number;
  /** Approximate loop distance in km (data only; for future filtering). */
  loopKm: number;
  /** Shade rating 0 (exposed) – 3 (very shaded). */
  shade: 0 | 1 | 2 | 3;
  /** English hashtag token (no spaces), e.g. "Benjakitti". */
  tag: string;
}
```

- [ ] **Step 2: Write the failing test**

Create `src/content/spots.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { SPOTS, pickSpot } from './spots.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

describe('SPOTS dataset', () => {
  it('has unique ids and tags and valid Bangkok-ish coordinates', () => {
    expect(SPOTS.length).toBeGreaterThanOrEqual(10);
    expect(new Set(SPOTS.map((s) => s.id)).size).toBe(SPOTS.length);
    expect(new Set(SPOTS.map((s) => s.tag)).size).toBe(SPOTS.length);
    for (const s of SPOTS) {
      expect(s.lat).toBeGreaterThan(13);
      expect(s.lat).toBeLessThan(14.5);
      expect(s.lon).toBeGreaterThan(100);
      expect(s.lon).toBeLessThan(101);
      expect(s.tag).toMatch(/^[A-Za-z0-9]+$/);
    }
  });
});

describe('pickSpot', () => {
  it('is deterministic for a given day', () => {
    expect(pickSpot(bkk(5))).toBe(pickSpot(bkk(6)));
  });

  it('changes across consecutive days', () => {
    const a = pickSpot(bkk(5));
    const b = pickSpot(bkk(5) + 86_400);
    expect(a.id).not.toBe(b.id);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/content/spots.test.ts`
Expected: FAIL — `Cannot find module './spots.js'`.

- [ ] **Step 4: Write the implementation**

Create `src/content/spots.ts`. Coordinates are approximate park centroids (verify against a map post-implementation; WAQI/Open-Meteo only need them to be roughly right):

```typescript
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/content/spots.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/content/spots.ts src/content/spots.test.ts
git commit -m "feat: Bangkok running spot dataset + daily rotation"
```

---

## Task 4: Soi Cat coach lines

**Files:**
- Create: `src/content/coachLines.ts`
- Test: `src/content/coachLines.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/content/coachLines.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { pickCoachLine } from './coachLines.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

describe('pickCoachLine', () => {
  it('returns a non-empty warm line for each grade', () => {
    for (const grade of ['GO', 'CAUTION', 'SKIP'] as const) {
      const line = pickCoachLine(grade, bkk(5));
      expect(typeof line).toBe('string');
      expect(line.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic per day and differs by grade pool', () => {
    expect(pickCoachLine('GO', bkk(5))).toBe(pickCoachLine('GO', bkk(6)));
    // GO and SKIP draw from different pools, so the lines differ.
    expect(pickCoachLine('GO', bkk(5))).not.toBe(pickCoachLine('SKIP', bkk(5)));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/content/coachLines.test.ts`
Expected: FAIL — `Cannot find module './coachLines.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/content/coachLines.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/content/coachLines.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/content/coachLines.ts src/content/coachLines.test.ts
git commit -m "feat: Soi Cat warm coach lines per grade"
```

---

## Task 5: Rain hint

**Files:**
- Create: `src/logic/rain.ts`
- Test: `src/logic/rain.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/logic/rain.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { rainHint } from './rain.js';
import type { HourlyWeather } from '../types.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;
const hour = (h: number, precipProb: number): HourlyWeather => ({
  dt: bkk(h), temp: 25, humidity: 70, uvi: 1, precipProb,
});

describe('rainHint', () => {
  it('returns null when no hour in the band is wet enough', () => {
    const hours = [hour(5, 10), hour(6, 30), hour(7, 0)];
    expect(rainHint(hours, [4, 9])).toBeNull();
  });

  it('reports the wet hour range when probability is high', () => {
    const hours = [hour(5, 20), hour(6, 70), hour(7, 80), hour(8, 10)];
    expect(rainHint(hours, [4, 9])).toBe('🌧️ 6–7시 소나기 가능 — 우산 챙겨요');
  });

  it('reports a single wet hour without a range', () => {
    const hours = [hour(6, 90)];
    expect(rainHint(hours, [4, 9])).toBe('🌧️ 6시 소나기 가능 — 우산 챙겨요');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/logic/rain.test.ts`
Expected: FAIL — `Cannot find module './rain.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/logic/rain.ts`:

```typescript
import type { HourlyWeather } from '../types.js';
import { bangkokDateKey, bangkokHour } from '../util/time.js';

/** Precipitation probability (%) at or above which we warn about rain. */
const RAIN_THRESHOLD = 50;

/**
 * Build a Korean rain hint for today's hours within `[lo, hi]` (Bangkok local),
 * or null if none reach the threshold. Reports the first–last wet hour range.
 */
export function rainHint(hourly: HourlyWeather[], band: readonly [number, number]): string | null {
  const sorted = [...hourly].sort((a, b) => a.dt - b.dt);
  const first = sorted[0];
  if (!first) return null;

  const today = bangkokDateKey(first.dt);
  const [lo, hi] = band;
  const wet: number[] = [];
  for (const h of sorted) {
    if (bangkokDateKey(h.dt) !== today) continue;
    const clock = bangkokHour(h.dt);
    if (clock < lo || clock > hi) continue;
    if ((h.precipProb ?? 0) >= RAIN_THRESHOLD) wet.push(clock);
  }
  if (wet.length === 0) return null;

  const start = wet[0]!;
  const end = wet[wet.length - 1]!;
  const range = start === end ? `${start}시` : `${start}–${end}시`;
  return `🌧️ ${range} 소나기 가능 — 우산 챙겨요`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/logic/rain.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/logic/rain.ts src/logic/rain.test.ts
git commit -m "feat: dawn-band rain hint from precipitation probability"
```

---

## Task 6: `buildSpotConditions` in the pipeline

**Files:**
- Modify: `src/types.ts` (add `SpotConditions`)
- Modify: `src/pipeline.ts` (add `buildSpotConditions`; keep old exports for now)
- Test: `src/pipeline.spot.test.ts`

- [ ] **Step 1: Add the `SpotConditions` type**

Append to `src/types.ts`:

```typescript
/** Everything needed to render a "spot of the day" post. */
export interface SpotConditions {
  spot: Spot;
  grade: Grade;
  /** Best contiguous dawn window, if one qualifies. */
  window: GoldenWindow | null;
  /** Coolest dawn hour (fallback time), or null. */
  bestHour: number | null;
  /** Conditions at the best dawn hour. */
  wbgt: number;
  temp: number;
  uvi: number;
  /** Air at the spot. */
  aqi: number;
  station: string;
  /** Rain hint line, or null. */
  rainHint: string | null;
}
```

- [ ] **Step 2: Write the failing test**

Create `src/pipeline.spot.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { buildSpotConditions } from './pipeline.js';
import type { HourlyWeather, Spot, SpotAir } from './types.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

const spot: Spot = {
  id: 'benjakitti', nameKo: '벤짜낏', nameEn: 'Benjakitti', nameTh: 'เบญจกิติ',
  area: '아속', blurbKo: '숲길', lat: 13.72, lon: 100.56, loopKm: 1.9, shade: 2, tag: 'Benjakitti',
};

const cleanDawn: HourlyWeather[] = [
  { dt: bkk(5), temp: 24, humidity: 50, uvi: 1, precipProb: 0 },
  { dt: bkk(6), temp: 24, humidity: 50, uvi: 1, precipProb: 0 },
  { dt: bkk(13), temp: 36, humidity: 55, uvi: 11, precipProb: 0 },
];

describe('buildSpotConditions', () => {
  it('grades the dawn band with the spot air and reports conditions + station', () => {
    const air: SpotAir = { aqi: 42, station: 'Bangkok – Sathon' };
    const c = buildSpotConditions(spot, cleanDawn, air);
    expect(c.spot.id).toBe('benjakitti');
    expect(c.grade).toBe('GO');
    expect(c.window).toEqual({ start: '05:00', end: '07:00', quality: 'best' });
    expect(c.aqi).toBe(42);
    expect(c.station).toBe('Bangkok – Sathon');
    expect(c.rainHint).toBeNull();
    expect(Math.round(c.temp)).toBe(24);
  });

  it('downgrades and surfaces a rain hint when air is bad and dawn is wet', () => {
    const wet: HourlyWeather[] = [
      { dt: bkk(5), temp: 24, humidity: 50, uvi: 1, precipProb: 80 },
      { dt: bkk(6), temp: 24, humidity: 50, uvi: 1, precipProb: 70 },
    ];
    const air: SpotAir = { aqi: 160, station: 'X' }; // above good gate (100)
    const c = buildSpotConditions(spot, wet, air);
    expect(c.grade).toBe('SKIP');
    expect(c.rainHint).toBe('🌧️ 5–6시 소나기 가능 — 우산 챙겨요');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/pipeline.spot.test.ts`
Expected: FAIL — `buildSpotConditions` is not exported.

- [ ] **Step 4: Write the implementation**

Add to `src/pipeline.ts` (keep the existing imports and the old `buildConditions`/`buildPost`; add the new import and function):

```typescript
import { analyzeBand } from './logic/bands.js';
import { rainHint } from './logic/rain.js';
import type { HourlyWeather, Spot, SpotAir, SpotConditions } from './types.js';

/**
 * Combine a spot, its hourly weather, and its air reading into the data a
 * "spot of the day" post needs: grade + best window for the dawn band (gated by
 * per-hour heat and the spot's air), conditions at the best hour, and a rain hint.
 */
export function buildSpotConditions(
  spot: Spot,
  hourly: HourlyWeather[],
  air: SpotAir,
): SpotConditions {
  const band = analyzeBand(hourly, GOLDEN.bands.dawn, air.aqi);
  return {
    spot,
    grade: band.grade,
    window: band.window,
    bestHour: band.coolestHour,
    wbgt: band.wbgt,
    temp: band.temp,
    uvi: band.uvi,
    aqi: air.aqi,
    station: air.station,
    rainHint: rainHint(hourly, GOLDEN.bands.dawn),
  };
}
```

Note: `GOLDEN` and `analyzeBand` are already imported at the top of `pipeline.ts` (`analyzeBand` is currently imported via `./logic/bands.js`). Ensure the import line includes `analyzeBand` (it already does) and add `rainHint` + the new type imports without duplicating existing ones.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/pipeline.spot.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/pipeline.ts src/pipeline.spot.test.ts
git commit -m "feat: buildSpotConditions (dawn grade + air + rain for a spot)"
```

---

## Task 7: Hashtag helper

**Files:**
- Create: `src/message/tags.ts`
- Test: `src/message/tags.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/message/tags.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { tagLine, appendTags } from './tags.js';

describe('tagLine', () => {
  it('uses a language-specific base tag plus the English spot tag', () => {
    expect(tagLine('ko', 'Lumpini')).toBe('#방콕러닝 #BangkokRunning #Lumpini');
    expect(tagLine('en', 'Lumpini')).toBe('#RunBangkok #BangkokRunning #Lumpini');
    expect(tagLine('th', 'Lumpini')).toBe('#วิ่งกรุงเทพ #BangkokRunning #Lumpini');
  });

  it('omits the spot tag when none is given (evening posts)', () => {
    expect(tagLine('ko')).toBe('#방콕러닝 #BangkokRunning');
  });
});

describe('appendTags', () => {
  it('appends the tag line after a blank line', () => {
    expect(appendTags('hello', 'en', 'Lumpini')).toBe('hello\n\n#RunBangkok #BangkokRunning #Lumpini');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/message/tags.test.ts`
Expected: FAIL — `Cannot find module './tags.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/message/tags.ts`:

```typescript
export type Lang = 'ko' | 'en' | 'th';

const BASE: Record<Lang, string> = {
  ko: '#방콕러닝 #BangkokRunning',
  en: '#RunBangkok #BangkokRunning',
  th: '#วิ่งกรุงเทพ #BangkokRunning',
};

/**
 * Topic-tag line for discovery. Tags are appended in code AFTER translation, so
 * the translator never has to preserve them (avoids the "no Korean left" check
 * tripping on Korean hashtags). The spot tag is an English token shared by all
 * languages.
 */
export function tagLine(lang: Lang, spotTag?: string): string {
  return spotTag ? `${BASE[lang]} #${spotTag}` : BASE[lang];
}

/** Append the tag line to a post body after a blank line. */
export function appendTags(body: string, lang: Lang, spotTag?: string): string {
  return `${body}\n\n${tagLine(lang, spotTag)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/message/tags.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/message/tags.ts src/message/tags.test.ts
git commit -m "feat: per-language hashtag helper for discovery"
```

---

## Task 8: Morning "spot of the day" template

**Files:**
- Create: `src/message/spotTemplate.ts`
- Test: `src/message/spotTemplate.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/message/spotTemplate.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { buildSpotPost } from './spotTemplate.js';
import type { SpotConditions } from '../types.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

const base: SpotConditions = {
  spot: {
    id: 'benjakitti', nameKo: '벤짜낏 포레스트파크', nameEn: 'Benjakitti', nameTh: 'เบญจกิติ',
    area: '아속/클롱토이', blurbKo: '도심 속 숲길과 호수 데크 루프. 그늘이 많아요.',
    lat: 13.72, lon: 100.56, loopKm: 1.9, shade: 2, tag: 'Benjakitti',
  },
  grade: 'GO',
  window: { start: '05:00', end: '07:00', quality: 'best' },
  bestHour: 5,
  wbgt: 26, temp: 26, uvi: 1,
  aqi: 42, station: 'Bangkok – Sathon',
  rainHint: null,
};

describe('buildSpotPost', () => {
  it('renders header, date on line 2, spot, condition and coach line', () => {
    const post = buildSpotPost(base, bkk(5), '오늘은 여기야. 천천히 한 바퀴');
    const lines = post.split('\n');
    expect(lines[0]).toBe('🐱 소이캣의 오늘의 스팟');
    expect(lines[1]).toBe('2026.05.24 (일)');
    expect(post).toContain('📍 벤짜낏 포레스트파크 · 아속/클롱토이');
    expect(post).toContain('🟢 지금 뛰기 좋아요');
    expect(post).toContain('🌡️ 26°C 좋음 · 💨 AQI 42 좋음 · ☀️ 자외선 낮음');
    expect(post).toContain('⏰ 베스트 창: 5–7시');
    expect(post).toContain('오늘은 여기야. 천천히 한 바퀴 — 소이캣');
    expect(post).not.toContain('🌧️');
    expect(post).not.toMatch(/\b(GO|CAUTION|SKIP)\b/);
  });

  it('includes the rain hint line when present', () => {
    const post = buildSpotPost({ ...base, rainHint: '🌧️ 6–7시 소나기 가능 — 우산 챙겨요' }, bkk(5), 'x');
    expect(post).toContain('🌧️ 6–7시 소나기 가능 — 우산 챙겨요');
  });

  it('falls back to the best hour when there is no window', () => {
    const post = buildSpotPost({ ...base, grade: 'CAUTION', window: null, bestHour: 6 }, bkk(5), 'x');
    expect(post).toContain('🟡 뛸 만해요, 컨디션 보며');
    expect(post).toContain('⏰ 베스트 창: 6시쯤');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/message/spotTemplate.test.ts`
Expected: FAIL — `Cannot find module './spotTemplate.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/message/spotTemplate.ts`:

```typescript
import { airLabel, heatLabel, uvLabel } from '../logic/labels.js';
import type { Grade, SpotConditions } from '../types.js';
import { bangkokDateLabel } from '../util/time.js';

const GRADE_EMOJI: Record<Grade, string> = { GO: '🟢', CAUTION: '🟡', SKIP: '🔴' };
const GRADE_TEXT: Record<Grade, string> = {
  GO: '지금 뛰기 좋아요',
  CAUTION: '뛸 만해요, 컨디션 보며',
  SKIP: '오늘은 쉬엄쉬엄',
};

/** When to run: the qualifying window (start–end), or the best single hour. */
function windowText(c: SpotConditions): string {
  if (c.window) {
    const start = Number(c.window.start.slice(0, 2));
    const end = Number(c.window.end.slice(0, 2));
    return `${start}–${end}시`;
  }
  if (c.bestHour !== null) return `${c.bestHour}시쯤`;
  return '정보 없음';
}

/**
 * Build the Korean "spot of the day" post. Line 0 is the static header; line 1
 * is the date (localized in code for the EN/TH replies — translate() overrides
 * the second line). Hashtags are NOT included here; they are appended per
 * language at publish time (see message/tags.ts).
 */
export function buildSpotPost(c: SpotConditions, dtSeconds: number, coachLine: string): string {
  const lines = [
    '🐱 소이캣의 오늘의 스팟',
    bangkokDateLabel(dtSeconds),
    '',
    `📍 ${c.spot.nameKo} · ${c.spot.area}`,
    c.spot.blurbKo,
    '',
    `${GRADE_EMOJI[c.grade]} ${GRADE_TEXT[c.grade]}`,
    `🌡️ ${Math.round(c.temp)}°C ${heatLabel(c.wbgt)} · 💨 AQI ${c.aqi} ${airLabel(c.aqi)} · ☀️ 자외선 ${uvLabel(c.uvi)}`,
    `⏰ 베스트 창: ${windowText(c)}`,
  ];
  if (c.rainHint) lines.push(c.rainHint);
  lines.push('', `${coachLine} — 소이캣`);
  return lines.join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/message/spotTemplate.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/message/spotTemplate.ts src/message/spotTemplate.test.ts
git commit -m "feat: morning spot-of-the-day Korean template"
```

---

## Task 9: Evening rotation post

**Files:**
- Create: `src/message/eveningRotation.ts`
- Test: `src/message/eveningRotation.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/message/eveningRotation.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { buildEveningPost, EVENING_POSTS } from './eveningRotation.js';

const bkk = (h: number) => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

describe('buildEveningPost', () => {
  it('puts the header on line 1 and the date on line 2', () => {
    const post = buildEveningPost(bkk(18));
    const lines = post.split('\n');
    expect(lines[0]).toBe('🐱 소이캣의 저녁 한 컷');
    expect(lines[1]).toBe('2026.05.24 (일)');
  });

  it('rotates content by day and never repeats until the pool is exhausted', () => {
    const today = buildEveningPost(bkk(18)).split('\n').slice(2).join('\n');
    const tomorrow = buildEveningPost(bkk(18) + 86_400).split('\n').slice(2).join('\n');
    expect(today).not.toBe(tomorrow);
  });

  it('every pool entry is non-empty', () => {
    for (const body of EVENING_POSTS) expect(body.trim().length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/message/eveningRotation.test.ts`
Expected: FAIL — `Cannot find module './eveningRotation.js'`.

- [ ] **Step 3: Write the implementation**

Create `src/message/eveningRotation.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/message/eveningRotation.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/message/eveningRotation.ts src/message/eveningRotation.test.ts
git commit -m "feat: light evening rotation posts (poll/haiku/trivia/cafe)"
```

---

## Task 10: Rewire the morning entry (switchover)

**Files:**
- Modify: `src/index.ts` (full rewrite)

- [ ] **Step 1: Rewrite `src/index.ts`**

Replace the entire contents of `src/index.ts` with:

```typescript
import 'dotenv/config';
import { requireEnv } from './config.js';
import { fetchSpotAir } from './data/airQuality.js';
import { fetchWeather } from './data/openMeteo.js';
import { pickCoachLine } from './content/coachLines.js';
import { pickSpot } from './content/spots.js';
import { buildSpotConditions } from './pipeline.js';
import { pickImage } from './message/images.js';
import { buildSpotPost } from './message/spotTemplate.js';
import { appendTags } from './message/tags.js';
import { createClient, translateSafe } from './message/translate.js';
import { publishChain, type PostFn } from './threads/chain.js';
import { publishPost } from './threads/post.js';

/**
 * Morning entry (≈05:00 Bangkok): pick today's spot, fetch its weather + air,
 * build the Korean "spot of the day" post, translate to EN/TH, append per-language
 * hashtags, and publish the connected KO→EN→TH chain with a cat image.
 *
 * Fail-visible: missing data/env aborts before posting. The Korean post is
 * required; each translation/reply is best-effort. Pass --dry-run to print only.
 */
async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const waqiToken = requireEnv('WAQI_TOKEN');
  const anthropicKey = requireEnv('ANTHROPIC_API_KEY');

  const now = Math.floor(Date.now() / 1000);
  const spot = pickSpot(now);

  const [hourly, air] = await Promise.all([
    fetchWeather(spot.lat, spot.lon),
    fetchSpotAir(waqiToken, spot.lat, spot.lon),
  ]);

  const conditions = buildSpotConditions(spot, hourly, air);
  const coach = pickCoachLine(conditions.grade, now);
  const koBody = buildSpotPost(conditions, now, coach);

  const client = createClient(anthropicKey);
  const enBody = await translateSafe(client, koBody, 'English', now);
  const thBody = await translateSafe(client, koBody, 'Thai', now);

  const ko = appendTags(koBody, 'ko', spot.tag);
  const en = enBody ? appendTags(enBody, 'en', spot.tag) : null;
  const th = thBody ? appendTags(thBody, 'th', spot.tag) : null;
  const imageUrl = pickImage(now);

  if (dryRun) {
    console.log(ko);
    console.log(`\n🖼️  image: ${imageUrl}  ·  📡 station: ${air.station}`);
    if (en) console.log(`\n--- English ---\n${en}`);
    if (th) console.log(`\n--- Thai ---\n${th}`);
    console.log('\n[wat-run] dry run — nothing posted.');
    return;
  }

  const token = requireEnv('THREADS_ACCESS_TOKEN');
  const post: PostFn = (text, replyToId, imgUrl) =>
    publishPost(token, text, replyToId, { imageUrl: imgUrl });
  const result = await publishChain({ ko, en, th }, post, undefined, imageUrl);
  console.log('[wat-run] posted:', JSON.stringify(result));
}

main().catch((err: unknown) => {
  console.error('[wat-run] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (the old `data/weather.ts`, `message/koTemplate.ts`, etc. still compile — they're removed in Task 12).

- [ ] **Step 3: Dry-run the morning pipeline live**

Run: `npm run dry`
Expected: prints a "🐱 소이캣의 오늘의 스팟" post with a real spot, AQI, station name, best window, coach line, and EN/TH translations. (Requires `WAQI_TOKEN` + `ANTHROPIC_API_KEY` in `.env`.)

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: morning entry posts spot-of-the-day (Open-Meteo + WAQI per-spot)"
```

---

## Task 11: Rewire the evening entry (switchover)

**Files:**
- Modify: `src/evening.ts` (full rewrite)

- [ ] **Step 1: Rewrite `src/evening.ts`**

Replace the entire contents of `src/evening.ts` with:

```typescript
import 'dotenv/config';
import { requireEnv } from './config.js';
import { buildEveningPost } from './message/eveningRotation.js';
import { pickImage } from './message/images.js';
import { appendTags } from './message/tags.js';
import { createClient, translateSafe } from './message/translate.js';
import { publishChain, type PostFn } from './threads/chain.js';
import { publishPost } from './threads/post.js';

/**
 * Evening entry (≈18:00 Bangkok): a light rotation post (poll / haiku / trivia /
 * run-then-eat) to keep the account alive and varied. Builds the Korean post,
 * translates to EN/TH, appends base hashtags, and publishes the chain with a cat
 * image (offset so it differs from the morning). Needs ANTHROPIC + THREADS.
 */
async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const anthropicKey = requireEnv('ANTHROPIC_API_KEY');

  const now = Math.floor(Date.now() / 1000);
  const koBody = buildEveningPost(now);

  const client = createClient(anthropicKey);
  const enBody = await translateSafe(client, koBody, 'English', now);
  const thBody = await translateSafe(client, koBody, 'Thai', now);

  const ko = appendTags(koBody, 'ko');
  const en = enBody ? appendTags(enBody, 'en') : null;
  const th = thBody ? appendTags(thBody, 'th') : null;
  const imageUrl = pickImage(now, 5); // offset so it differs from the morning image

  if (dryRun) {
    console.log(ko);
    console.log(`\n🖼️  image: ${imageUrl}`);
    if (en) console.log(`\n--- English ---\n${en}`);
    if (th) console.log(`\n--- Thai ---\n${th}`);
    console.log('\n[wat-run evening] dry run — nothing posted.');
    return;
  }

  const token = requireEnv('THREADS_ACCESS_TOKEN');
  const post: PostFn = (text, replyToId, imgUrl) =>
    publishPost(token, text, replyToId, { imageUrl: imgUrl });
  const result = await publishChain({ ko, en, th }, post, undefined, imageUrl);
  console.log('[wat-run evening] posted:', JSON.stringify(result));
}

main().catch((err: unknown) => {
  console.error('[wat-run evening] failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Typecheck + dry-run**

Run: `npm run typecheck && npm run dry:evening`
Expected: typecheck passes; dry-run prints a "🐱 소이캣의 저녁 한 컷" post with EN/TH. (Requires `ANTHROPIC_API_KEY`.)

- [ ] **Step 3: Commit**

```bash
git add src/evening.ts
git commit -m "feat: evening entry posts light rotation content"
```

---

## Task 12: Remove the retired v1 modules

**Files:**
- Delete: `src/data/weather.ts`, `src/data/weather.test.ts`
- Delete: `src/content/workout.ts`, `src/content/workout.test.ts`
- Delete: `src/message/eveningTemplate.ts`, `src/message/eveningTemplate.test.ts`
- Delete: `src/message/eveningHooks.ts`, `src/message/eveningHooks.test.ts`
- Delete: `src/message/recommend.ts`, `src/message/recommend.test.ts`
- Delete: `src/message/hooks.ts`, `src/message/hooks.test.ts`
- Delete: `src/message/koTemplate.ts`, `src/message/koTemplate.test.ts`
- Modify: `src/data/airQuality.ts` (remove old `fetchAirQuality`), `src/data/airQuality.test.ts` (remove its tests)
- Modify: `src/pipeline.ts` (remove old `buildConditions`/`buildPost`), delete `src/pipeline.test.ts`
- Modify: `src/logic/bands.ts` (remove `decideOutcome`), `src/logic/bands.test.ts` (remove its tests)
- Modify: `src/types.ts` (remove `AirQuality`, `Weather`, `Conditions`, `Outcome`)
- Modify: `src/config.ts` (remove unused `LOCATION`)

- [ ] **Step 1: Delete the retired files**

```bash
git rm src/data/weather.ts src/data/weather.test.ts \
  src/content/workout.ts src/content/workout.test.ts \
  src/message/eveningTemplate.ts src/message/eveningTemplate.test.ts \
  src/message/eveningHooks.ts src/message/eveningHooks.test.ts \
  src/message/recommend.ts src/message/recommend.test.ts \
  src/message/hooks.ts src/message/hooks.test.ts \
  src/message/koTemplate.ts src/message/koTemplate.test.ts \
  src/pipeline.test.ts
```

- [ ] **Step 2: Trim `src/data/airQuality.ts`**

Remove the old `fetchAirQuality` function and the now-unused imports (`LOCATION`, `bangkokDateKey`, the `WaqiResponse` interface, and `AirQuality` from the type import). The file should contain only: the `getJson` import, the `SpotAir` type import, the `WaqiSpotResponse` interface, and `fetchSpotAir`. Final file:

```typescript
import type { SpotAir } from '../types.js';
import { getJson } from '../util/http.js';

interface WaqiSpotResponse {
  status?: string;
  data?: {
    aqi?: number;
    iaqi?: { pm25?: { v?: number } };
    city?: { name?: string };
  };
}

/**
 * Fetch the air reading at a spot from the WAQI station nearest its coordinates
 * (the geo feed auto-selects the closest station). Prefers the PM2.5 sub-index
 * (what runners care about), falling back to the overall AQI.
 */
export async function fetchSpotAir(token: string, lat: number, lon: number): Promise<SpotAir> {
  const url = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${encodeURIComponent(token)}`;
  const body = (await getJson(url)) as WaqiSpotResponse;

  if (body.status !== 'ok') {
    throw new Error(`WAQI returned status "${body.status ?? 'unknown'}"`);
  }
  const pm25 = body.data?.iaqi?.pm25?.v;
  const value = typeof pm25 === 'number' ? pm25 : body.data?.aqi;
  if (typeof value !== 'number') {
    throw new Error('WAQI feed missing AQI reading');
  }
  return { aqi: Math.round(value), station: body.data?.city?.name ?? 'Unknown station' };
}
```

In `src/data/airQuality.test.ts`, remove the `import { fetchAirQuality } from './airQuality.js';` line and the entire `describe('fetchAirQuality', ...)` block, keeping only the `fetchSpotAir` import, the `mockFetch`/`afterEach` helpers, and the `describe('fetchSpotAir', ...)` block.

- [ ] **Step 3: Trim `src/pipeline.ts`**

Remove the old `buildConditions` and `buildPost` functions and their now-unused imports (`pickHook`, `buildKoreanPost`, `pickRecommendation`, `decideOutcome`, and the `AirQuality`/`Weather`/`Conditions` types). Final file:

```typescript
import { GOLDEN } from './config.js';
import { analyzeBand } from './logic/bands.js';
import { rainHint } from './logic/rain.js';
import type { HourlyWeather, Spot, SpotAir, SpotConditions } from './types.js';

/**
 * Combine a spot, its hourly weather, and its air reading into the data a
 * "spot of the day" post needs: grade + best window for the dawn band (gated by
 * per-hour heat and the spot's air), conditions at the best hour, and a rain hint.
 */
export function buildSpotConditions(
  spot: Spot,
  hourly: HourlyWeather[],
  air: SpotAir,
): SpotConditions {
  const band = analyzeBand(hourly, GOLDEN.bands.dawn, air.aqi);
  return {
    spot,
    grade: band.grade,
    window: band.window,
    bestHour: band.coolestHour,
    wbgt: band.wbgt,
    temp: band.temp,
    uvi: band.uvi,
    aqi: air.aqi,
    station: air.station,
    rainHint: rainHint(hourly, GOLDEN.bands.dawn),
  };
}
```

- [ ] **Step 4: Trim `src/logic/bands.ts`**

Remove the `decideOutcome` function, the `SEVERITY` constant, and `Outcome` from the type import (change `import type { BandReport, Grade, HourlyWeather, Outcome } from '../types.js';` to `import type { BandReport, Grade, HourlyWeather } from '../types.js';`). Keep `analyzeBand`, `todayBandHours`, and `UNAVAILABLE`.

In `src/logic/bands.test.ts`, remove any `decideOutcome` import and its `describe`/`it` blocks; keep the `analyzeBand` tests.

- [ ] **Step 5: Trim `src/types.ts`**

Remove the `AirQuality`, `Weather`, `Conditions`, and `Outcome` interfaces/types. Keep `Grade`, `HourlyWeather`, `WindowQuality`, `GoldenWindow`, `BandReport`, `Spot`, `SpotAir`, `SpotConditions`. (`BandReport` no longer references `Outcome`, so it is unaffected.)

- [ ] **Step 6: Trim `src/config.ts`**

Remove the `LOCATION` constant (no longer imported anywhere — spots carry their own coordinates). Keep `TIMEZONE`, `TRANSLATION_MODEL`, `GOLDEN`, and `requireEnv`.

- [ ] **Step 7: Run the full suite + typecheck + build**

Run: `npm test && npm run typecheck && npm run build`
Expected: all tests PASS, no type errors, clean build. If typecheck reports an unused import or a dangling reference to a deleted symbol, fix it in the named file (these are the only expected breakages).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: remove retired v1 weather/workout/template modules"
```

---

## Task 13: Update env, CI, and docs

**Files:**
- Modify: `.env.example`
- Modify: `.github/workflows/morning-post.yml`
- Modify: `README.md`

- [ ] **Step 1: Drop `OPENWEATHER_API_KEY` from `.env.example`**

Open `.env.example` and delete the `OPENWEATHER_API_KEY` line (and any comment describing it). Keep `WAQI_TOKEN`, `ANTHROPIC_API_KEY`, `THREADS_ACCESS_TOKEN`.

- [ ] **Step 2: Drop the OpenWeather secret from the morning workflow**

In `.github/workflows/morning-post.yml`, remove the `OPENWEATHER_API_KEY: ${{ secrets.OPENWEATHER_API_KEY }}` line from the job's `env:` block. The morning job now needs only `WAQI_TOKEN`, `ANTHROPIC_API_KEY`, and `THREADS_ACCESS_TOKEN`. (Leave the cron schedule unchanged.)

- [ ] **Step 3: Rewrite the relevant README sections**

Update `README.md` to describe v2:
- Title/intro: the bot is now "소이캣의 오늘의 스팟" — a cat coach recommending a daily Bangkok running spot; morning = spot of the day + that spot's accurate conditions, evening = light rotation (poll/haiku/trivia/cafe). The workout plan is retired.
- "What it posts": replace the morning/evening mockups with the new ones (spot-of-the-day morning; rotation evening). Use the mockups from spec §7.
- "How the morning post decides": data now comes from **Open-Meteo** (weather/UV/rain, no key) and **WAQI per spot** (PM2.5 AQI at the nearest station to the spot's coordinates). Remove the OpenWeather/`OPENWEATHER_API_KEY` rows from the env table and any OpenWeather mentions.
- "Project layout": reflect new files (`content/spots.ts`, `content/coachLines.ts`, `logic/rain.ts`, `data/openMeteo.ts`, `message/spotTemplate.ts`, `message/tags.ts`, `message/eveningRotation.ts`) and removed ones (`content/workout.ts`, `data/weather.ts`, `message/koTemplate.ts`/`hooks.ts`/`recommend.ts`/`evening*.ts`).
- Update the test count line to the actual `npm test` total.

- [ ] **Step 4: Verify build + tests still pass after doc/env changes**

Run: `npm test && npm run typecheck`
Expected: PASS (no code changed, but confirm nothing referenced the removed env var at runtime in tests).

- [ ] **Step 5: Commit**

```bash
git add .env.example .github/workflows/morning-post.yml README.md
git commit -m "docs: README/env/CI for v2 (Soi Cat spot-of-the-day, Open-Meteo)"
```

---

## Task 14: Final verification

- [ ] **Step 1: Full green check**

Run: `npm test && npm run typecheck && npm run build`
Expected: all tests PASS, no type errors, clean `dist/`.

- [ ] **Step 2: Live dry-runs (needs `.env`)**

Run: `npm run dry` then `npm run dry:evening`
Expected: morning prints a real spot-of-the-day post (spot, AQI + station, window, coach, EN/TH, hashtags); evening prints a rotation post (EN/TH, hashtags). Eyeball that EN/TH contain no leftover Korean and that hashtags are present per language.

- [ ] **Step 3: Confirm clean tree**

Run: `git status`
Expected: clean (everything committed).

---

## Self-Review Notes (author)

- **Spec coverage:** §3 structure → Tasks 8/9/10/11; §4 spots → Task 3; §5 accuracy (Open-Meteo + WAQI per-spot, rain) → Tasks 1/2/5/6; §6 language+tags → Tasks 7/10/11; §7 mockups → Tasks 8/9 + README; §8 architecture (reuse/replace/new/retire) → Tasks 1–12; workout retirement → Task 12. Map-thread automation, metrics, per-spot art are spec §10 out-of-scope (not planned, by design).
- **No placeholders:** every code step has full code; dataset is real (12 spots); cleanup lists exact files/symbols.
- **Type/name consistency:** `fetchWeather(lat,lon)→HourlyWeather[]`, `fetchSpotAir(token,lat,lon)→SpotAir`, `pickSpot`, `pickCoachLine(grade,dt)`, `rainHint(hourly,band)`, `buildSpotConditions(spot,hourly,air)→SpotConditions`, `buildSpotPost(c,dt,coach)`, `tagLine/appendTags(...,'ko'|'en'|'th',spotTag?)`, `buildEveningPost(dt)` — used identically across tasks and entries.
- **Green-between-tasks:** new modules added alongside old (precipProb optional; old `fetchAirQuality`/`buildConditions` kept) until switchover (10–11), then deleted (12).
```
