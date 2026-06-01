/** Domain model for Wat Run?. All timestamps are UNIX seconds (UTC). */

/** Traffic-light grade. Kept as English in all languages per spec. */
export type Grade = 'GO' | 'CAUTION' | 'SKIP';

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

/**
 * A real Bangkok place to visit (non-restaurant): temple, museum, park, market,
 * landmark, or viewpoint. Used by the morning "place of the day" post.
 */
export interface Place {
  /** Stable slug id. */
  id: string;
  nameKo: string;
  nameEn: string;
  nameTh: string;
  /** Korean neighbourhood label, e.g. "라따나꼬신(올드타운)". */
  area: string;
  /** One-line Korean hook (the vibe / why it's worth visiting). */
  blurbKo: string;
  /** Korean "what you can see there" line (볼거리). */
  seeKo: string;
  /** Korean "how to get there" line (가는 법) — transit-first. */
  goKo: string;
  lat: number;
  lon: number;
  /** English hashtag token (no spaces), e.g. "WatArun". */
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
