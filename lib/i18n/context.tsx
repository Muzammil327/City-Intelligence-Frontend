"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  LOCALE_DIRECTIONS,
  type Direction,
  type Locale,
} from "./locales";
import { createTranslate, type Messages, type Translate } from "./messages";

/**
 * The active locale, handed down from the server render.
 *
 * Most of this dashboard is client-rendered — `?tab=` is read through
 * `useSearchParams`, which pulls the tree below it into the browser — so the
 * locale resolved in the layout has to reach those components somehow.
 * Context, once, rather than a prop threaded through a dozen panels.
 *
 * The catalog is small and flat, so sending it whole costs less than a second
 * round trip would.
 */

interface LocaleContextValue {
  locale: Locale;
  direction: Direction;
  t: Translate;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}

export function LocaleProvider({
  locale,
  messages,
  children,
}: LocaleProviderProps) {
  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      direction: LOCALE_DIRECTIONS[locale],
      t: createTranslate(messages),
    }),
    [locale, messages],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

function useLocaleContext(): LocaleContextValue {
  const value = useContext(LocaleContext);

  // Loud rather than silent: without the provider every label would render as
  // its own key, which looks like a catalog bug rather than a missing wrapper.
  if (value === null) {
    throw new Error("Locale hooks must be used inside <LocaleProvider>.");
  }

  return value;
}

/** The lookup for the active locale's catalog. */
export function useTranslations(): Translate {
  return useLocaleContext().t;
}

/** The active locale, for the rare component that branches on it. */
export function useLocale(): Locale {
  return useLocaleContext().locale;
}

/** Which way the interface reads — for logic that CSS cannot express. */
export function useDirection(): Direction {
  return useLocaleContext().direction;
}
