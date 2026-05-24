/** Domain model for Wat Run?. All timestamps are UNIX seconds (UTC). */

/** Traffic-light grade. Kept as English in all languages per spec. */
export type Grade = 'GO' | 'CAUTION' | 'SKIP';

/** Air quality from WAQI/aqicn — US AQI (same scale aqicn apps show). */
export interface AirQuality {
  /** Today's PM2.5 US AQI: daily forecast average (used to gate windows). */
  avg: number;
  /** Daily forecast min and max (shown as a range). */
  min: number;
  max: number;
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
  /** Precipitation probability in % (Open-Meteo). Optional for legacy sources. */
  precipProb?: number;
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
  /** Today's PM2.5 US AQI range (from WAQI), shown once. */
  aqiMin: number;
  aqiMax: number;
  dawn: BandReport;
  evening: BandReport;
  /** Which time of day to recommend. */
  outcome: Outcome;
}

/** Air reading at a specific spot, from the WAQI station nearest its coords. */
export interface SpotAir {
  /** PM2.5 US AQI (rounded). */
  aqi: number;
  /** Name of the WAQI station the reading came from. */
  station: string;
}

/** A real Bangkok running spot. Coordinates are approximate park centroids. */
export interface Spot {
  /** Stable slug id. */
  id: string;
  nameKo: string;
  nameEn: string;
  nameTh: string;
  /** Korean neighbourhood label, e.g. "아속/클롱토이". */
  area: string;
  /** One-line Korean description (vibe + why it's good to run). */
  blurbKo: string;
  lat: number;
  lon: number;
  /** Approximate loop distance in km (data only; for future filtering). */
  loopKm: number;
  /** Shade rating 0 (exposed) – 3 (very shaded). */
  shade: 0 | 1 | 2 | 3;
  /** English hashtag token (no spaces), e.g. "Benjakitti". */
  tag: string;
}

/** Everything needed to render a "spot of the day" post. */
export interface SpotConditions {
  spot: Spot;
  grade: Grade;
  /** Best contiguous dawn window, if one qualifies. */
  window: GoldenWindow | null;
  /** Coolest dawn hour (fallback time), or null. */
  bestHour: number | null;
  /** Conditions at the best dawn hour. */
  wbgt: number;
  temp: number;
  uvi: number;
  /** Air at the spot. */
  aqi: number;
  station: string;
  /** Rain hint line, or null. */
  rainHint: string | null;
}
