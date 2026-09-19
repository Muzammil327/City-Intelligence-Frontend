/**
 * Shaping for the model-accuracy views.
 *
 * Pure: no React, no fetch, no Next. The charts that consume this cannot be
 * meaningfully tested — Recharts needs real layout measurement and renders
 * empty under jsdom — so the arithmetic and the pivoting live here, where they
 * can be.
 */

import type {
  AccuracyBasis,
  AccuracySnapshot,
  ForecastAccuracyPoint,
} from "./types";

/** The three figures a snapshot carries, each answering a different question. */
export type AccuracyMetric =
  | "bandAccuracyPct"
  | "meanAbsoluteError"
  | "rootMeanSquareError";

export interface AccuracyMetricMeta {
  metric: AccuracyMetric;
  /** Short name for the selector. */
  label: string;
  /** Long name for the axis and the caption. */
  title: string;
  unit: string;
  /**
   * Whether a rising line is an improving model.
   *
   * Band accuracy is a hit rate, so up is better. Both error metrics are
   * average misses, so down is. A chart that does not say which is which
   * invites the reader to assume the first.
   */
  higherIsBetter: boolean;
  description: string;
}

export const ACCURACY_METRICS: readonly AccuracyMetricMeta[] = [
  {
    metric: "bandAccuracyPct",
    label: "Band accuracy",
    title: "Correct EPA category",
    unit: "%",
    higherIsBetter: true,
    description:
      "How often the forecast landed in the same EPA category as the reading. Being 15 points out inside one band changes no advice; crossing a boundary does.",
  },
  {
    metric: "meanAbsoluteError",
    label: "Mean error",
    title: "Mean absolute error",
    unit: "AQI",
    higherIsBetter: false,
    description:
      "The average miss, in AQI points, ignoring direction. The plainest answer to how wrong a forecast usually is.",
  },
  {
    metric: "rootMeanSquareError",
    label: "RMS error",
    title: "Root mean square error",
    unit: "AQI",
    higherIsBetter: false,
    description:
      "Like the mean error, but large misses count for more. It sits above the mean error whenever the model occasionally gets an hour badly wrong.",
  },
];

export function accuracyMetricMeta(metric: AccuracyMetric): AccuracyMetricMeta {
  return (
    ACCURACY_METRICS.find((candidate) => candidate.metric === metric) ??
    ACCURACY_METRICS[0]
  );
}

/** One moment on the trend, with a slot for each basis. */
export interface AccuracyTrendPoint {
  /** ISO-8601 UTC. */
  timestamp: string;
  /** Null when no snapshot of that basis was recorded at this moment. */
  hindcast: number | null;
  verified: number | null;
}

/**
 * Pivot snapshots into one row per moment, one column per basis.
 *
 * The two bases stay in separate columns deliberately. A hindcast and a
 * verified score answer different questions, and averaging them into a single
 * line would produce a number that describes neither.
 *
 * Ascending by time, because a chart reads left to right while the API returns
 * newest first.
 */
export function accuracyTrend(
  snapshots: readonly AccuracySnapshot[],
  metric: AccuracyMetric,
): AccuracyTrendPoint[] {
  const rows = new Map<string, AccuracyTrendPoint>();

  for (const snapshot of snapshots) {
    const value = snapshot[metric];
    if (!Number.isFinite(value)) continue;

    const existing = rows.get(snapshot.recordedAt) ?? {
      timestamp: snapshot.recordedAt,
      hindcast: null,
      verified: null,
    };

    if (snapshot.basis === "verified") {
      existing.verified = value;
    } else {
      existing.hindcast = value;
    }

    rows.set(snapshot.recordedAt, existing);
  }

  return [...rows.values()].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
  );
}

/** The most recent snapshot of a given basis, or null when there is none. */
export function latestOfBasis(
  snapshots: readonly AccuracySnapshot[],
  basis: AccuracyBasis,
): AccuracySnapshot | null {
  let latest: AccuracySnapshot | null = null;
  for (const snapshot of snapshots) {
    if (snapshot.basis !== basis) continue;
    if (latest === null || Date.parse(snapshot.recordedAt) > Date.parse(latest.recordedAt)) {
      latest = snapshot;
    }
  }
  return latest;
}

/**
 * Change between the first and last value of a series, in the metric's units.
 *
 * Returns null below two points: a single measurement is not a trend, and
 * drawing a delta from it would invent one.
 */
export function trendDelta(
  points: readonly AccuracyTrendPoint[],
  basis: AccuracyBasis,
): number | null {
  const values = points
    .map((point) => (basis === "verified" ? point.verified : point.hindcast))
    .filter((value): value is number => value !== null);

  if (values.length < 2) return null;
  return values[values.length - 1] - values[0];
}

/** One predicted hour beside the observation that actually followed. */
export interface PredictedVsActualPoint {
  /** ISO-8601 UTC. */
  timestamp: string;
  predicted: number;
  observed: number;
  /** predicted − observed. Positive means the model ran high. */
  error: number;
  hoursAhead: number;
}

/**
 * Predicted against observed, oldest first.
 *
 * Both series are carried on every row so the chart can draw them against one
 * axis — and so the tooltip can show the pair, which is the only way to read a
 * gap as a miss rather than as two unrelated lines.
 */
export function predictedVsActual(
  points: readonly ForecastAccuracyPoint[],
): PredictedVsActualPoint[] {
  return points
    .map((point) => ({
      timestamp: point.predictedFor,
      predicted: point.predictedAqi,
      observed: point.observedAqi,
      error: point.error,
      hoursAhead: point.hoursAhead,
    }))
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

/**
 * The worst miss in a scored window, for annotating the chart.
 *
 * Null on an empty list rather than a zero-valued placeholder, which would
 * draw a marker at an hour that does not exist.
 */
export function largestMiss(
  points: readonly PredictedVsActualPoint[],
): PredictedVsActualPoint | null {
  return points.reduce<PredictedVsActualPoint | null>(
    (worst, point) =>
      worst === null || Math.abs(point.error) > Math.abs(worst.error)
        ? point
        : worst,
    null,
  );
}
