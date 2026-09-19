"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { useState, type ReactNode } from "react";

import { isRateLimited } from "@/lib/aqi/api";
import { REFRESH_INTERVAL_MS } from "@/lib/config";
import { LocaleProvider } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/locales";
import type { Messages } from "@/lib/i18n/messages";
import { transition } from "@/lib/motion";

interface ProvidersProps {
  children: ReactNode;
  /** Resolved on the server in `app/layout.tsx`, from the locale cookie. */
  locale: Locale;
  /** That locale's catalog, sent whole so no lookup needs a round trip. */
  messages: Messages;
}

/**
 * One QueryClient per browser session. Created in state rather than at module
 * scope so a server render never shares a cache between requests.
 */
export function Providers({ children, locale, messages }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Readings update hourly upstream; anything fresher is wasted work.
            staleTime: REFRESH_INTERVAL_MS,
            refetchOnWindowFocus: false,
            // One retry for a transient failure, none for a 429 — retrying a
            // rate-limited request is how a client makes its own problem worse.
            retry: (failureCount, error) =>
              !isRateLimited(error) && failureCount < 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/*
        `reducedMotion="user"` is the whole accessibility story for motion:
        every animation in the app runs through Framer Motion, and this makes
        the OS setting authoritative over all of them at once.
      */}
      <MotionConfig reducedMotion="user" transition={transition}>
        <LocaleProvider locale={locale} messages={messages}>
          {children}
        </LocaleProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
