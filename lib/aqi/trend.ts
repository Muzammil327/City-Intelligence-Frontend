import type { HistoryPoint } from "./types";

/**
 * Whether pollution is trending up, down or sideways, from real observed data.
 *
 * The window is split in half and the averages compared; a small difference
 * (under `DELTA_TOLERANCE`) is treated as noise, not a trend.
 */

export type TrendDirection = "increasing" | "decreasing" | "stable";

export interface TrendSummary {
  direction: TrendDirection;
  /** Short human label. */
  label: "Increasing" | "Decreasing" | "Stable";
  /** recentAvg − earlierAvg, in AQI points. */
  deltaAqi: number;
  earlierAvg: number;
  recentAvg: number;
  sampleHours: number;
}

export const DELTA_TOLERANCE = 5;

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Trend over roughly the last `windowHours` of observations.
 *
 * Returns null when there are too few points to compare two halves — silence,
 * never a fabricated trend. History arrives newest-first, so the most recent
 * `windowHours` are sliced off and read oldest→newest.
 */
export function trendOver(
  history: HistoryPoint[],
  windowHours = 6,
): TrendSummary | null {
  if (history.length < 2) return null;

  const points = [...history]
    .slice(0, windowHours)
    .sort(
      (a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt),
    );

  const half = Math.floor(points.length / 2);
  if (half === 0) return null;

  const earlier = points.slice(0, half).map((point) => point.aqi);
  const recent = points.slice(half).map((point) => point.aqi);
  if (earlier.length === 0 || recent.length === 0) return null;

  const earlierAvg = mean(earlier);
  const recentAvg = mean(recent);
  const deltaAqi = recentAvg - earlierAvg;

  const direction: TrendDirection =
    deltaAqi > DELTA_TOLERANCE
      ? "increasing"
      : deltaAqi < -DELTA_TOLERANCE
        ? "decreasing"
        : "stable";

  return {
    direction,
    label:
      direction === "increasing"
        ? "Increasing"
        : direction === "decreasing"
          ? "Decreasing"
          : "Stable",
    deltaAqi: Math.round(deltaAqi * 10) / 10,
    earlierAvg: Math.round(earlierAvg),
    recentAvg: Math.round(recentAvg),
    sampleHours: points.length,
  };
}