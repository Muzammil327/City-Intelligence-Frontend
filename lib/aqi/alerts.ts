import type {
  AreaReading,
  CurrentReading,
  ForecastPoint,
  HistoryPoint,
  OverallSummary,
} from "./types";
import { trendOver } from "./trend";

/**
 * Alerts derived purely from actual readings and the forecast — thresholds
 * crossed, rapid rises, expected crossings, and unusually high areas.
 * Everything here is a consequence of the numbers, never a hardcoded claim.
 */

export type AlertSeverity = "info" | "warning" | "critical";

export interface AqiAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
}

// US EPA thresholds, kept next to their labels so a threshold change means one
// edit and not a hunt through messages.
export const SENSITIVE_AQI = 101;
export const UNHEALTHY_AQI = 151;
export const VERY_UNHEALTHY_AQI = 201;

/** A rise at least this large over the trend window is "rapid". */
export const RAPID_RISE_AQI = 20;
/** An area this far above the city average is called a hotspot. */
export const HOTSPOT_ABOVE_AVERAGE_AQI = 40;
/** The worst forecast hour furthest out that still counts as "expected". */
const FORECAST_HOURS_TO_CHECK = 24;

const ORDER: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function generateAlerts(
  current: CurrentReading | null,
  forecast: ForecastResponseLike | null,
  history: HistoryPoint[],
  areas: AreaReading[] | null,
  overall: OverallSummary | null,
): AqiAlert[] {
  const alerts: AqiAlert[] = [];

  if (current) {
    if (current.aqi >= UNHEALTHY_AQI) {
      alerts.push({
        id: "current-unhealthy",
        severity: "critical",
        title: `Unhealthy air right now (AQI ${current.aqi})`,
        detail: `Air quality is ${current.category.toLowerCase()}. Everyone may begin to feel effects.`,
      });
    } else if (current.aqi >= SENSITIVE_AQI) {
      alerts.push({
        id: "current-sensitive",
        severity: "warning",
        title: `Unhealthy for sensitive groups (AQI ${current.aqi})`,
        detail: "Children, older adults and people with heart or lung conditions should limit prolonged exertion outdoors.",
      });
    }
  }

  const trend = trendOver(history);
  if (trend && trend.direction === "increasing" && trend.deltaAqi >= RAPID_RISE_AQI) {
    alerts.push({
      id: "rapid-increase",
      severity: current && current.aqi >= UNHEALTHY_AQI ? "critical" : "warning",
      title: "AQI rising quickly",
      detail: `Over the last ${trend.sampleHours} hours the average has climbed by ${trend.deltaAqi} points.`,
    });
  }

  if (forecast && forecast.points.length > 0 && current) {
    const horizon = forecast.points.slice(0, FORECAST_HOURS_TO_CHECK);
    const peak = horizon.reduce(
      (worst, point) => (point.aqi > worst.aqi ? point : worst),
      horizon[0] as ForecastPoint,
    );

    if (peak.aqi >= VERY_UNHEALTHY_AQI && current.aqi < VERY_UNHEALTHY_AQI) {
      alerts.push({
        id: "forecast-very-unhealthy",
        severity: "warning",
        title: "Forecast reaches Very Unhealthy",
        detail: `The model projects AQI ${peak.aqi} within ${FORECAST_HOURS_TO_CHECK} hours — consider shifting plans earlier.`,
      });
    } else if (
      peak.aqi >= UNHEALTHY_AQI &&
      current.aqi < UNHEALTHY_AQI
    ) {
      alerts.push({
        id: "forecast-unhealthy",
        severity: "warning",
        title: "Forecast reaches Unhealthy",
        detail: `The model projects AQI ${peak.aqi} within ${FORECAST_HOURS_TO_CHECK} hours.`,
      });
    }
  }

  if (
    areas &&
    areas.length >= 2 &&
    overall &&
    overall.aqi !== null &&
    overall.aqi !== 0
  ) {
    for (const area of areas) {
      if (area.aqi >= overall.aqi + HOTSPOT_ABOVE_AVERAGE_AQI) {
        alerts.push({
          id: `hotspot-${area.uid}`,
          severity: "warning",
          title: `${area.name} is above the city average`,
          detail: `${area.name} reads AQI ${area.aqi}, ${area.aqi - overall.aqi} points above the city average of ${overall.aqi}.`,
        });
        break;
      }
    }
  }

  return alerts.sort(
    (a, b) => ORDER[a.severity] - ORDER[b.severity] || a.title.localeCompare(b.title),
  );
}

/**
 * The subset of ForecastResponse we read here, so this module stays testable
 * without importing the transport layer.
 */
export interface ForecastResponseLike {
  points: ForecastPoint[];
}