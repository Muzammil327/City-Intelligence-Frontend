/**
 * US EPA AQI severity bands — the single source of truth for every place the
 * dashboard colours, labels or describes an AQI number.
 *
 * Colours live in `app/globals.css` as `--color-aqi-*` tokens; this table only
 * references them. To move to a different national AQI scale, change the
 * breakpoints and labels here and the token values there.
 */

export type SeverityId =
  | "good"
  | "moderate"
  | "sensitive"
  | "unhealthy"
  | "very-unhealthy"
  | "hazardous";

export interface SeverityBand {
  id: SeverityId;
  label: string;
  /** Inclusive lower bound of the band. */
  min: number;
  /** Inclusive upper bound of the band. */
  max: number;
  /** What a person should actually do at this level. */
  advice: string;
  /** Utility classes for a filled swatch (badge, marker, legend chip). */
  className: string;
  /**
   * The band colour as a CSS variable reference, for consumers that need a
   * colour string rather than a class — Recharts strokes and Leaflet icons.
   */
  colorVar: string;
}

/** Ordered from cleanest to most severe. Bands are contiguous and exhaustive. */
export const SEVERITY_BANDS: readonly SeverityBand[] = [
  {
    id: "good",
    label: "Good",
    min: 0,
    max: 50,
    advice: "Air quality is satisfactory. No precautions needed.",
    className: "bg-aqi-good text-aqi-good-foreground",
    colorVar: "var(--color-aqi-good)",
  },
  {
    id: "moderate",
    label: "Moderate",
    min: 51,
    max: 100,
    advice:
      "Acceptable, though unusually sensitive people should consider limiting prolonged exertion outdoors.",
    className: "bg-aqi-moderate text-aqi-moderate-foreground",
    colorVar: "var(--color-aqi-moderate)",
  },
  {
    id: "sensitive",
    label: "Unhealthy for Sensitive Groups",
    min: 101,
    max: 150,
    advice:
      "Children, older adults and people with heart or lung conditions should limit prolonged outdoor exertion.",
    className: "bg-aqi-sensitive text-aqi-sensitive-foreground",
    colorVar: "var(--color-aqi-sensitive)",
  },
  {
    id: "unhealthy",
    label: "Unhealthy",
    min: 151,
    max: 200,
    advice:
      "Everyone may begin to feel effects. Sensitive groups should avoid prolonged outdoor exertion.",
    className: "bg-aqi-unhealthy text-aqi-unhealthy-foreground",
    colorVar: "var(--color-aqi-unhealthy)",
  },
  {
    id: "very-unhealthy",
    label: "Very Unhealthy",
    min: 201,
    max: 300,
    advice:
      "Health alert. Everyone should avoid prolonged outdoor exertion; sensitive groups should stay indoors.",
    className: "bg-aqi-very-unhealthy text-aqi-very-unhealthy-foreground",
    colorVar: "var(--color-aqi-very-unhealthy)",
  },
  {
    id: "hazardous",
    label: "Hazardous",
    min: 301,
    max: 500,
    advice:
      "Emergency conditions. Everyone should remain indoors and keep activity low.",
    className: "bg-aqi-hazardous text-aqi-hazardous-foreground",
    colorVar: "var(--color-aqi-hazardous)",
  },
];

/** Highest AQI the EPA scale defines. Readings above it clamp to Hazardous. */
export const MAX_AQI = 500;

const HAZARDOUS_BAND = SEVERITY_BANDS[SEVERITY_BANDS.length - 1] as SeverityBand;
const GOOD_BAND = SEVERITY_BANDS[0] as SeverityBand;

/** The band an AQI value falls into. Values outside 0–500 clamp to the ends. */
export function getSeverityBand(aqi: number): SeverityBand {
  // Order matters: an over-scale reading is hazardous, and +Infinity is
  // over-scale. Checking "is it a number at all" first would report the most
  // dangerous possible value as Good.
  if (Number.isNaN(aqi)) return GOOD_BAND;
  if (aqi > MAX_AQI) return HAZARDOUS_BAND;

  const band = SEVERITY_BANDS.find((candidate) => aqi <= candidate.max);
  return band ?? HAZARDOUS_BAND;
}
