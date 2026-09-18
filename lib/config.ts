/**
 * The single place the app reads configuration.
 * This frontend-only build uses bundled demo data, so nothing here touches an
 * environment variable. A future real backend would add a
 * `NEXT_PUBLIC_API_BASE_URL`-backed constant in this file.
 */

/** How often the dashboard re-polls for fresh readings. */
export const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

/**
 * How old a reading can be before the UI calls it stale. The backend reports
 * `ageHours` and `isStale` itself; this is a display-time backstop so the
 * frontend never shows the 6-hour horizon as though it were minutes old.
 */
export const STALE_AFTER_HOURS = 6;

/** How many hours of observed history the trend views request by default. */
export const HISTORY_HOURS = 168;

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