import {
  BarChart3,
  Bell,
  Flame,
  Gauge,
  HeartPulse,
  History,
  LayoutDashboard,
  MapPin,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

/**
 * The dashboard's views, in nav order.
 *
 * Overview is a summary only — one headline and four cards that point at the
 * tab holding that subject's depth: how it changes (Trends), where exactly
 * (Map), what it means for you (Guidance), the raw numbers (Compare), and what
 * could change it (Plan).
 *
 * `headerTitle` overrides the page heading for a view whose nav label reads
 * differently at the top of the page; `description` is the line under it.
 *
 * Shared between the nav and the view because `value` is now a URL: it appears
 * in `?tab=`, so the list of valid values has to be checkable from one place.
 */
export interface DashboardTab {
  value: string;
  label: string;
  headerTitle?: string;
  description?: string;
}

export const TABS: readonly DashboardTab[] = [
  { value: "overview", label: "Overview", headerTitle: "Dashboard" },
  {
    value: "trend",
    label: "Trends",
    description: "How the city's air is moving, hour by hour.",
  },
  {
    value: "stations",
    label: "Stations",
    description:
      "Every monitoring point on the map — pick one to read its full picture.",
  },
  {
    value: "hotspots",
    label: "Hotspots",
    description:
      "The neighbourhoods with the worst air, and which species are driving it.",
  },
  {
    value: "guidance",
    label: "Guidance",
    description: "What to do outdoors today, and when.",
  },
  {
    value: "alerts",
    label: "Alerts",
    description: "Every threshold the current air has crossed.",
  },
  {
    value: "compare",
    label: "Compare",
    description: "The raw numbers across every neighbourhood.",
  },
  {
    value: "history",
    label: "History",
    description: "The stored record of observed hourly readings.",
  },
  {
    value: "accuracy",
    label: "Model accuracy",
    description:
      "How close the forecast has been, and how that has changed over time.",
  },
  {
    value: "plan",
    label: "Plan",
    description: "Model what mitigation scenarios could do to the air.",
  },
] as const;

export const TAB_ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  trend: TrendingUp,
  stations: MapPin,
  hotspots: Flame,
  guidance: HeartPulse,
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
