/**
 * The only place the app talks to the backend, over one shared axios client.
 *
 * Responses are consumed as-is: the FastAPI schemas use a camelCase alias
 * generator, so the wire shapes match `./types` field for field and no mapping
 * layer sits between them.
 *
 * All four endpoints are live against the API — nothing here returns sample
 * data any more.
 */

import axios from "axios";

import {
  API_BASE_URL,
  HISTORY_MAX_POINTS,
  REQUEST_TIMEOUT_MS,
} from "@/lib/config";

import type {
  AreasResponse,
  CurrentReading,
  ForecastAccuracy,
  ForecastResponse,
  HistoryResponse,
  StationsResponse,
} from "./types";

/**
 * One client for the whole app, so the base URL, the timeout and the headers
 * are configured once rather than at each call site.
 */
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

/**
 * A failed request, carrying the status so callers can tell the difference
 * between "try again" and "stop asking".
 */
export class ApiError extends Error {
  /** Undefined when nothing answered — a network failure or a blocked origin. */
  readonly status: number | undefined;

  constructor(message: string, status: number | undefined) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Retrying a rate-limited request is how a client makes its own problem worse. */
export function isRateLimited(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * The message out of the backend's `{ error: { code, message } }` envelope, or
 * null when the body is something else. Narrowed rather than asserted: an error
 * response is the one case where the body is least likely to be the shape the
 * contract promises.
 */
function apiErrorMessage(body: unknown): string | null {
  if (!isRecord(body) || !isRecord(body.error)) return null;
  return typeof body.error.message === "string" ? body.error.message : null;
}

/**
 * Turn a failed request into one line a person can read.
 *
 * The three cases are genuinely different to a user: the service answered and
 * explained itself, the service answered badly, or nothing answered at all.
 * A stack trace or a provider message never gets this far.
 */
function requestFailureMessage(path: string, error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return `Request to ${path} failed.`;
  }

  const fromBackend = apiErrorMessage(error.response?.data);
  if (fromBackend) return fromBackend;

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return `Request to ${path} timed out.`;
  }

  if (error.response) {
    return `Request to ${path} failed (${error.response.status}).`;
  }

  return `Could not reach the service at ${API_BASE_URL}.`;
}

/**
 * One request, one place. A failure throws, so React Query's `isError` branch
 * drives the ErrorState every panel already renders.
 *
 * The success body is returned as `T` without per-field validation: the backend
 * owns this contract, `types.ts` mirrors its schemas, and the project has no
 * validation library to check against. A shape change there is a coordinated
 * change, not untrusted input.
 */
async function apiFetch<T>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  try {
    const { data } = await client.get<T>(path, { params });
    return data;
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    throw new ApiError(requestFailureMessage(path, error), status);
  }
}

/**
 * The person-readable reason a fetcher failed, for an ErrorState description.
 *
 * Safe to render: every throw from `apiFetch` carries a message written for a
 * client — the backend's own `error.message`, a status line, or a reachability
 * note. Anything thrown from elsewhere falls back to the caller's wording
 * rather than leaking whatever it happened to contain.
 */
export function failureMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Query keys, so cache invalidation has one vocabulary. */
export const aqiQueryKeys = {
  all: ["aqi"] as const,
  current: () => [...aqiQueryKeys.all, "current"] as const,
  history: (hours?: number) => [...aqiQueryKeys.all, "history", hours] as const,
  forecast: (hours?: number) => [...aqiQueryKeys.all, "forecast", hours] as const,
  areas: () => [...aqiQueryKeys.all, "areas"] as const,
  stations: () => [...aqiQueryKeys.all, "stations"] as const,
  accuracy: (hours?: number) =>
    [...aqiQueryKeys.all, "accuracy", hours] as const,
};

/** Current AQI, concentrations, and weather. */
export function fetchCurrentReading(): Promise<CurrentReading> {
  return apiFetch<CurrentReading>("/current");
}

/**
 * Observed readings, newest first, bounded by `hours`.
 *
 * `limit` travels with `hours` because the backend caps rows separately from
 * the window and defaults that cap to 24 — asking for a week without it
 * returns a day, with no error to say so.
 */
export function fetchHistory(hours: number): Promise<HistoryResponse> {
  return apiFetch<HistoryResponse>("/history", {
    hours,
    limit: Math.min(hours, HISTORY_MAX_POINTS),
  });
}

/**
 * The model's hourly predictions over the horizon.
 *
 * This one can fail legitimately: the backend refits its ridge model per call
 * and refuses below `MIN_TRAINING_SAMPLES` stored readings. Callers treat an
 * error here as "no forecast yet", not as a broken page.
 */
export function fetchForecast(hours: number): Promise<ForecastResponse> {
  return apiFetch<ForecastResponse>("/forecast", { hours });
}

/**
 * How close the model's predictions were to what actually happened.
 *
 * Fails legitimately on a thin store — scoring N hours needs the training
 * minimum *plus* N, so early on there is simply nothing to measure.
 */
export function fetchForecastAccuracy(hours: number): Promise<ForecastAccuracy> {
  return apiFetch<ForecastAccuracy>("/forecast/accuracy", { hours });
}

/**
 * Physical monitoring stations reported for the city.
 *
 * An empty list is a valid answer, not a failure: WAQI lists no active station
 * in Lahore, which is the reason the neighbourhood feed is model-derived.
 */
export function fetchStations(): Promise<StationsResponse> {
  return apiFetch<StationsResponse>("/stations");
}

/** Neighbourhood readings plus the representative city summary. */
export function fetchAreas(): Promise<AreasResponse> {
  return apiFetch<AreasResponse>("/areas");
}