import type { AreaReading } from "./types";

/**
 * How the Compare tab ranks and colours neighbourhoods.
 *
 * AQI is the headline and keeps its severity bands. The mass metrics are the
 * "why" behind it — which area is dirtiest by PM2.5 itself — and share one
 * neutral accent, because painting a PM value in six EPA colours would imply
 * an AQI reading that is not there.
 */

export type CompareMetric = "aqi" | "pm25" | "pm10";

export interface CompareMetricMeta {
  value: CompareMetric;
  label: string;
  /** Appended to formatted values; null for the unitless AQI index. */
  unit: string | null;
  /** Decimal places when rounding values of this metric. */
  decimals: number;
}

export const COMPARE_METRICS: readonly CompareMetricMeta[] = [
  { value: "aqi", label: "AQI", unit: null, decimals: 0 },
  { value: "pm25", label: "PM2.5", unit: "µg/m³", decimals: 1 },
  { value: "pm10", label: "PM10", unit: "µg/m³", decimals: 1 },
];

export function metricMeta(metric: CompareMetric): CompareMetricMeta {
  return COMPARE_METRICS.find(
    (candidate) => candidate.value === metric,
  ) as CompareMetricMeta;
}

/** The number the selected areas are ranked on. Null when not measured. */
export function valueForMetric(
  area: AreaReading,
  metric: CompareMetric,
): number | null {
  if (metric === "aqi") return area.aqi;
  if (metric === "pm25") return area.pm25;
  return area.pm10;
}

/** "45" or "12.4 µg/m³" — the metric's own unit, no column header needed. */
export function formatMetricValue(
  value: number,
  metric: CompareMetric,
): string {
  const meta = metricMeta(metric);
  const rounded = value.toFixed(meta.decimals);
  return meta.unit == null ? rounded : `${rounded} ${meta.unit}`;
}

/** "+18" / "-3.2" / "±0" — a sign-aware delta in the metric's units. */
export function formatDelta(delta: number, metric: CompareMetric): string {
  const meta = metricMeta(metric);
  const rounded = delta.toFixed(meta.decimals);
  if (Number(rounded) === 0) return "±0";
  return delta > 0 ? `+${rounded}` : rounded;
}