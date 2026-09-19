/**
 * The locales the interface is offered in.
 *
 * English is the source of truth for every message; Urdu is a second rendering
 * of the same keys. The list, the cookie that stores the choice, the direction
 * each locale reads in and the name each language calls itself all live here,
 * so adding a third locale is one edit rather than a hunt.
 */

export const LOCALES = ["en", "ur"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Where the reader's choice is stored.
 *
 * A cookie rather than a URL segment: every route in this app is already a
 * shipped URL, and a `/ur/` prefix would break each one. It holds a language
 * code and nothing else, so it is not sensitive.
 */
export const LOCALE_COOKIE = "locale";

/** A year — long enough that a returning reader never re-picks. */
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type Direction = "ltr" | "rtl";

/** Which way each locale reads, for the `dir` attribute on `<html>`. */
export const LOCALE_DIRECTIONS: Record<Locale, Direction> = {
  en: "ltr",
  ur: "rtl",
};

/**
 * What each language calls itself.
 *
 * Endonyms, not translations: a reader looking for Urdu is looking for the
 * word "اردو", not for whatever the current interface language calls it. This
 * is why the toggle reads the same in both directions.
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ur: "اردو",
};

/** Whether a value names a locale this app actually has messages for. */
export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}

/**
 * The locale a value names, or the default when it names nothing.
 *
 * Both callers hand this untrusted input — a cookie the browser sent and an
 * argument a client passed to a server action — so an unknown value falls back
 * rather than reaching the message lookup.
 */
export function localeFrom(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** The locale to switch to. With two locales, the other one. */
export function nextLocale(current: Locale): Locale {
  return current === "en" ? "ur" : "en";
}
