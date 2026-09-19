import { describe, expect, it } from "vitest";

import {
  accuracyMetricMeta,
  accuracyTrend,
  largestMiss,
  latestOfBasis,
  predictedVsActual,
  trendDelta,
} from "@/lib/aqi/accuracy";
import type {
  AccuracyBasis,
  AccuracySnapshot,
  ForecastAccuracyPoint,
} from "@/lib/aqi/types";

const HOUR_MS = 60 * 60 * 1000;
const START = Date.parse("2026-09-18T06:00:00Z");

function snapshot(
  hoursFromStart: number,
  basis: AccuracyBasis,
  values: Partial<AccuracySnapshot> = {},
): AccuracySnapshot {
  return {
    recordedAt: new Date(START + hoursFromStart * HOUR_MS).toISOString(),
    basis,
    city: "Lahore",
    model: "ridge",
    horizonHours: 24,
    trainingSamples: 168,
    scoredPoints: 24,
    meanAbsoluteError: 12,
    rootMeanSquareError: 15,
    bandAccuracyPct: 50,
    ...values,
  };
}

function pair(
  hoursFromStart: number,
  predictedAqi: number,
  observedAqi: number,
): ForecastAccuracyPoint {
  return {
    predictedFor: new Date(START + hoursFromStart * HOUR_MS).toISOString(),
    hoursAhead: hoursFromStart + 1,
    predictedAqi,
    observedAqi,
    error: predictedAqi - observedAqi,
    predictedCategory: "Unhealthy",
    observedCategory: "Unhealthy",
  };
}

describe("accuracyTrend", () => {
  it("returns points oldest first, whatever order they arrive in", () => {
    const trend = accuracyTrend(
      [
        snapshot(48, "hindcast", { bandAccuracyPct: 60 }),
        snapshot(0, "hindcast", { bandAccuracyPct: 20 }),
        snapshot(24, "hindcast", { bandAccuracyPct: 40 }),
      ],
      "bandAccuracyPct",
    );

    expect(trend.map((point) => point.hindcast)).toEqual([20, 40, 60]);
  });

  it("keeps the two bases in separate series rather than averaging them", () => {
    const trend = accuracyTrend(
      [
        snapshot(0, "hindcast", { bandAccuracyPct: 20 }),
        snapshot(0, "verified", { bandAccuracyPct: 80 }),
      ],
      "bandAccuracyPct",
    );

    expect(trend).toHaveLength(1);
    expect(trend[0].hindcast).toBe(20);
    expect(trend[0].verified).toBe(80);
  });

  it("leaves a basis null at a moment it did not record", () => {
    const trend = accuracyTrend(
      [snapshot(0, "hindcast"), snapshot(24, "verified")],
      "meanAbsoluteError",
    );

    expect(trend[0].verified).toBeNull();
    expect(trend[1].hindcast).toBeNull();
  });

  it("reads the metric it was asked for", () => {
    const rows = [snapshot(0, "hindcast", { rootMeanSquareError: 33 })];
    expect(accuracyTrend(rows, "rootMeanSquareError")[0].hindcast).toBe(33);
    expect(accuracyTrend(rows, "meanAbsoluteError")[0].hindcast).toBe(12);
  });

  it("returns nothing for an empty list", () => {
    expect(accuracyTrend([], "bandAccuracyPct")).toEqual([]);
  });
});

describe("trendDelta", () => {
  it("measures first to last within one basis", () => {
    const trend = accuracyTrend(
      [
        snapshot(0, "hindcast", { bandAccuracyPct: 20 }),
        snapshot(24, "hindcast", { bandAccuracyPct: 45 }),
      ],
      "bandAccuracyPct",
    );

    expect(trendDelta(trend, "hindcast")).toBe(25);
  });

  it("is null below two points, because one measurement is not a trend", () => {
    const trend = accuracyTrend(
      [snapshot(0, "hindcast", { bandAccuracyPct: 20 })],
      "bandAccuracyPct",
    );

    expect(trendDelta(trend, "hindcast")).toBeNull();
    expect(trendDelta(trend, "verified")).toBeNull();
  });

  it("ignores the gaps left by the other basis", () => {
    const trend = accuracyTrend(
      [
        snapshot(0, "verified", { bandAccuracyPct: 30 }),
        snapshot(12, "hindcast", { bandAccuracyPct: 99 }),
        snapshot(24, "verified", { bandAccuracyPct: 50 }),
      ],
      "bandAccuracyPct",
    );

    expect(trendDelta(trend, "verified")).toBe(20);
  });
});

describe("latestOfBasis", () => {
  it("picks the newest of that basis, not the newest overall", () => {
    const latest = latestOfBasis(
      [
        snapshot(0, "verified", { bandAccuracyPct: 10 }),
        snapshot(24, "verified", { bandAccuracyPct: 20 }),
        snapshot(48, "hindcast", { bandAccuracyPct: 90 }),
      ],
      "verified",
    );

    expect(latest?.bandAccuracyPct).toBe(20);
  });

  it("is null when that basis has never been recorded", () => {
    expect(latestOfBasis([snapshot(0, "hindcast")], "verified")).toBeNull();
  });
});

describe("predictedVsActual", () => {
  it("pairs each hour and sorts oldest first", () => {
    const points = predictedVsActual([
      pair(2, 180, 160),
      pair(0, 120, 130),
      pair(1, 140, 150),
    ]);

    expect(points.map((point) => point.predicted)).toEqual([120, 140, 180]);
    expect(points.map((point) => point.observed)).toEqual([130, 150, 160]);
  });

  it("carries the signed error through unchanged", () => {
    const [point] = predictedVsActual([pair(0, 120, 130)]);
    expect(point.error).toBe(-10);
  });

  it("returns nothing for an empty list", () => {
    expect(predictedVsActual([])).toEqual([]);
  });
});

describe("largestMiss", () => {
  it("finds the biggest miss in either direction", () => {
    const points = predictedVsActual([
      pair(0, 120, 130),
      pair(1, 200, 140),
      pair(2, 100, 180),
    ]);

    expect(largestMiss(points)?.error).toBe(-80);
  });

  it("is null on an empty window rather than a placeholder hour", () => {
    expect(largestMiss([])).toBeNull();
  });
});

describe("accuracyMetricMeta", () => {
  it("knows which direction is an improvement", () => {
    expect(accuracyMetricMeta("bandAccuracyPct").higherIsBetter).toBe(true);
    expect(accuracyMetricMeta("meanAbsoluteError").higherIsBetter).toBe(false);
    expect(accuracyMetricMeta("rootMeanSquareError").higherIsBetter).toBe(false);
  });

  it("carries the unit each metric is reported in", () => {
    expect(accuracyMetricMeta("bandAccuracyPct").unit).toBe("%");
    expect(accuracyMetricMeta("meanAbsoluteError").unit).toBe("AQI");
  });
});
