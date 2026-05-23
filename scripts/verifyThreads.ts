/**
 * Live Threads posting check (isolated from WAQI/OpenWeather).
 * Usage:  export ANTHROPIC_API_KEY=... THREADS_ACCESS_TOKEN=...  (or use .env)
 *         npm run verify:threads
 *
 * ⚠️ This publishes a real 3-post chain to your Threads account using sample
 * weather data (dated 2026-05-24). Delete the test post afterwards if you like.
 */
import 'dotenv/config';
import { requireEnv } from '../src/config.js';
import { createClient, translate } from '../src/message/translate.js';
import { buildPost } from '../src/pipeline.js';
import { publishChain, type PostFn } from '../src/threads/chain.js';
import { publishPost } from '../src/threads/post.js';
import type { AirQuality, Weather } from '../src/types.js';

const anthropicKey = requireEnv('ANTHROPIC_API_KEY');
const threadsToken = requireEnv('THREADS_ACCESS_TOKEN');

const bkk = (h: number): number => Date.UTC(2026, 4, 24, h - 7, 0, 0) / 1000;

const airQuality: AirQuality = { aqi: 53 };
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
const now = bkk(4);
const ko = buildPost(airQuality, weather, now);
const client = createClient(anthropicKey);
const en = await translate(client, ko, 'English', now);
const th = await translate(client, ko, 'Thai', now);

console.log('Publishing sample chain to Threads...\n');
console.log(ko);

const post: PostFn = (text, replyToId) => publishPost(threadsToken, text, replyToId);
const result = await publishChain({ ko, en, th }, post);
console.log('\nposted:', JSON.stringify(result, null, 2));
