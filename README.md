# Wat Run? 🏃

Daily Bangkok running-conditions bot for the **김치팍치** runner community. Every
day at **04:00 Bangkok time** it posts a traffic-light verdict (🟢 GO / 🟡 CAUTION /
🔴 SKIP) to Threads in **Korean, English, and Thai**, based on PM2.5 and heat
stress (WBGT).

> Status: **Phase 4 complete (build)** — full pipeline runs end-to-end (data →
> Korean post → EN/TH translation → 3-post Threads chain) and GitHub Actions
> workflows are in place. The daily cron is left **disabled** until the four
> repository secrets are set (see Automation below).

## How it decides

| Metric | 🟢 GO | 🟡 CAUTION | 🔴 SKIP |
|--------|-------|------------|---------|
| PM2.5 (μg/m³) | < 35 | 35–55 | > 55 |
| WBGT (°C) | < 30 | 30–32.5 | > 32.5 |

Data is sampled at **Benjakitti Park** (a popular Bangkok running spot). The final
verdict is the **worse** of the two grades. WBGT is approximated from temperature
and humidity using the Australian BoM formula (no solar term); its thresholds are
tuned upward from textbook values so the verdict is a useful *relative* daily
signal for acclimatised Bangkok runners rather than a near-constant SKIP.
"Golden windows" are the best contiguous running hours in the dawn (04–09) and
evening (17–20) bands.

## Setup

```bash
npm install
cp .env.example .env   # then fill in tokens
```

| Variable | Source | Used in |
|----------|--------|---------|
| `WAQI_TOKEN` | https://aqicn.org/data-platform/token (free) | current PM2.5 |
| `OPENWEATHER_API_KEY` | One Call API 3.0 subscription (free tier, card required) | weather + hourly PM2.5 |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com | translation (Phase 2) |
| `THREADS_ACCESS_TOKEN` | Meta for Developers | posting (Phase 3) |

## Scripts

```bash
npm test               # run the test suite (vitest)
npm run coverage       # tests with coverage
npm run typecheck      # tsc --noEmit
npm run build          # compile to dist/
npm start              # run the bot + publish (needs all 4 keys)
npm run dev            # run from source via tsx
npm run dry            # full pipeline, print only — no publishing (needs WAQI+OW+ANTHROPIC)
npm run verify:translate  # live KO->EN/TH check (needs only ANTHROPIC_API_KEY)
npm run verify:threads    # publish a sample chain to Threads (needs ANTHROPIC + THREADS)
```

Local runs load `.env` automatically (via `dotenv`). In GitHub Actions the keys
come from repository secrets instead.

## Project layout

```
src/
  config.ts            # constants + env validation
  types.ts             # domain model
  pipeline.ts          # data -> conditions -> Korean post (pure)
  index.ts             # entry point (fetch + print)
  data/                # WAQI, OpenWeather One Call, OpenWeather Air Pollution
  logic/               # wbgt, verdict, goldenWindow
  message/             # closingLines, koTemplate, translate, validate
  threads/             # post (create+publish), chain (3-post chain)
  util/                # time (Asia/Bangkok), http
scripts/
  verifyTranslation.ts # live KO->EN/TH translation check
  verifyThreads.ts     # live Threads posting check
.github/workflows/
  morning-post.yml     # daily post (cron + manual dispatch)
  ci.yml               # typecheck + tests + build on push/PR
```

## Automation

`.github/workflows/morning-post.yml` runs the bot. To go live:

1. **Set the four repository secrets** (Settings → Secrets and variables →
   Actions): `WAQI_TOKEN`, `OPENWEATHER_API_KEY`, `ANTHROPIC_API_KEY`,
   `THREADS_ACCESS_TOKEN`.
2. **Test first:** Actions → *Wat Run Morning Post* → *Run workflow*. It defaults
   to a **dry run** (prints, no publishing). Untick "dry run" to publish for real.
3. **Enable the daily schedule:** uncomment the `cron: '0 21 * * *'` line in
   `morning-post.yml` (Bangkok 04:00 = UTC 21:00). It stays disabled until then so
   scheduled runs don't fail every morning before the secrets exist.

