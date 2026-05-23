# Wat Run? 🐱🏃

A daily Bangkok running-conditions bot for the **김치팍치** runner community. Every
day at **04:00 Bangkok time** it posts to Threads — in **Korean, English, and
Thai** — telling runners **when to run today** (dawn vs evening), the conditions
at those times, and a different cute cat illustration each day.

> Status: **live.** GitHub Actions runs it daily (cron `0 21 * * *` UTC = Bangkok
> 04:00). Account: [@coffeepacer](https://www.threads.com/@coffeepacer).

## What it posts

One connected thread per day: a **Korean main post (with a cat image)**, then an
**English** reply and a **Thai** reply.

```
방콕, 오늘은 어느 시간에 뛸까? 🌅🌆         ← rotating hook (40 variants)
2026.05.24 (일)

😷 미세먼지: 보통~매우 나쁨 (AQI 68~152)     ← today's AQI range (WAQI/aqicn)

🌅 새벽 🟢 5–7시 · 더위 좋음 26°C · 자외선 낮음
🌆 저녁 🔴 19시쯤 · 더위 위험 33°C · 자외선 보통

오늘은 새벽이 베스트! 시원할 때 달려요 🌅   ← rotating recommendation
```
(English/Thai replies mirror this; dates, labels and times localize per language —
Thai uses the Buddhist year.)

## How it decides

Nobody runs in Bangkok's midday heat, so the post compares the two times people
actually run, using the day's **hourly** weather forecast at **Benjakitti Park**:

- **🌅 새벽 dawn (04–09)** and **🌆 저녁 evening (17–20)** are each graded
  🟢/🟡/🔴 from the heat and air **at that time**.
- **Heat:** WBGT (Australian BoM approximation from temperature + humidity), tuned
  for acclimatised Bangkok runners — 좋음 `<30`, 주의 `<32.5`, 위험 `<35`, else 매우 위험.
- **Air (PM2.5):** the day's **US AQI range** from WAQI/aqicn (the same scale the
  aqicn/IQAir apps show), gated at ≤50 (best) / ≤100 (acceptable). Shown as a
  range, e.g. `보통~매우 나쁨 (AQI 68~152)`.
- **UV:** the UV index at the run time (WHO bands) — low at dawn/evening, which is
  part of why those times are better.
- A band is **🟢** with a best window, **🟡** with an acceptable one, **🔴** when
  heat or air rules it out. The bot then recommends **dawn / evening / both /
  indoor** — and the hook + recommendation **rotate by day** so it never repeats.

> Why not OpenWeather for air? Its global model badly underestimated Bangkok
> PM2.5 (≈1 µg/m³ vs the aqicn station's AQI ~107), so air quality comes from
> WAQI's nearby ground station instead.

## Setup

```bash
npm install
cp .env.example .env   # then fill in tokens
```

| Variable | Source | Used for |
|----------|--------|----------|
| `WAQI_TOKEN` | https://aqicn.org/data-platform/token (free) | PM2.5 AQI (daily forecast) |
| `OPENWEATHER_API_KEY` | One Call API 3.0 (free tier, card required) | hourly weather |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com | EN/TH translation (`claude-haiku-4-5`) |
| `THREADS_ACCESS_TOKEN` | Meta for Developers (long-lived, 60-day) | posting |

Local runs load `.env` automatically (via `dotenv`); GitHub Actions uses
repository secrets.

## Scripts

```bash
npm test                  # vitest suite (85 tests)
npm run coverage          # tests with coverage
npm run typecheck         # tsc --noEmit
npm run build             # compile to dist/
npm start                 # run + publish (needs all 4 keys)
npm run dry               # full pipeline, print only — no publishing
npm run verify:translate  # live KO->EN/TH check (needs ANTHROPIC_API_KEY)
npm run verify:threads    # publish a sample chain to Threads
```

## Daily images

`images/1.jpg … images/10.jpg` are 10 cute cat-running illustrations (optimized
to ~1600×872 JPEG). One is chosen per day (`message/images.ts`, day-of-year
rotation) and attached to the Korean main post; they're served from the repo via
raw GitHub URLs. To change the set, drop new JPEGs in `images/` and update the
count in `images.ts`.

## Automation

`.github/workflows/morning-post.yml` posts daily (cron `0 21 * * *` = Bangkok
04:00) and supports a manual **Run workflow** that defaults to a **dry run**
(prints, no publishing — untick to publish). `ci.yml` runs typecheck + tests +
build on every push/PR. All four secrets must be set in the repo.

## Project layout

```
src/
  config.ts            # constants (location, thresholds) + env validation
  types.ts             # domain model
  pipeline.ts          # data -> conditions -> Korean post
  index.ts             # entry point (fetch -> translate -> publish)
  data/                # airQuality (WAQI), weather (OpenWeather One Call)
  logic/               # wbgt, labels, goldenWindow, bands (dawn/evening + outcome)
  message/             # hooks, recommend, koTemplate, translate, validate, images
  threads/             # post (TEXT/IMAGE), chain (KO->EN->TH connected thread)
  util/                # time (Asia/Bangkok, date labels, day rotation), http
images/                # 10 daily cat illustrations (JPEG)
scripts/               # verifyTranslation, verifyThreads (live checks)
.github/workflows/     # morning-post.yml, ci.yml
```

## Notes

- **Korean-first, no mixed English.** The verdict is 🟢/🟡/🔴 + Korean; the
  traffic-light emoji carries it across all three languages.
- **Dates are computed in code** (KO/EN/TH, incl. Thai Buddhist year) — LLMs are
  unreliable at weekday/Buddhist-year conversion, so the model never sets them.
- **Fail-visible.** Missing data/keys aborts before posting; the Korean post is
  required and each translation/reply is best-effort.
