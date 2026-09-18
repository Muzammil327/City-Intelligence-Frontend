import { describe, expect, it } from "vitest";

import { forecastDirectionLabel, forecastInsights } from "./insights";
import type { CurrentReading, ForecastPoint, HistoryPoint } from "./types";

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
      pm25: 69.4,
      pm10: 120.1,
      o3: null,
      no2: null,
      so2: null,
      co: null,
      nh3: null,
    },
    weather: {
      source: "openweathermap",
      temperatureC: 31.0,
      feelsLikeC: 33.0,
      humidityPct: 55,
      pressureHpa: 1008,
      windSpeedMs: 4.7,
      windDirectionDeg: 268,
      conditions: "Haze",
    },
    airPollution: null,
    waqi: null,
  };
}

const HISTORY: HistoryPoint[] = [
  {
    observedAt: new Date(NOW - 60 * 60 * 1000).toISOString(),
    aqi: 175,
    source: "stored",
    temperatureC: 31,
    humidityPct: 55,
    windSpeedMs: 4.7,
  },
];

function forecast(aqi: number): ForecastPoint {
  return {
    predictedFor: new Date(NOW + 6 * 60 * 60 * 1000).toISOString(),
    aqi,
    category: "Unhealthy",
  };
}

describe("forecastDirectionLabel", () => {
  it("says no forecast when there is nothing to compare", () => {
    expect(forecastDirectionLabel(null, [])).toBe("no forecast");
    expect(forecastDirectionLabel(makeCurrent(100), [])).toBe("no forecast");
  });

  it("labels a rising tail as increasing", () => {
    expect(forecastDirectionLabel(makeCurrent(100), [forecast(150)])).toBe(
      "increasing",
    );
  });

  it("labels a falling tail as decreasing", () => {
    expect(forecastDirectionLabel(makeCurrent(150), [forecast(70)])).toBe(
      "decreasing",
    );
  });

  it("treats a small movement as stable", () => {
    expect(forecastDirectionLabel(makeCurrent(100), [forecast(103)])).toBe(
      "stable",
    );
  });
});

describe("forecastInsights", () => {
  it("explains the prediction through inputs, not causes", () => {
    const insight = forecastInsights(makeCurrent(180), HISTORY, [
      forecast(190),
    ]);
    expect(insight.summary).toMatch(/expected to /);
    expect(insight.factors.some((f) => f.label === "Particulate matter")).toBe(
      true,
    );
    expect(insight.factors.some((f) => f.label === "Wind")).toBe(true);
    expect(insight.factors.some((f) => f.label === "Humidity")).toBe(true);
  });

  it("never claims causation in the summary or the factors", () => {
    const insight = forecastInsights(makeCurrent(180), HISTORY, [
      forecast(190),
    ]);
    const words = [
      insight.summary,
      ...insight.factors.map((f) => `${f.label} ${f.detail}`),
    ].join(" ");
    expect(words).not.toMatch(/\bbecause\b/i);
    expect(words).not.toMatch(/\bcaused by\b/i);
    expect(words).not.toMatch(/\b(?:results?|leads?)\s+in\b/i);
    expect(words).not.toMatch(/\bdrives?\b/i);
  });

  it("maintains the observed-vs-predicted separation", () => {
    const insight = forecastInsights(makeCurrent(180), HISTORY, [
      forecast(190),
    ]);
    expect(insight.summary).toContain("next 1 hours");
    // No factor ever states a predicted value as measured.
    expect(insight.caveat).toContain("not proven causes");
  });
});