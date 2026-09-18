import { describe, expect, it } from "vitest";

import { getSeverityBand, MAX_AQI, SEVERITY_BANDS } from "./severity";
import type { SeverityId } from "./severity";

describe("SEVERITY_BANDS", () => {
  it("starts at zero and ends at the top of the scale", () => {
    expect(SEVERITY_BANDS[0]?.min).toBe(0);
    expect(SEVERITY_BANDS[SEVERITY_BANDS.length - 1]?.max).toBe(MAX_AQI);
  });

  it("is contiguous, so no AQI value falls between two bands", () => {
    SEVERITY_BANDS.forEach((band, index) => {
      if (index === 0) return;
      const previous = SEVERITY_BANDS[index - 1];
      expect(band.min).toBe((previous?.max ?? 0) + 1);
    });
  });

  it("has a unique id per band", () => {
    const ids = SEVERITY_BANDS.map((band) => band.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every band a label, advice and colour reference", () => {
    for (const band of SEVERITY_BANDS) {
      expect(band.label).not.toBe("");
      expect(band.advice).not.toBe("");
      expect(band.className).toContain("bg-aqi-");
      expect(band.colorVar).toMatch(/^var\(--color-aqi-/);
    }
  });
});

describe("getSeverityBand", () => {
  const boundaries: Array<[number, SeverityId]> = [
    [0, "good"],
    [50, "good"],
    [51, "moderate"],
    [100, "moderate"],
    [101, "sensitive"],
    [150, "sensitive"],
    [151, "unhealthy"],
    [200, "unhealthy"],
    [201, "very-unhealthy"],
    [300, "very-unhealthy"],
    [301, "hazardous"],
    [500, "hazardous"],
  ];

  it.each(boundaries)("maps AQI %i to the %s band", (aqi, expectedId) => {
    expect(getSeverityBand(aqi).id).toBe(expectedId);
  });

  it("clamps values above the scale to hazardous", () => {
    expect(getSeverityBand(501).id).toBe("hazardous");
    expect(getSeverityBand(10_000).id).toBe("hazardous");
    expect(getSeverityBand(Number.POSITIVE_INFINITY).id).toBe("hazardous");
  });

  it("treats values below the scale as good rather than throwing", () => {
    expect(getSeverityBand(-1).id).toBe("good");
    expect(getSeverityBand(Number.NEGATIVE_INFINITY).id).toBe("good");
  });

  it("falls back to good for a non-numeric reading", () => {
    expect(getSeverityBand(Number.NaN).id).toBe("good");
  });
});
