import {
  BarChart3,
  Bell,
  Flame,
  Gauge,
  History,
  LayoutDashboard,
  MapPin,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { MessageKey } from "@/lib/i18n/messages";

/**
 * The dashboard's views, in nav order.
 *
 * Overview is a summary plus today's guidance — one headline, the summary
 * tiles and the recommendations panel. The other tabs hold each subject's
 * depth: how it changes (Trends), where exactly (Map), the raw numbers
 * (Compare), and what could change it (Plan).
 *
 * `headerTitleKey` overrides the page heading for a view whose nav label reads
 * differently at the top of the page; `descriptionKey` is the line under it.
 *
 * The three carry message keys rather than English, because this list is the
 * nav in both languages. The text itself lives in `lib/i18n/messages/*.json`,
 * which is the only place any of it is written down.
 *
 * Shared between the nav and the view because `value` is now a URL: it appears
 * in `?tab=`, so the list of valid values has to be checkable from one place.
 */
export interface DashboardTab {
  value: string;
  labelKey: MessageKey;
  headerTitleKey?: MessageKey;
  descriptionKey?: MessageKey;
}

export const TABS: readonly DashboardTab[] = [
  {
    value: "overview",
    labelKey: "tabs.overview.label",
    headerTitleKey: "tabs.overview.headerTitle",
  },
  {
    value: "trend",
    labelKey: "tabs.trend.label",
    descriptionKey: "tabs.trend.description",
  },
  {
    value: "stations",
    labelKey: "tabs.stations.label",
    descriptionKey: "tabs.stations.description",
  },
  {
    value: "hotspots",
    labelKey: "tabs.hotspots.label",
    descriptionKey: "tabs.hotspots.description",
  },
  {
    value: "alerts",
    labelKey: "tabs.alerts.label",
    descriptionKey: "tabs.alerts.description",
  },
  {
    value: "compare",
    labelKey: "tabs.compare.label",
    descriptionKey: "tabs.compare.description",
  },
  {
    value: "history",
    labelKey: "tabs.history.label",
    descriptionKey: "tabs.history.description",
  },
  {
    value: "accuracy",
    labelKey: "tabs.accuracy.label",
    descriptionKey: "tabs.accuracy.description",
  },
  {
    value: "plan",
    labelKey: "tabs.plan.label",
    descriptionKey: "tabs.plan.description",
  },
] as const;

export const TAB_ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  trend: TrendingUp,
  stations: MapPin,
  hotspots: Flame,
  alerts: Bell,
  compare: BarChart3,
  history: History,
  accuracy: Gauge,
  plan: Target,
};

export const DEFAULT_TAB = TABS[0].value;

/**
 * Whether a value names a real view.
 *
 * `?tab=` is user-supplied, so it is checked rather than trusted: an unknown
 * value falls back to the default instead of rendering a page with no content.
 */
export function isTabValue(value: string | null | undefined): value is string {
  return typeof value === "string" && TABS.some((tab) => tab.value === value);
}

/** The tab a value names, or the default when it names nothing. */
export function tabFor(value: string | null | undefined): DashboardTab {
  return TABS.find((tab) => tab.value === value) ?? TABS[0];
}
