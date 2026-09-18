import { describe, expect, it } from "vitest";

import { recommendationsFor } from "@/lib/aqi/recommendations";
import type { CurrentReading } from "@/lib/aqi/types";
import type { BestWindow } from "@/lib/aqi/best-time";
import type { TrendSummary } from "@/lib/aqi/trend";

const NOW = Date.parse("2026-09-18T10:00:00Z");

function makeCurrent(aqi: number): CurrentReading {
  return {
    city: "Lahore",
    source: "open-meteo-air-quality",
    aqi,
    category: "Unhealthy",
    dominantPollutant: null,
    observedAt: new Date(NOW).toISOString(),
    ageHours: 0.2,
    isStale: false,
    latitude: 31.52,
    longitude: 74.36,
    concentrations: {
      pm25: aqi * 0.4,
      pm10: aqi * 0.7,
      o3: null,
      no2: null,
      so2: null,
      co: null,
      nh3: null,
    },
    weather: null,
    airPollution: null,
    waqi: null,
  };
}

const WINDOW: BestWindow = {
  start: new Date(NOW + 6 * 60 * 60 * 1000).toISOString(),
  end: new Date(NOW + 7 * 60 * 60 * 1000).toISOString(),
  hours: 2,
  averageAqi: 60,
  peakAqi: 70,
  category: "Moderate",
};

const RISING: TrendSummary = {
  direction: "increasing",
  label: "Increasing",
  deltaAqi: 30,
  earlierAvg: 80,
  recentAvg: 110,
  sampleHours: 6,
};

describe("recommendationsFor", () => {
  it("returns nothing when there is no reading", () => {
    expect(recommendationsFor(null, null, null)).toEqual([]);
  });

  it("always gives activity guidance for the current level", () => {
    const recommendations = recommendationsFor(makeCurrent(40), null, null);
    expect(
      recommendations.some((recommendation) => recommendation.id === "activity-good"),
    ).toBe(true);
  });

  it("advises against strenuous exercise at unhealthy levels", () => {
    const recommendations = recommendationsFor(makeCurrent(160), null, null);
    expect(
      recommendations.some((recommendation) => recommendation.id === "exercise-avoid"),
    ).toBe(true);
  });

  it("limits exercise for sensitive groups in the sensitive range", () => {
    const recommendations = recommendationsFor(makeCurrent(120), null, null);
    expect(
      recommendations.some((recommendation) => recommendation.id === "exercise-limit"),
    ).toBe(true);
  });

  it("suggests timing from the data-derived window", () => {
    const recommendations = recommendationsFor(makeCurrent(150), null, WINDOW);
    const timing = recommendations.find(
      (recommendation) => recommendation.id === "timing-window",
    );
    expect(timing?.detail).toContain("60");
  });

  it("warns that air is getting worse without claiming a cause", () => {
    const recommendations = recommendationsFor(makeCurrent(110), RISING, null);
    expect(
      recommendations.some((recommendation) => recommendation.id === "timing-rising"),
    ).toBe(true);
  });

  it("adds exposure-reduction advice only above sensitive-group levels", () => {
    expect(
      recommendationsFor(makeCurrent(60), null, null).some(
        (recommendation) => recommendation.id === "exposure-reduce",
      ),
    ).toBe(false);
    expect(
      recommendationsFor(makeCurrent(110), null, null).some(
        (recommendation) => recommendation.id === "exposure-reduce",
      ),
    ).toBe(true);
  });
});