# Wat Run? 🐱🏃 — 소이캣의 방콕 러닝

A daily Bangkok running bot for Threads, narrated by **소이캣 (Soi Cat)** — a warm,
encouraging Bangkok street-cat coach. It posts in **Korean, English, and Thai**,
twice a day, each with a cute cat illustration:

- **05:00 Bangkok — 오늘의 스팟:** Soi Cat picks one real Bangkok running spot for
  the day and reports *that spot's* accurate conditions (heat / air / UV), the best
  window to run, and a warm one-line coach note.
- **18:00 Bangkok — 저녁 한 컷:** a light rotation post (poll / haiku / running
  trivia / run-then-eat tip) to keep the feed alive and varied.

> Status: **live.** Two GitHub Actions cron jobs run daily. Account:
> [@coffeepacer](https://www.threads.com/@coffeepacer).

Each post is one connected thread: a **Korean main post (with a cat image)**, then
an **English** reply and a **Thai** reply. Dates and the mascot name localize per
language (Thai uses the Buddhist year); discovery hashtags are appended per language.

## What it posts

**Morning (05:00) — 오늘의 스팟**
```
🐱 소이캣의 오늘의 스팟
2026.05.24 (일)

📍 벤짜낏 포레스트파크 · 아속/클롱토이
도심 속 숲길과 호수 데크 루프. 그늘이 많아 더위에 강해요.

🟢 지금 뛰기 좋아요
🌡️ 26°C 좋음 · 💨 AQI 42 좋음 · ☀️ 자외선 낮음
⏰ 베스트 창: 5–7시

오늘은 여기야. 천천히 한 바퀴, 무리하지 말고 — 소이캣

#방콕러닝 #BangkokRunning #Benjakitti
```

**Evening (18:00) — 저녁 한 컷**
```
🐱 소이캣의 저녁 한 컷
2026.05.24 (일)

내일은 어디서 뛸래?
🌅 룸피니 / 🌆 강변 / 🏞️ 라마9 공원
댓글로 알려줘 👇 내일 아침 소이캣이 컨디션 봐줄게.

#방콕러닝 #BangkokRunning
```

## How the morning post decides

Each day rotates to one spot from a curated list of real Bangkok parks/routes
(`content/spots.ts`). For that spot it grades the **dawn band (04–09)** using the
day's **hourly** forecast:

- **Heat:** WBGT (Australian BoM approximation from temperature + humidity), tuned
  for acclimatised Bangkok runners — 좋음 `<30`, 주의 `<32.5`, 위험 `<35`, else 매우 위험.
- **Air (PM2.5):** the US AQI from the **WAQI station nearest the spot's
  coordinates** (the scale aqicn/IQAir apps show), gated at ≤50 (best) / ≤100 (ok).
  The station name is shown in dry-run output for transparency.
- **UV & rain:** the UV index at the run time, plus a 🌧️ hint when dawn
  precipitation probability is high.
- The verdict is 🟢/🟡/🔴; the spot, coach line, and evening content **rotate by
  day** so nothing repeats until the pool is exhausted.

### Data sources
- **Weather / UV / rain:** [Open-Meteo](https://open-meteo.com) — free, no API key.
- **Air (PM2.5):** [WAQI/aqicn](https://aqicn.org) geo feed, queried per spot.

> Why these? OpenWeather's global model badly underestimated Bangkok PM2.5, and the
> official Air4Thai endpoint serves an expired TLS certificate — so weather moved to
> Open-Meteo (also drops the card-required key) and air uses WAQI per spot.

## Setup

```bash
npm install
cp .env.example .env   # then fill in tokens
```

| Variable | Source | Used for |
|----------|--------|----------|
| `WAQI_TOKEN` | https://aqicn.org/data-platform/token (free) | per-spot PM2.5 AQI |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com | EN/TH translation (`claude-haiku-4-5`) |
| `THREADS_ACCESS_TOKEN` | Meta for Developers (long-lived, 60-day) | posting |

Weather needs **no key** (Open-Meteo). The evening post needs only
`ANTHROPIC_API_KEY` + `THREADS_ACCESS_TOKEN`. Local runs load `.env` automatically
(via `dotenv`); GitHub Actions uses repo secrets.

## Scripts

```bash
npm test                  # vitest suite
npm run typecheck         # tsc --noEmit
npm run build             # compile to dist/
npm start                 # morning post + publish (WAQI + ANTHROPIC + THREADS)
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

- `morning-post.yml` — cron `0 21 * * *` (Bangkok 05:00), today's spot.
- `evening-post.yml` — cron `0 11 * * *` (Bangkok 18:00), light rotation post.
- `ci.yml` — typecheck + tests + build on every push/PR.

All secrets must be set in the repo (Settings → Secrets and variables → Actions).

## Project layout

```
src/
  config.ts            # constants (thresholds) + env validation
  types.ts             # domain model (Spot, SpotAir, SpotConditions, …)
  pipeline.ts          # spot + weather + air -> SpotConditions
  index.ts             # morning entry (pick spot -> fetch -> translate -> publish)
  evening.ts           # evening entry (light rotation)
  content/             # spots (dataset), coachLines (Soi Cat notes)
  data/                # openMeteo (weather/UV/rain), airQuality (WAQI per-spot)
  logic/               # wbgt, labels, goldenWindow, bands, rain
  message/             # spotTemplate, eveningRotation, tags, translate, validate, images
  threads/             # post (TEXT/IMAGE), chain (KO->EN->TH connected thread)
  util/                # time (Asia/Bangkok, date labels, day rotation), http
images/                # 10 daily cat illustrations (JPEG)
scripts/               # verifyTranslation, verifyThreads (live checks)
.github/workflows/     # morning-post.yml, evening-post.yml, ci.yml
docs/superpowers/      # design spec + implementation plan for v2
```

## Notes

- **Korean-first, no mixed English.** The verdict is 🟢/🟡/🔴 + Korean; the
  traffic-light emoji carries it across all three languages.
- **소이캣 = Soi Cat / ซอยแคท.** The mascot name is pinned in the translation prompt
  so it is never re-translated to a cat breed.
- **Dates are computed in code** (KO/EN/TH, incl. Thai Buddhist year) — LLMs are
  unreliable at weekday/Buddhist-year conversion, so the model never sets them.
- **Hashtags are appended in code** after translation (per language), so the
  translator never has to preserve Korean tags.
- **Translations are validated** — length, preserved emojis/numbers, and a check
  that no Korean is left untranslated; a failing reply is skipped, not posted broken.
- **Fail-visible.** Missing data/keys aborts before posting; the Korean post is
  required and each translation/reply is best-effort.
```
