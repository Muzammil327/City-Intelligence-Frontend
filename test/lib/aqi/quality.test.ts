import { describe, expect, it } from "vitest";

import { qualityFor } from "@/lib/aqi/quality";
import type { CurrentReading } from "@/lib/aqi/types";

function makeCurrent(overrides: Partial<CurrentReading> = {}): CurrentReading {
  return {
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
    ...overrides,
  };
}

describe("qualityFor", () => {
  it("reports unavailable when there is no reading at all", () => {
    const quality = qualityFor(null, true);
    expect(quality.status).toBe("unavailable");
    expect(quality.lastUpdated).toBeNull();
  });

  it("calls a stale reading stale, never live", () => {
    const quality = qualityFor(
      makeCurrent({ isStale: true, ageHours: 30 }),
      true,
    );
    expect(quality.status).toBe("stale");
    expect(quality.detail).toContain("30");
  });

  it("is live only for fresh, non-stale readings with area data", () => {
    const quality = qualityFor(makeCurrent(), true);
    expect(quality.status).toBe("live");
  });

  it("is limited when the headline is fresh but there are no area readings", () => {
    const quality = qualityFor(makeCurrent(), false);
    expect(quality.status).toBe("limited");
  });

  it("is recent rather than live once the reading is over an hour old", () => {
    const quality = qualityFor(makeCurrent({ ageHours: 2 }), true);
    expect(quality.status).toBe("recent");
    expect(quality.detail).toContain("2");
  });
});