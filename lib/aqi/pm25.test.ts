import { describe, expect, it } from "vitest";

import { aqiFromPm25 } from "./pm25";

describe("aqiFromPm25", () => {
  it("maps the cleanest band endpoints exactly", () => {
    expect(aqiFromPm25(0)).toBe(0);
    expect(aqiFromPm25(12)).toBe(50);
  });

  it("steps up at every EPA breakpoint", () => {
    expect(aqiFromPm25(35.4)).toBe(100);
    expect(aqiFromPm25(35.5)).toBe(101);
    expect(aqiFromPm25(55.4)).toBe(150);
    expect(aqiFromPm25(55.5)).toBe(151);
    expect(aqiFromPm25(150.4)).toBe(200);
    expect(aqiFromPm25(150.5)).toBe(201);
    expect(aqiFromPm25(250.4)).toBe(300);
  });

  it("interpolates linearly inside a segment", () => {
    // Midpoint of 12.1–35.4 µg/m³ → midpoint of 51–100.
    expect(aqiFromPm25(23.75)).toBe(76);
    expect(aqiFromPm25(69.4)).toBe(158);
  });

  it("clamps readings above the defined scale to Hazardous (500)", () => {
    expect(aqiFromPm25(900)).toBe(500);
  });
});