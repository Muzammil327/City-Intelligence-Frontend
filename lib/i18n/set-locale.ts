"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  localeFrom,
} from "./locales";

/**
 * Store the reader's language choice.
 *
 * A server action rather than `document.cookie`: the cookie's attributes are
 * then written in one place, and the layout re-renders with the new locale
 * without the client having to know that the language lives above it.
 *
 * The argument arrives from a browser, so it is validated like any other
 * boundary input — `localeFrom` rejects anything that is not a locale this app
 * has messages for.
 */
export async function setLocale(value: string): Promise<void> {
  const store = await cookies();

  store.set(LOCALE_COOKIE, localeFrom(value), {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    // Not httpOnly on purpose: it carries a language code, nothing else, and
    // leaving it readable keeps a future client-side read possible.
    httpOnly: false,
  });

  // The locale is read in the root layout, so the whole tree is what changes.
  revalidatePath("/", "layout");
}
