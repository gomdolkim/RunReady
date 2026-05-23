/** Domain model for Wat Run?. All timestamps are UNIX seconds (UTC). */

/** Traffic-light grade. Kept as English in all languages per spec. */
export type Grade = 'GO' | 'CAUTION' | 'SKIP';

/** Air quality from WAQI/aqicn — the US AQI value (same scale aqicn apps show). */
export interface AirQuality {
  /** Today's PM2.5 US AQI (daily forecast average, else current). */
  aqi: number;
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

/** Runnability of one time band (dawn or evening), at its best hour. */
export interface BandReport {
  /** Whether the forecast has any hours in this band today. */
  available: boolean;
  grade: Grade;
  /** Best contiguous window in the band, if one qualifies. */
  window: GoldenWindow | null;
  /** Coolest hour in the band (fallback time), or null. */
  coolestHour: number | null;
  /** Conditions at the band's coolest (best) hour. */
  wbgt: number;
  temp: number;
  uvi: number;
}

/** Which time of day to recommend running. */
export type Outcome = 'dawn' | 'evening' | 'both' | 'indoor';

/** Everything needed to render a post — runner-centric (dawn vs evening). */
export interface Conditions {
  /** Today's PM2.5 US AQI (from WAQI) — daily, shown once. */
  aqi: number;
  dawn: BandReport;
  evening: BandReport;
  /** Which time of day to recommend. */
  outcome: Outcome;
}
