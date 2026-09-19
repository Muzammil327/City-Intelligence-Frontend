import { cookies } from "next/headers";

import { LOCALE_COOKIE, localeFrom, type Locale } from "./locales";

/**
 * The locale this request should render in.
 *
 * Read on the server so the first paint is already in the right language and
 * direction — resolving it in the browser would render English, then swap, and
 * a right-to-left layout would visibly reflow after hydration.
 *
 * The cookie value is whatever the browser chose to send, so it is validated
 * rather than trusted: anything unrecognised falls back to the default.
 *
 * Reading a cookie opts the route into dynamic rendering. That is inherent to
 * a cookie-based locale, not a workaround — there is no single static HTML
 * that is correct for both languages.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return localeFrom(store.get(LOCALE_COOKIE)?.value);
}
