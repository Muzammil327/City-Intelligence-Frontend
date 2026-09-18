/**
 * Demo data provider — this build is frontend-only by explicit scope.
 *
 * Every fetcher below returns bundled sample data in the same shapes a real
 * backend would use (`./types`), so the dashboard runs fully self-contained:
 * no network calls, no environment variables, works offline on a demo machine.
 * To wire a real backend later, swap the bodies of these functions only.
 */

import { demoData } from "./demo-data";
import type {
  AreasResponse,
  CurrentReading,
  ForecastResponse,
  HistoryResponse,
} from "./types";

/** Query keys, so cache invalidation has one vocabulary. */
export const aqiQueryKeys = {
  all: ["aqi"] as const,
  current: () => [...aqiQueryKeys.all, "current"] as const,
  history: (hours?: number) => [...aqiQueryKeys.all, "history", hours] as const,
  forecast: (hours?: number) => [...aqiQueryKeys.all, "forecast", hours] as const,
  areas: () => [...aqiQueryKeys.all, "areas"] as const,
};

/** Tiny simulated latency so the loading states are visible on first mount. */
function after<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 180));
}

/** Current AQI, concentrations, and weather (sample values). */
export function fetchCurrentReading(): Promise<CurrentReading> {
  return after(demoData.current);
}

/** Observed readings, newest first, bounded by `hours` (sample values). */
export function fetchHistory(hours: number): Promise<HistoryResponse> {
  return after(demoData.history(hours));
}

/** The model's hourly predictions over the horizon (sample values). */
export function fetchForecast(hours: number): Promise<ForecastResponse> {
  const points = demoData.forecast.points.slice(0, hours);
  return after({
    ...demoData.forecast,
    horizonHours: hours,
    points,
  });
}

/** Neighbourhood readings plus the representative city summary (sample values). */
export function fetchAreas(): Promise<AreasResponse> {
  return after(demoData.areas());
}