import type { Concentrations } from "./types";

/**
 * A display ceiling per pollutant, in µg/m³.
 *
 * This is a **rendering scale, not a health threshold**. It exists so that
 * concentrations measured on wildly different numeric ranges — CO in the
 * hundreds, SO₂ in single digits — can be drawn against each other at
 * comparable lengths. Each figure sits near the top of what an urban reading
 * plausibly reaches.
 *
 * It deliberately does not encode an AQI sub-index. This app does not compute
 * those (the backend only derives them for particulates), so a bar or an axis
 * implying one would be inventing a number. The printed figure beside a shape
 * is always the measurement; the shape is only context.
 *
 * Lives in its own module because the bar list and the radar must agree: two
 * copies of this table would drift, and the same reading would then draw two
 * different pictures.
 */
export const DISPLAY_CEILING: Record<keyof Concentrations, number> = {
  pm25: 150,
  pm10: 250,
  o3: 300,
  no2: 200,
  so2: 350,
  co: 4000,
  nh3: 100,
};

/** Share of the display ceiling, clamped to 0–1. Null in, null out. */
export function shareOfCeiling(
  field: keyof Concentrations,
  value: number | null,
): number | null {
  if (value === null) return null;
  return Math.min(Math.max(value / DISPLAY_CEILING[field], 0), 1);
}
