import { DISPLAY_LOCALE, DISPLAY_TIME_ZONE } from "./config";

/**
 * Formatters are module-level singletons: constructing an Intl formatter is
 * expensive and these are called once per chart tick.
 */

const hourFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: DISPLAY_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: DISPLAY_TIME_ZONE,
});

const dateFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: "numeric",
  month: "short",
  timeZone: DISPLAY_TIME_ZONE,
});

/** "14:00" — for chart axes. */
export function formatHour(isoTimestamp: string): string {
  return hourFormatter.format(new Date(isoTimestamp));
}

/** "17 Sep, 14:00" — for readouts and tooltips. */
export function formatDateTime(isoTimestamp: string): string {
  return dateTimeFormatter.format(new Date(isoTimestamp));
}

/** "17 Sep" — for windowed views. */
export function formatDate(isoTimestamp: string): string {
  return dateFormatter.format(new Date(isoTimestamp));
}

const FULL_TIME = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: DISPLAY_TIME_ZONE,
});

/** "14:00" with no leading zero under every locale — distinct from formatHour. */
export function formatTime(isoTimestamp: string): string {
  return FULL_TIME.format(new Date(isoTimestamp));
}

const COMPASS: ReadonlyArray<string> = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

/** 360 compass degrees from a weather provider → "ESE", "W", etc. */
export function compassDirection(degrees: number | null): string | null {
  if (degrees == null || !Number.isFinite(degrees)) return null;
  const index = Math.round(((degrees % 360) / 360) * 16) % 16;
  return COMPASS[index] ?? null;
}
