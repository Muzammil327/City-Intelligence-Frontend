import { describe, expect, it } from "vitest";

import { bestOutsideWindow } from "./best-time";
import type { ForecastPoint } from "./types";

const HOUR_MS = 60 * 60 * 1000;
const START = Date.parse("2026-09-18T06:00:00Z");

/** Builds contiguous hourly points starting at `startMs` (no gaps inside). */
function forecast(values: number[], startMs = START): ForecastPoint[] {
  return values.map((aqi, offset) => ({
    predictedFor: new Date(startMs + offset * HOUR_MS).toISOString(),
    aqi,
    category:
      aqi >= 151
        ? "Unhealthy"
        : aqi >= 101
          ? "Unhealthy for Sensitive Groups"
          : "Moderate",
  }));
}

describe("bestOutsideWindow", () => {
  it("returns null when there is no forecast to look at", () => {
    expect(bestOutsideWindow([])).toBeNull();
  });

  it("returns null when no contiguous run is long enough to plan around", () => {
    expect(bestOutsideWindow(forecast([120]))).toBeNull();
  });

  it("picks the contiguous run with the lowest average AQI", () => {
    // Two dirty hours, then a two-hour gap, then two clean hours.
    const runB = 3 * HOUR_MS;
    const result = bestOutsideWindow([
      ...forecast([180, 170]),
      ...forecast([80, 75], START + runB),
    ]);
    expect(result).not.toBeNull();
    expect(result?.hours).toBe(2);
    expect(result?.averageAqi).toBe(78);
    expect(result?.start).toBe(new Date(START + 3 * HOUR_MS).toISOString());
    expect(result?.end).toBe(new Date(START + 4 * HOUR_MS).toISOString());
  });

  it("does not invent a clean window when the whole horizon is poor", () => {
    // The entire horizon is Unhealthy; the answer is explicitly the least-bad
    // period and its actual (dirty) category, not a fictional clear window.
    const result = bestOutsideWindow(forecast([170, 175, 180, 175, 172, 170]));
    expect(result).not.toBeNull();
    expect(result?.peakAqi).toBeGreaterThanOrEqual(151);
    expect(result?.category).toBe("Unhealthy");
  });
});