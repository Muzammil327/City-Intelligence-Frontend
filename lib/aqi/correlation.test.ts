import { describe, expect, it } from "vitest";

import { pearson } from "./correlation";
import type { HistoryPoint } from "./types";

const HOUR_MS = 60 * 60 * 1000;
const START = Date.parse("2026-09-18T06:00:00Z");

function points(
  rows: Array<{ wind: number | null; aqi: number }>,
): HistoryPoint[] {
  return rows.map(({ wind, aqi }, index) => ({
    observedAt: new Date(START + index * HOUR_MS).toISOString(),
    aqi,
    source: "stored",
    temperatureC: null,
    humidityPct: null,
    windSpeedMs: wind,
  }));
}

describe("pearson", () => {
  it("returns null when there are fewer than three joined readings", () => {
    const result = pearson(points([{ wind: 5, aqi: 100 }]), "windSpeedMs");
    expect(result.r).toBeNull();
    expect(result.sampleHours).toBe(1);
  });

  it("skips hours where the weather variable is missing", () => {
    const result = pearson(
      points([
        { wind: null, aqi: 100 },
        { wind: 3, aqi: 120 },
        { wind: 5, aqi: 130 },
        { wind: 4, aqi: 150 },
      ]),
      "windSpeedMs",
    );
    expect(result.r).not.toBeNull();
    expect(result.sampleHours).toBe(3);
  });

  it("computes a perfect positive correlation as r ≈ 1", () => {
    const result = pearson(
      points([
        { wind: 1, aqi: 100 },
        { wind: 2, aqi: 200 },
        { wind: 3, aqi: 300 },
        { wind: 4, aqi: 400 },
      ]),
      "windSpeedMs",
    );
    expect(result.r).not.toBeNull();
    expect(result.r!).toBeCloseTo(1, 3);
  });

  it("computes a perfect negative correlation as r ≈ −1", () => {
    const result = pearson(
      points([
        { wind: 4, aqi: 100 },
        { wind: 3, aqi: 200 },
        { wind: 2, aqi: 300 },
        { wind: 1, aqi: 400 },
      ]),
      "windSpeedMs",
    );
    expect(result.r).not.toBeNull();
    expect(result.r!).toBeCloseTo(-1, 3);
  });

  it("returns null when the data has zero variance", () => {
    const result = pearson(
      points([
        { wind: 5, aqi: 100 },
        { wind: 5, aqi: 100 },
        { wind: 5, aqi: 100 },
      ]),
      "windSpeedMs",
    );
    expect(result.r).toBeNull();
  });
});