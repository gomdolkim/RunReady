/** Domain model for Wat Run?. All timestamps are UNIX seconds (UTC). */

/** Traffic-light grade. Kept as English in all languages per spec. */
export type Grade = 'GO' | 'CAUTION' | 'SKIP';

/** Current air quality (headline number, from WAQI). */
export interface AirQuality {
  /** PM2.5 concentration in μg/m³. */
  pm25: number;
}

/** A single hour of weather. */
export interface HourlyWeather {
  dt: number;
  /** Air temperature in °C. */
  temp: number;
  /** Relative humidity in %. */
  humidity: number;
  /** UV index for the hour. */
  uvi: number;
}

/** Current conditions plus an hourly forecast (from OpenWeather One Call). */
export interface Weather {
  current: {
    temp: number;
    humidity: number;
    uvi: number;
    feelsLike: number;
  };
  hourly: HourlyWeather[];
}

/** A single hour of PM2.5 forecast (from OpenWeather Air Pollution). */
export interface HourlyPm25 {
  dt: number;
  pm25: number;
}

/** Quality tier of a golden window. */
export type WindowQuality = 'best' | 'good';

/** A contiguous run of good-to-run hours, in Bangkok local time. */
export interface GoldenWindow {
  /** Inclusive start clock time, e.g. "05:00". */
  start: string;
  /** Exclusive end clock time, e.g. "07:00". */
  end: string;
  quality: WindowQuality;
}

/** Time-of-day running advice: good windows, a best-effort coolest hour, or none. */
export type TimeAdvice =
  | { kind: 'windows'; windows: GoldenWindow[] }
  | { kind: 'coolest'; start: string; end: string }
  | { kind: 'none' };

/** Everything needed to render a post — summarized over the whole day. */
export interface Conditions {
  grade: Grade;
  /** Daytime average PM2.5 (μg/m³). */
  pm25: number;
  /** Hottest daytime temperature (°C). */
  peakTemp: number;
  /** Hottest daytime WBGT (°C) — drives the heat label. */
  peakWbgt: number;
  /** Peak daytime UV index. */
  peakUv: number;
  times: TimeAdvice;
}
