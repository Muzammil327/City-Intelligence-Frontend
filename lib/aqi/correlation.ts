import type { HistoryPoint } from "./types";

/**
 * Small statistics for the weather-and-pollution view.
 *
 * These are descriptive relationships, not engineering-grade rigor: n is small
 * and the variables are not independent (humidity and wind correlate with each
 * other and with time of day). The UI says that plainly next to the chart.
 */

export interface CorrelationResult {
  /** Pearson r in −1…1, or null when it cannot be computed. */
  r: number | null;
  /** Number of hours where both variables were present. */
  sampleHours: number;
  /** Points for the scatter, oldest→newest. */
  points: Array<{ aqi: number; x: number }>;
}

export type WeatherVariable = "windSpeedMs" | "humidityPct" | "temperatureC";

export function pearson(
  history: HistoryPoint[],
  variable: WeatherVariable,
): CorrelationResult {
  const points: Array<{ aqi: number; x: number }> = [];
  for (const point of history) {
    const x = point[variable];
    if (x == null) continue;
    points.push({ aqi: point.aqi, x });
  }

  if (points.length < 3) {
    return { r: null, sampleHours: points.length, points };
  }

  const n = points.length;
  const sumAqi = points.reduce((sum, p) => sum + p.aqi, 0);
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumAqiX = points.reduce((sum, p) => sum + p.aqi * p.x, 0);
  const sumAqiSq = points.reduce((sum, p) => sum + p.aqi * p.aqi, 0);
  const sumXSq = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const numerator = n * sumAqiX - sumAqi * sumX;
  const denominator = Math.sqrt(
    (n * sumAqiSq - sumAqi * sumAqi) * (n * sumXSq - sumX * sumX),
  );
  if (denominator === 0 || !Number.isFinite(denominator)) {
    return { r: null, sampleHours: n, points };
  }

  const r = numerator / denominator;
  return {
    r: Math.round(r * 1000) / 1000,
    sampleHours: n,
    points,
  };
}