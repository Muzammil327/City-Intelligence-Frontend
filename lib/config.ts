/**
 * The single place the app reads configuration.
 *
 * `NEXT_PUBLIC_*` is inlined into the browser bundle, which is correct here —
 * the base URL is public by nature, the browser has to know it to call the API,
 * and nothing secret ever goes in this file.
 */

/**
 * Where the FastAPI service lives. The backend's `CORS_ORIGINS` must list the
 * origin this page is served from, or the browser blocks every request before
 * one reaches the network.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

/** How often the dashboard re-polls for fresh readings. */
export const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/**
 * How long a request may hang before the UI is told it failed. Without a bound
 * an unreachable backend leaves every panel spinning indefinitely.
 *
 * Generous, because the slow endpoints are not slow by accident: `/history` and
 * `/forecast` fan out to two Open-Meteo calls before they can answer, and a
 * tighter bound aborts a request the server then completes successfully.
 */
export const REQUEST_TIMEOUT_MS = 30 * 1000;

/**
 * How old a reading can be before the UI calls it stale. The backend reports
 * `ageHours` and `isStale` itself; this is a display-time backstop so the
 * frontend never shows the 6-hour horizon as though it were minutes old.
 */
export const STALE_AFTER_HOURS = 6;

/** How many hours of observed history the trend views request by default. */
export const HISTORY_HOURS = 168;

/**
 * The most history rows the backend will return in one response (its `limit`
 * caps at 500 and defaults to 24). Asked for a window without a matching limit,
 * a seven-day request comes back silently truncated to a day.
 */
export const HISTORY_MAX_POINTS = 500;

/** The forecast horizon requested from the backend (matches its ridge model). */
export const FORECAST_HORIZON_HOURS = 24;

/**
 * Timezone every timestamp is rendered in. Fixed rather than the viewer's
 * locale so the server and client renders produce identical markup — a
 * locale-dependent format here is the classic hydration mismatch.
 */
export const DISPLAY_TIME_ZONE = "Asia/Karachi";

/** Locale used for all date, time and number formatting. */
export const DISPLAY_LOCALE = "en-GB";