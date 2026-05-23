# Wat Run? 🏃

Daily Bangkok running-conditions bot for the **김치팍치** runner community. Every
day at **04:00 Bangkok time** it posts a traffic-light verdict (🟢 GO / 🟡 CAUTION /
🔴 SKIP) to Threads in **Korean, English, and Thai**, based on PM2.5 and heat
stress (WBGT).

> Status: **Phase 2 complete** — data pipeline, condition logic, the Korean post,
> and English + Thai translation (Claude `claude-haiku-4-5`) render end-to-end
> (console output). Threads publishing (Phase 3) is next.

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
npm start              # run the bot (needs WAQI + OPENWEATHER + ANTHROPIC keys)
npm run dev            # run from source via tsx
npm run verify:translate  # live KO->EN/TH check (needs only ANTHROPIC_API_KEY)
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
  util/                # time (Asia/Bangkok), http
scripts/
  verifyTranslation.ts # live KO->EN/TH translation check
```
