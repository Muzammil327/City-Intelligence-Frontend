import { formatHour } from "../format";
import type { CurrentReading } from "./types";
import { getSeverityBand } from "./severity";
import type { BestWindow } from "./best-time";
import type { TrendSummary } from "./trend";

/**
 * Practical, informational guidance based on the current AQI and the forecast.
 *
 * This is lifestyle advice, not personalised medical advice: it names the
 * band's general EPA guidance, watches the trend and the relatively better
 * window, and says so. It never claims to know a user's health.
 */

export interface Recommendation {
  id: string;
  /** The kind of guidance, so the UI can group or icon it. */
  kind: "activity" | "exercise" | "exposure" | "sensitive" | "timing";
  title: string;
  detail: string;
}

export function recommendationsFor(
  current: CurrentReading | null,
  trend: TrendSummary | null,
  bestWindow: BestWindow | null,
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (!current) return recommendations;

  const band = getSeverityBand(current.aqi);

  recommendations.push({
    id: `activity-${band.id}`,
    kind: "activity",
    title: "Outdoor activity",
    detail: band.advice,
  });

  if (current.aqi >= 151) {
    recommendations.push({
      id: "exercise-avoid",
      kind: "exercise",
      title: "Exercise",
      detail:
        "Avoid strenuous outdoor exercise. Choose indoor sessions and keep intensity low.",
    });
  } else if (current.aqi >= 101) {
    recommendations.push({
      id: "exercise-limit",
      kind: "exercise",
      title: "Exercise",
      detail:
        "Limit prolonged or heavy outdoor exertion, especially if you are in a sensitive group.",
    });
  } else {
    recommendations.push({
      id: "exercise-ok",
      kind: "exercise",
      title: "Exercise",
      detail:
        "Outdoor exercise is generally fine, though very active people may still feel it in the moderate range.",
    });
  }

  if (bestWindow) {
    recommendations.push({
      id: "timing-window",
      kind: "timing",
      title: "Plan around the better window",
      // Clock times, not ISO stamps: this string is read by a person.
      // The category belongs to the window's *peak* hour, so it is named
      // as the peak rather than pinned to the average beside it.
      detail: `Cleanest stretch is ${formatHour(bestWindow.start)}–${formatHour(bestWindow.end)}, averaging AQI ${bestWindow.averageAqi} with a peak of ${bestWindow.peakAqi} (${bestWindow.category.toLowerCase()}).`,
    });
  }

  if (trend && trend.direction === "increasing") {
    recommendations.push({
      id: "timing-rising",
      kind: "timing",
      title: "Air is getting worse",
      detail: `Pollution is rising (${trend.deltaAqi} points over the last ${trend.sampleHours} hours). If you can, do outdoor tasks sooner rather than later.`,
    });
  }

  if (current.aqi >= 101) {
    recommendations.push({
      id: "exposure-reduce",
      kind: "exposure",
      title: "Reduce exposure",
      detail:
        "Keep windows closed in peak hours, avoid time on heavy-traffic roads, and take breaks indoors if you feel affected.",
    });
  }

  return recommendations;
}