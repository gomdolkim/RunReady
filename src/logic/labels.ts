/** Plain-Korean grade labels for the displayed metrics. */

/** PM2.5 US AQI (WAQI/aqicn) → Korean air-quality grade. */
export function airLabel(aqi: number): string {
  if (aqi <= 50) return '좋음';
  if (aqi <= 100) return '보통';
  if (aqi <= 150) return '나쁨';
  return '매우 나쁨';
}

/** WBGT (°C) → Korean heat-danger label, aligned with the verdict thresholds. */
export function heatLabel(wbgt: number): string {
  if (wbgt < 30) return '좋음';
  if (wbgt < 32.5) return '주의';
  if (wbgt < 35) return '위험';
  return '매우 위험';
}

/** UV index → Korean band (WHO scale). */
export function uvLabel(uvi: number): string {
  if (uvi < 3) return '낮음';
  if (uvi < 6) return '보통';
  if (uvi < 8) return '높음';
  if (uvi < 11) return '매우 높음';
  return '위험';
}
