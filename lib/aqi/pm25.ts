/**
 * US EPA PM2.5 → AQI conversion — the single source of truth for every place
 * that turns a mass concentration into an index number.
 *
 * Extracted so the scenario planner and anything else converting a mass
 * concentration share one table. Moving to a different national AQI scale
 * changes the breakpoints here and nothing else.
 */

/** US EPA PM2.5 breakpoints (hourly) in µg/m³. */
export const PM25_SEGMENTS: ReadonlyArray<{
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
}> = [
  { cLow: 0, cHigh: 12, iLow: 0, iHigh: 50 },
  { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
  { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
  { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
  { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
  { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
];

/** Piecewise-linear PM2.5 µg/m³ → US AQI. */
export function aqiFromPm25(pm25: number): number {
  for (const { cLow, cHigh, iLow, iHigh } of PM25_SEGMENTS) {
    if (pm25 <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (pm25 - cLow) + iLow);
    }
  }
  return 500;
}
