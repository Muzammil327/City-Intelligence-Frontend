import { describe, expect, it } from "vitest";

import { DELTA_TOLERANCE, trendOver } from "./trend";
import type { HistoryPoint } from "./types";

const HOUR_MS = 60 * 60 * 1000;
const START = Date.parse("2026-09-18T06:00:00Z");

function points(values: number[], startMs = START): HistoryPoint[] {
  // History arrives newest-first, so build it that way.
  return values
    .map((aqi, offset) => ({
      observedAt: new Date(startMs + offset * HOUR_MS).toISOString(),
      aqi,
      source: "stored" as const,
      temperatureC: null,
      humidityPct: null,
      windSpeedMs: null,
    }))
    .reverse();
}

describe("trendOver", () => {
  it("returns null when there is not enough data to compare two halves", () => {
    expect(trendOver([])).toBeNull();
    expect(trendOver([points([100])[0]!])).toBeNull();
  });

  it("reports increasing when the recent half clearly beats the earlier half", () => {
    const trend = trendOver(points([60, 70, 80, 90, 110]), 6);
    expect(trend?.direction).toBe("increasing");
    expect(trend?.deltaAqi).toBeGreaterThan(0);
  });

  it("reports decreasing when the recent half is clearly lower", () => {
    const trend = trendOver(points([120, 110, 100, 80, 70]), 6);
    expect(trend?.direction).toBe("decreasing");
    expect(trend?.deltaAqi).toBeLessThan(0);
  });

  it("treats a small wobble as stable rather than a trend", () => {
    const values = [100, 101, 100, 102, 101];
    const trend = trendOver(points(values), 6);
    expect(trend?.direction).toBe("stable");
    expect(Math.abs(trend?.deltaAqi ?? Infinity)).toBeLessThanOrEqual(
      DELTA_TOLERANCE,
    );
  });

  it("compares the recent hours against the older hours of the window", () => {
    // Newest hour first, as the API returns: today is heavily polluted, but
    // earlier in the same window it was clean.
    const trend = trendOver(points([50, 55, 60, 170, 175, 180]), 6);
    expect(trend?.direction).toBe("increasing");
    expect(trend?.sampleHours).toBe(6);
  });
});