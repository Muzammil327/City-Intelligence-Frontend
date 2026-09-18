import { describe, expect, it } from "vitest";

import { aqiFromPm25 } from "@/lib/aqi/pm25";
import {
  MITIGATION_MEASURES,
  clampIntensity,
  computeScenario,
  emptyScenario,
  fullScenario,
  projectPm25,
  projectedAreaReading,
  totalReductionPct,
} from "@/lib/aqi/scenarios";
import type { AreaReading } from "@/lib/aqi/types";

function area(uid: string, pm25: number, name = uid): AreaReading {
  return {
    uid,
    name,
    latitude: 31.5,
    longitude: 74.35,
    source: "open-meteo-model (sample)",
    basis: "gridded-model",
    weatherSource: "open-meteo (sample)",
    observedAt: "2026-09-18T06:00:00.000Z",
    ageHours: 0.3,
    isStale: false,
    aqi: aqiFromPm25(pm25),
    pm25,
    pm10: Math.round(pm25 * 1.7),
    temperatureC: 30,
    humidityPct: 52,
    windSpeedMs: 4.4,
    windDirectionDeg: 268,
  };
}

const AREAS = [area("a", 72), area("b", 67), area("c", 62)];

describe("scenario inputs", () => {
  it("starts with every measure off", () => {
    const scenario = emptyScenario();
    for (const measure of MITIGATION_MEASURES) {
      expect(scenario[measure.id]).toBe(0);
    }
  });

  it("turns every measure on in the ceiling reference", () => {
    const scenario = fullScenario();
    for (const measure of MITIGATION_MEASURES) {
      expect(scenario[measure.id]).toBe(100);
    }
  });

  it("clamps out-of-range intensities to 0–100", () => {
    expect(clampIntensity(250)).toBe(100);
    expect(clampIntensity(-10)).toBe(0);
    expect(clampIntensity(40)).toBe(40);
    expect(clampIntensity(Number.NaN)).toBe(0);
  });
});

describe("totalReductionPct", () => {
  it("is zero when nothing is implemented", () => {
    expect(totalReductionPct(emptyScenario())).toBe(0);
  });

  it("returns a measure's full ceiling at 100% intensity", () => {
    expect(totalReductionPct({ traffic: 100 })).toBeCloseTo(25, 5);
  });

  it("compounds measures with diminishing returns rather than adding them", () => {
    // 25% + 20% line up as 45% if added; compounding gives 1 - (0.75 × 0.80).
    expect(totalReductionPct({ traffic: 100, industry: 100 })).toBeCloseTo(
      40,
      5,
    );
  });

  it("half intensity yields half the measure's ceiling", () => {
    expect(totalReductionPct({ traffic: 50 })).toBeCloseTo(12.5, 5);
  });

  it("always remains below 100 even at full intensity", () => {
    expect(totalReductionPct(fullScenario())).toBeCloseTo(60.526, 2);
  });
});

describe("projectPm25", () => {
  it("applies the percentage reduction", () => {
    expect(projectPm25(100, 40)).toBeCloseTo(60, 5);
  });

  it("never produces a negative concentration", () => {
    expect(projectPm25(100, 120)).toBe(0);
  });

  it("passes through a missing baseline as missing", () => {
    expect(projectPm25(null, 40)).toBeNull();
  });
});

describe("computeScenario", () => {
  it("returns null when there are no areas to plan from", () => {
    expect(computeScenario([], emptyScenario())).toBeNull();
  });

  it("leaves everything unchanged when no measure is implemented", () => {
    const result = computeScenario(AREAS, emptyScenario());
    expect(result).not.toBeNull();
    expect(result?.reductionPct).toBe(0);
    expect(result?.overall.deltaAqi).toBe(0);
    expect(result?.overall.bandImproved).toBe(false);
    for (const sweep of result?.areas ?? []) {
      expect(sweep.projectedAqi).toBe(sweep.baseAqi);
      expect(sweep.bandImproved).toBe(false);
    }
  });

  it("lowers every unhealthy area under the ceiling scenario", () => {
    const result = computeScenario(AREAS, fullScenario());
    expect(result).not.toBeNull();
    expect(result?.overall.deltaAqi).toBeLessThan(0);
    for (const sweep of result?.areas ?? []) {
      expect(sweep.projectedAqi).toBeLessThan(sweep.baseAqi);
    }
  });

  it("reports how many areas reach a cleaner severity band", () => {
    const result = computeScenario(AREAS, fullScenario());
    expect(result).not.toBeNull();
    expect(result?.areasImprovedBand).toBeGreaterThan(0);
    const improved = result?.areas.filter((sweep) => sweep.bandImproved) ?? [];
    const unchanged = result?.areas.filter((sweep) => !sweep.bandImproved) ?? [];
    expect(improved.length + unchanged.length).toBe(AREAS.length);
  });
});

describe("projectedAreaReading", () => {
  it("produces a full reading with the projected numbers attached", () => {
    const base = AREAS[0] as AreaReading;
    const projected = projectedAreaReading(base, 40);
    expect(projected.uid).toBe(base.uid);
    expect(projected.latitude).toBe(base.latitude);
    expect(projected.aqi).toBeLessThan(base.aqi);
    expect(projected.pm25).toBeLessThan((base.pm25 ?? 0) + 1);
    expect(projected.source).toBe("scenario (sample)");
  });
});