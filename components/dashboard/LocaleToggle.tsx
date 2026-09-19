"use client";

import { Languages } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "@/lib/i18n/context";
import { LOCALE_LABELS, nextLocale } from "@/lib/i18n/locales";
import { setLocale } from "@/lib/i18n/set-locale";

interface LocaleToggleProps {
  /** Placement is the caller's business; the control itself is fixed. */
  className?: string;
}

/**
 * Switches the interface between English and Urdu.
 *
 * The visible text is the language being switched *to*, written in that
 * language — a reader looking for Urdu is looking for "اردو", not for the
 * English word for it. With two locales a single button is the whole control;
 * a third would make this a menu.
 *
 * The choice is stored in a cookie by a server action, and the layout above
 * re-renders with the new locale and direction. `useTransition` keeps the
 * button from being pressed twice while that round trip is in the air.
 */
export function LocaleToggle({ className }: LocaleToggleProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();

  const target = nextLocale(locale);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      aria-label={`${t("nav.switchLanguage")}: ${LOCALE_LABELS[target]}`}
      onClick={() => {
        startTransition(async () => {
          await setLocale(target);
        });
      }}
      className={className}
    >
      <Languages aria-hidden="true" />
      {/*
        `lang` on the label matters: without it a screen reader announces
        Urdu text with an English voice, and the browser picks the wrong face.
      */}
      <span lang={target}>{LOCALE_LABELS[target]}</span>
    </Button>
  );
}
