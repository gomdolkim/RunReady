# Wat Run? 🐱 — 소이캣의 방콕

A daily Bangkok bot for Threads, narrated by **소이캣 (Soi Cat)** — a warm,
encouraging Bangkok street cat. It posts in **Korean**.

**Current mode — 오늘의 방콕 (place of the day).** Once a day in the morning,
Soi Cat introduces **one real Bangkok place worth visiting** (temple, palace,
museum, park, market, landmark or viewpoint — **no restaurants**), with *what you
can see there* and *how to get there*. It walks through a curated, verified list
of **50 places**, one per day in order, cycling back to the start after 50 days.

> Status: **live, morning only, Korean only.** One GitHub Actions cron job runs
> daily. Account: [@coffeepacer](https://www.threads.com/@coffeepacer).

Each post is a single **Korean text post** — no English/Thai replies, no image.
The date is computed in code; discovery hashtags are appended.

> The afternoon/evening post and the running-conditions ("오늘의 스팟") morning post
> are **paused** — their code stays in the repo (dormant) so they can be re-enabled
> later, but neither is scheduled. See [Re-enabling running](#re-enabling-running).

## What it posts

**Morning — 오늘의 방콕**
```
🐱 소이캣의 오늘의 방콕
2026.05.24 (일)

📍 왓 아룬(새벽사원) · 톤부리 강변
강 건너에서 빛나는 도자기 탑. 방콕을 상징하는 실루엣이에요.

👀 볼거리: 도자기 조각으로 뒤덮인 거대한 중앙 쁘랑, 올라가서 보는 강 전망과 일몰
🚇 가는 법: 따띠엔 선착장에서 크로스리버 페리로 강 건너 바로

천천히 둘러보고 와요. 소이캣이 응원할게요 🐾

#방콕여행 #방콕가볼만한곳 #WatArun
```

## How the morning post works

Each day rotates to one place from a curated list of 50 real Bangkok attractions
(`content/places.ts`), in array order — no repeats until all 50 are used. For the
day's place it builds the Korean post (a hook, a one-line vibe, a **볼거리** "what
you can see" line and a **가는 법** transit-first "how to get there" line, plus a
rotating Soi Cat closing) and publishes it. **Korean only** — no EN/TH translation
or replies.

There is **no weather/air lookup and no translation** in this mode — the morning
post needs neither a WAQI token nor an Anthropic key, only `THREADS_ACCESS_TOKEN`.

The 50 places were curated and then **fact-checked** (open status, Thai name,
nearest BTS/MRT station or pier, coordinates, and that none is a restaurant). See
the dataset header in `content/places.ts`.

## Setup

```bash
npm install
cp .env.example .env   # then fill in tokens
```

| Variable | Source | Used for |
|----------|--------|----------|
| `THREADS_ACCESS_TOKEN` | Meta for Developers (long-lived, 60-day) | posting |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com | EN/TH translation — **only** the dormant running/evening posts + `verify:translate` |
| `WAQI_TOKEN` | https://aqicn.org/data-platform/token (free) | per-spot PM2.5 AQI — **only** the dormant running post |

The active morning place post needs only `THREADS_ACCESS_TOKEN` (Korean only, no
translation). Local runs load `.env` automatically (via `dotenv`); GitHub Actions
uses repo secrets.

## Scripts

```bash
npm test                  # vitest suite
npm run typecheck         # tsc --noEmit
npm run build             # compile to dist/
npm start                 # morning place post + publish, Korean only (THREADS only)
npm run dry               # morning place post, print only — no publishing
npm run start:run         # (dormant) running "오늘의 스팟" post — WAQI + ANTHROPIC + THREADS
npm run dry:run           # (dormant) running post, print only
npm run start:evening     # (dormant) evening rotation post — ANTHROPIC + THREADS
npm run dry:evening       # (dormant) evening post, print only
npm run verify:translate  # live KO->EN/TH check (needs ANTHROPIC_API_KEY)
```

## Daily images

The active morning place post is **text only — no image**. The `images/1.jpg …
images/10.jpg` cat illustrations and `message/images.ts` remain for the dormant
running/evening posts.

## Automation

One daily workflow (manual **Run workflow** defaults to a safe **dry run**):

- `morning-post.yml` — cron `0 22 * * *` (Bangkok 05:00), today's place of the day.
- `evening-post.yml` — **disabled** (no schedule; manual `workflow_dispatch` only).
- `ci.yml` — typecheck + tests + build on every push/PR.

All secrets must be set in the repo (Settings → Secrets and variables → Actions).

## Re-enabling running

The running bot is paused, not deleted:

- **Running morning post** lives in `src/index.ts` (run with `npm run start:run`).
  To make it the scheduled morning post again, point `morning-post.yml` back to
  `npm run start:run` (and re-add the `WAQI_TOKEN` env) and set `"start": ...` if
  desired.
- **Evening rotation** lives in `src/evening.ts`. Re-add a `schedule:` block to
  `evening-post.yml` to bring it back.

## Project layout

```
src/
  config.ts            # constants (thresholds) + env validation
  types.ts             # domain model (Place, Spot, SpotConditions, …)
  places.ts            # ACTIVE morning entry (pick place -> translate -> publish)
  index.ts             # dormant running entry ("오늘의 스팟")
  evening.ts           # dormant evening entry (light rotation)
  pipeline.ts          # (running) spot + weather + air -> SpotConditions
  content/             # places (50-place dataset), spots, coachLines
  data/                # openMeteo (weather/UV/rain), airQuality (WAQI per-spot)
  logic/               # wbgt, labels, goldenWindow, bands, rain (running)
  message/             # placeTemplate, spotTemplate, eveningRotation, tags, translate, validate, images
  threads/             # post (TEXT/IMAGE), chain (KO->EN->TH connected thread)
  util/                # time (Asia/Bangkok, date labels, day rotation), http
images/                # 10 daily cat illustrations (JPEG)
scripts/               # verifyTranslation, verifyThreads (live checks)
.github/workflows/     # morning-post.yml, evening-post.yml (disabled), ci.yml
docs/superpowers/      # design spec + implementation plan for v2
```

## Notes

- **Korean-first.** Posts are written in plain, friendly Korean; EN/TH are faithful
  translations with localized dates and pinned mascot name.
- **소이캣 = Soi Cat / ซอยแคท.** The mascot name is pinned in the translation prompt
  so it is never re-translated to a cat breed.
- **Dates are computed in code** (KO/EN/TH, incl. Thai Buddhist year) — LLMs are
  unreliable at weekday/Buddhist-year conversion, so the model never sets them.
- **Hashtags are appended in code** after translation (per language), so the
  translator never has to preserve Korean tags.
- **Translations are validated** — length, preserved emojis, line-break structure,
  and a check that no Korean is left untranslated. The place validator skips the
  metric-number check (place posts have no metrics, and numbers legitimately change
  form across languages, e.g. "라마 8세" → "Rama VIII"). A failing reply is skipped,
  not posted broken.
- **Fail-visible.** Missing keys abort before posting; the Korean post is required
  and each translation/reply is best-effort.
```
