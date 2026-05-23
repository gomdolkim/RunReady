# Wat Run? 🐱🏃

A daily Bangkok running bot for the **김치팍치** runner community. It posts to
Threads in **Korean, English, and Thai**, twice a day, each with a different cute
cat illustration:

- **04:00 Bangkok** — today's conditions: *when to run* (dawn vs evening), the
  heat/UV/air at those times, and a recommendation.
- **18:00 Bangkok** — **tomorrow's** workout, so runners can plan ahead.

> Status: **live.** Two GitHub Actions cron jobs run daily. Account:
> [@coffeepacer](https://www.threads.com/@coffeepacer).

Each post is one connected thread: a **Korean main post (with a cat image)**, then
an **English** reply and a **Thai** reply. Dates, labels and times localize per
language (Thai uses the Buddhist year).

## What it posts

**Morning (04:00) — conditions**
```
방콕, 오늘은 어느 시간에 뛸까? 🌅🌆         ← rotating hook
2026.05.24 (일)

😷 미세먼지: 보통~매우 나쁨 (AQI 68~152)     ← today's AQI range (WAQI/aqicn)

🌅 새벽 🟢 5–7시 · 더위 좋음 26°C · 자외선 낮음
🌆 저녁 🔴 19시쯤 · 더위 위험 33°C · 자외선 보통

오늘은 새벽이 베스트! 시원할 때 달려요 🌅   ← rotating recommendation
```

**Evening (18:00) — tomorrow's workout**
```
내일은 어떤 운동? 💪                        ← rotating hook
2026.05.24 (일)

🏃 내일 운동: 인터벌
400m × 5 (사이 200m 조깅 회복)

🌡️ 한낮은 피하고 새벽·저녁에 · 수분 충분히 💧
💪 무리는 금물, 컨디션 따라 조절해요         ← rotating coach note
```

## How the morning post decides

Nobody runs in Bangkok's midday heat, so it compares the two times people
actually run, using the day's **hourly** forecast at **Benjakitti Park**:

- **🌅 새벽 dawn (04–09)** and **🌆 저녁 evening (17–20)** are each graded
  🟢/🟡/🔴 from the heat and air **at that time**.
- **Heat:** WBGT (Australian BoM approximation from temperature + humidity), tuned
  for acclimatised Bangkok runners — 좋음 `<30`, 주의 `<32.5`, 위험 `<35`, else 매우 위험.
- **Air (PM2.5):** the day's **US AQI range** from WAQI/aqicn (the scale the
  aqicn/IQAir apps show), gated at ≤50 (best) / ≤100 (acceptable).
- **UV:** the UV index at the run time (low at dawn/evening — part of why those
  times are better).
- The bot recommends **dawn / evening / both / indoor**; the hook + recommendation
  **rotate by day** so it never repeats.

> Why not OpenWeather for air? Its global model badly underestimated Bangkok
> PM2.5 (≈1 µg/m³ vs the aqicn station's AQI ~107), so air comes from WAQI.

## The evening workout

A simple **weekly training rhythm** (weekday → type) with the specific session
rotating by week: Mon/Fri rest, Tue intervals, Wed easy, Thu tempo, Sat long run,
Sun recovery. Intensities are moderate and every post reminds runners to adjust
to their condition and run at dawn/evening.

## Setup

```bash
npm install
cp .env.example .env   # then fill in tokens
```

| Variable | Source | Used for |
|----------|--------|----------|
| `WAQI_TOKEN` | https://aqicn.org/data-platform/token (free) | PM2.5 AQI (daily forecast) |
| `OPENWEATHER_API_KEY` | One Call API 3.0 (free tier, card required) | hourly weather (morning only) |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com | EN/TH translation (`claude-haiku-4-5`) |
| `THREADS_ACCESS_TOKEN` | Meta for Developers (long-lived, 60-day) | posting |

The evening post needs only `ANTHROPIC_API_KEY` + `THREADS_ACCESS_TOKEN`. Local
runs load `.env` automatically (via `dotenv`); GitHub Actions uses repo secrets.

## Scripts

```bash
npm test                  # vitest suite (96 tests)
npm run typecheck         # tsc --noEmit
npm run build             # compile to dist/
npm start                 # morning post + publish (needs all 4 keys)
npm run start:evening     # evening post + publish (ANTHROPIC + THREADS)
npm run dry               # morning pipeline, print only — no publishing
npm run dry:evening       # evening pipeline, print only — no publishing
npm run verify:translate  # live KO->EN/TH check (needs ANTHROPIC_API_KEY)
npm run verify:threads    # publish a sample chain to Threads
```

## Daily images

`images/1.jpg … images/10.jpg` are 10 cute cat-running illustrations (optimized
~1600×872 JPEG), served from the repo via raw GitHub URLs. One is chosen per day
(`message/images.ts`, day-of-year rotation); the evening post uses an offset so it
differs from the morning. To change the set, drop new JPEGs in `images/` and
update the count in `images.ts`.

## Automation

Two daily workflows (manual **Run workflow** defaults to a safe **dry run**):

- `morning-post.yml` — cron `0 21 * * *` (Bangkok 04:00), today's conditions.
- `evening-post.yml` — cron `0 11 * * *` (Bangkok 18:00), tomorrow's workout.
- `ci.yml` — typecheck + tests + build on every push/PR.

All secrets must be set in the repo (Settings → Secrets and variables → Actions).

## Project layout

```
src/
  config.ts            # constants (location, thresholds) + env validation
  types.ts             # domain model
  pipeline.ts          # data -> conditions -> Korean morning post
  index.ts             # morning entry (fetch -> translate -> publish)
  evening.ts           # evening entry (tomorrow's workout)
  content/             # workout (weekday plan + sessions + coach notes)
  data/                # airQuality (WAQI), weather (OpenWeather One Call)
  logic/               # wbgt, labels, goldenWindow, bands (dawn/evening + outcome)
  message/             # hooks, recommend, koTemplate, eveningHooks, eveningTemplate,
                       #   translate, validate, images
  threads/             # post (TEXT/IMAGE), chain (KO->EN->TH connected thread)
  util/                # time (Asia/Bangkok, date labels, weekday, day rotation), http
images/                # 10 daily cat illustrations (JPEG)
scripts/               # verifyTranslation, verifyThreads (live checks)
.github/workflows/     # morning-post.yml, evening-post.yml, ci.yml
```

## Notes

- **Korean-first, no mixed English.** The verdict is 🟢/🟡/🔴 + Korean; the
  traffic-light emoji carries it across all three languages.
- **Dates are computed in code** (KO/EN/TH, incl. Thai Buddhist year) — LLMs are
  unreliable at weekday/Buddhist-year conversion, so the model never sets them.
- **Translations are validated** — length, preserved emojis/numbers, and a check
  that no Korean is left untranslated; a failing reply is skipped, not posted broken.
- **Fail-visible.** Missing data/keys aborts before posting; the Korean post is
  required and each translation/reply is best-effort.
```
