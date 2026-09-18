import { describe, expect, it } from "vitest";

import { generateAlerts } from "@/lib/aqi/alerts";
import type {
  AreaReading,
  CurrentReading,
  ForecastPoint,
  HistoryPoint,
  OverallSummary,
} from "@/lib/aqi/types";
import type { AlertSeverity } from "@/lib/aqi/alerts";

const CURRENT: CurrentReading = {
  city: "Lahore",
  source: "open-meteo-air-quality",
  aqi: 180,
  category: "Unhealthy",
  dominantPollutant: null,
  observedAt: "2026-09-18T10:00:00Z",
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
  weather: null,
  airPollution: null,
  waqi: null,
};

function history(values: number[]): HistoryPoint[] {
  const now = Date.now();
  return values
    .slice()
    .reverse()
    .map((aqi, index) => ({
      observedAt: new Date(now - index * 60 * 60 * 1000).toISOString(),
      aqi,
      source: "stored",
      temperatureC: null,
      humidityPct: null,
      windSpeedMs: null,
    }));
}

function forecast(values: number[]): ForecastPoint[] {
  const now = Date.now();
  return values.map((aqi, index) => ({
    predictedFor: new Date(now + index * 60 * 60 * 1000).toISOString(),
    aqi,
    category: "Unhealthy",
  }));
}

function makeArea(uid: string, aqi: number): AreaReading {
  return {
    uid,
    name: uid,
    latitude: 31.5,
    longitude: 74.3,
    source: "open-meteo-model",
    basis: "gridded-model",
    weatherSource: null,
    observedAt: "2026-09-18T10:00:00Z",
    ageHours: 0.2,
    isStale: false,
    aqi,
    pm25: null,
    pm10: null,
    temperatureC: null,
    humidityPct: null,
    windSpeedMs: null,
    windDirectionDeg: null,
  };
}

const OVERALL: OverallSummary = {
  aqi: 180,
  category: "Unhealthy",
  pm25: 69.4,
  areasWithData: 3,
  areaCount: 6,
  highestName: "Gulberg",
  highestAqi: 220,
  lowestName: "Wagah",
  lowestAqi: 150,
  observedAt: "2026-09-18T10:00:00Z",
};

function severities(alerts: { severity: AlertSeverity }[]): AlertSeverity[] {
  return alerts.map((alert) => alert.severity);
}

describe("generateAlerts", () => {
  it("flags an unhealthy current reading as critical", () => {
    const alerts = generateAlerts(CURRENT, null, [], null, null);
    expect(severities(alerts)).toContain("critical");
    expect(alerts.some((alert) => alert.id === "current-unhealthy")).toBe(true);
  });

  it("flags sensitive-group levels as a warning only", () => {
    const alerts = generateAlerts(
      { ...CURRENT, aqi: 120, category: "Unhealthy for Sensitive Groups" },
      null,
      [],
      null,
      null,
    );
    expect(severities(alerts)).toContain("warning");
    expect(alerts.some((alert) => alert.id === "current-sensitive")).toBe(true);
    expect(severities(alerts)).not.toContain("critical");
  });

  it("does not alert on clean air", () => {
    const alerts = generateAlerts(
      { ...CURRENT, aqi: 40, category: "Good" },
      null,
      [],
      null,
      null,
    );
    expect(alerts).toHaveLength(0);
  });

  it("raises a rapid-increase alert from the real trend, not a fixed rule", () => {
    const alerts = generateAlerts(
      { ...CURRENT, aqi: 90 },
      null,
      history([40, 45, 50, 90, 95, 100]),
      null,
      null,
    );
    expect(alerts.some((alert) => alert.id === "rapid-increase")).toBe(true);
  });

  it("only warns on a forecast crossing when the current level is below it", () => {
    const alerts = generateAlerts(
      { ...CURRENT, aqi: 120 },
      { points: forecast([130, 160, 200, 210]) },
      [],
      null,
      null,
    );
    expect(alerts.some((alert) => alert.id === "forecast-very-unhealthy")).toBe(
      true,
    );
  });

  it("stays silent on the forecast when current air is already worse", () => {
    const alerts = generateAlerts(
      { ...CURRENT, aqi: 220 },
      { points: forecast([130, 160, 200, 210]) },
      [],
      null,
      null,
    );
    expect(
      alerts.some(
        (alert) =>
          alert.id === "forecast-very-unhealthy" ||
          alert.id === "forecast-unhealthy",
      ),
    ).toBe(false);
  });

  it("calls an area a hotspot only when it is far enough above the average", () => {
    const alerts = generateAlerts(
      { ...CURRENT, aqi: 150 },
      null,
      [],
      [makeArea("Gulberg", 220), makeArea("Wagah", 120)],
      OVERALL,
    );
    expect(alerts.some((alert) => alert.id === "hotspot-Gulberg")).toBe(true);
  });

  it("sorts critical alerts ahead of warnings", () => {
    const alerts = generateAlerts(
      { ...CURRENT, aqi: 170 },
      { points: forecast([180, 210]) },
      history([120, 140, 160, 170, 175, 180]),
      null,
      null,
    );
    const critical = alerts.findIndex((alert) => alert.severity === "critical");
    const warnings = alerts.findIndex((alert) => alert.severity === "warning");
    expect(critical).toBeGreaterThanOrEqual(0);
    expect(warnings).toBeGreaterThan(critical);
  });
});