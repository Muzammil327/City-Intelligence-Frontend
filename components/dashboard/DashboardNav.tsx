"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocaleToggle } from "@/components/dashboard/LocaleToggle";
import { TABS, TAB_ICONS } from "@/components/dashboard/tabs";
import { useDirection, useTranslations } from "@/lib/i18n/context";
import { DURATION, EASE, indicatorTransition } from "@/lib/motion";

interface NavListProps {
  /** Which view is showing, so exactly one row carries the pill. */
  activeTab: string;
  /**
   * The shared-layout id for the active pill.
   *
   * The desktop column and the mobile drawer can both be mounted at once, and
   * two elements claiming one `layoutId` make the indicator jump between them.
   * Each instance is given its own, so each animates within its own list.
   */
  indicatorLayoutId: string;
  /** Called after a view is chosen, so the drawer can close behind it. */
  onSelect?: () => void;
}

function NavList({ activeTab, indicatorLayoutId, onSelect }: NavListProps) {
  const t = useTranslations();

  return (
    <TabsList
      variant="line"
      className="h-auto w-full min-h-0 flex-col items-stretch gap-1 overflow-y-auto rounded-lg bg-transparent p-0"
    >
      {TABS.map((tab) => {
        const Icon = TAB_ICONS[tab.value];
        return (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            onClick={onSelect}
            className="relative w-full justify-start gap-2.5 rounded-md border border-transparent px-0 py-0 text-start transition-colors hover:border-white/10 hover:bg-white/5"
          >
            {/*
              The active pill is a shared-layout element that slides between
              nav rows, so the travel reads as one object moving. Rendered for
              the active row only: one `layoutId` per list is what makes it a
              single object rather than ten competing for the same identity.
            */}
            {activeTab === tab.value ? (
              <motion.span
                layoutId={indicatorLayoutId}
                transition={indicatorTransition}
                aria-hidden="true"
                className="absolute inset-0 rounded-md bg-white/10 ring-1 ring-white/10"
              />
            ) : null}
            {/*
              The icon sits in the same 36px column as the wordmark's glyph
              above it, so the nav labels start on the wordmark's left edge
              rather than a column of their own.
            */}
            <span className="relative flex size-9 shrink-0 items-center justify-center">
              {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
            </span>
            <span className="relative">{t(tab.labelKey)}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}

interface DashboardNavProps {
  /** The showing view, passed through so the pill knows where to sit. */
  activeTab: string;
}

/**
 * The dashboard's navigation, in the two shapes it needs.
 *
 * Below `lg` the views do not belong in the flow: stacked full width they fill
 * a phone screen on their own and push the dashboard under the fold. So small
 * screens get a bar with a trigger and an off-canvas drawer, and `lg` and up
 * keeps the static column unchanged.
 */
export function DashboardNav({ activeTab }: DashboardNavProps) {
  const t = useTranslations();
  const direction = useDirection();
  const [isOpen, setIsOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const $triggerRef = useRef<HTMLButtonElement>(null);
  const $closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes, as it does for every other dismissible surface.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // The page behind a drawer must not scroll with it.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Focus enters the drawer when it opens and returns to the trigger when it
  // closes, so a keyboard never lands on whatever happens to be behind it.
  //
  // The guard matters: without it the first run on mount pulls focus to the
  // trigger on every page load, before anyone has asked for the drawer at all.
  const hasOpenedRef = useRef(false);
  useEffect(() => {
    if (isOpen) {
      hasOpenedRef.current = true;
      $closeRef.current?.focus();
      return;
    }
    if (hasOpenedRef.current) {
      $triggerRef.current?.focus({ preventScroll: true });
    }
  }, [isOpen]);

  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: DURATION.base, ease: EASE };

  // The drawer enters from the edge it is anchored to, which is the leading
  // edge in both directions — the left in English, the right in Urdu. CSS
  // logical properties place it; the animation has to be told separately.
  const offscreenX = direction === "rtl" ? "100%" : "-100%";

  return (
    <>
      {/* Small screens: the bar that replaces the column. */}
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 lg:hidden">
        <button
          ref={$triggerRef}
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label={t("nav.open")}
          aria-expanded={isOpen}
          aria-controls="dashboard-nav-drawer"
          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-foreground transition-colors hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring"
        >
          <Menu className="size-4" aria-hidden="true" />
        </button>
        <p className="truncate text-lg font-semibold tracking-tight">
          {t("nav.wordmark")}
        </p>
        <LocaleToggle className="ms-auto" />
      </div>

      {/* `lg` and up: the column, unchanged. */}
      <aside className="hidden shrink-0 lg:flex lg:h-full lg:min-h-0 lg:w-60 lg:flex-col lg:gap-6 lg:border-e lg:border-white/5 lg:px-5 lg:py-6">
        <div className="flex items-center justify-center border-b border-white/5 pb-4">
          <p className="truncate text-xl font-semibold tracking-tight">
            {t("nav.wordmark")}
          </p>
        </div>

        <NavList
          activeTab={activeTab}
          indicatorLayoutId="dashboard-nav-indicator"
        />

        <div className="hidden lg:mt-auto lg:flex lg:flex-col lg:items-start lg:gap-3">
          <LocaleToggle />
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            {t("nav.footnote")}
          </p>
        </div>
      </aside>

      {/* Small screens: the drawer itself. */}
      <AnimatePresence>
        {isOpen ? (
          <div className="lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={panelTransition}
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              id="dashboard-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={t("nav.drawerLabel")}
              initial={{ x: offscreenX }}
              animate={{ x: 0 }}
              exit={{ x: offscreenX }}
              transition={panelTransition}
              className="fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] flex-col gap-6 border-e border-white/10 bg-background px-5 py-6"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
                <p className="truncate text-xl font-semibold tracking-tight">
                  {t("nav.wordmark")}
                </p>
                <button
                  ref={$closeRef}
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label={t("nav.close")}
                  className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-foreground transition-colors hover:bg-white/10 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>

              <NavList
                activeTab={activeTab}
                indicatorLayoutId="dashboard-nav-indicator-mobile"
                onSelect={() => setIsOpen(false)}
              />

              <div className="mt-auto flex flex-col items-start gap-3">
                <LocaleToggle />
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  {t("nav.footnote")}
                </p>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
