/**
 * WBGT (Wet Bulb Globe Temperature) approximation without solar radiation,
 * using the Australian Bureau of Meteorology simplified formula.
 *
 *   WBGT ≈ 0.567 × Ta + 0.393 × e + 3.94
 *   e (hPa) = (RH / 100) × 6.105 × exp(17.27 × Ta / (237.7 + Ta))
 */

/** Water-vapour pressure in hPa from temperature (°C) and humidity (%). */
export function vaporPressure(tempC: number, humidityPct: number): number {
  const saturation = 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  return (humidityPct / 100) * saturation;
}

/** WBGT in °C from temperature (°C) and relative humidity (%). */
export function wbgt(tempC: number, humidityPct: number): number {
  const e = vaporPressure(tempC, humidityPct);
  return 0.567 * tempC + 0.393 * e + 3.94;
}
