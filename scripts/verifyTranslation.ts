/**
 * Live translation check (no WAQI/OpenWeather needed).
 * Usage:  export ANTHROPIC_API_KEY=sk-ant-...   &&  npm run verify:translate
 *
 * Builds a sample Korean post and prints its English + Thai translations so you
 * can eyeball emoji/number/line-break preservation and the localized dates.
 */
import 'dotenv/config';
import { createClient, translate, type TargetLanguage } from '../src/message/translate.js';
import { buildPost } from '../src/pipeline.js';
import type { AirQuality, HourlyPm25, Weather } from '../src/types.js';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Set ANTHROPIC_API_KEY in your environment first.');
  process.exit(1);
}

const bkk = (h: number): number => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

const airQuality: AirQuality = { pm25: 38 };
const weather: Weather = {
  current: { temp: 28.5, humidity: 80, uvi: 3, feelsLike: 33 },
  hourly: [
    { dt: bkk(5), temp: 27.5, humidity: 82, uvi: 0 },
    { dt: bkk(6), temp: 28, humidity: 80, uvi: 2 },
    { dt: bkk(13), temp: 36, humidity: 55, uvi: 11 },
    { dt: bkk(17), temp: 30, humidity: 65, uvi: 3 },
    { dt: bkk(18), temp: 28.5, humidity: 70, uvi: 1 },
  ],
};
const forecast: HourlyPm25[] = [bkk(5), bkk(6), bkk(17), bkk(18)].map((dt) => ({ dt, pm25: 33 }));

const ko = buildPost(airQuality, weather, forecast, bkk(4));
console.log(ko);

const client = createClient(apiKey);
for (const target of ['English', 'Thai'] as TargetLanguage[]) {
  const out = await translate(client, ko, target, bkk(4));
  console.log(`\n--- ${target} ---\n${out}`);
}
