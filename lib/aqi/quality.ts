import type { CurrentReading } from "./types";

/**
 * Data-quality states. Nothing here lets old or incomplete data look live -
 * the status is derived from the reading's own age, staleness flag and source.
 */

export type QualityStatus =
  | "live"
  | "recent"
  | "stale"
  | "limited"
  | "unavailable";

export interface DataQuality {
  status: QualityStatus;
  /** Short human label for a badge. */
  label: string;
  /** One line of explanation written for a person. */
  detail: string;
  /** ISO-8601 timestamp of the underlying reading, if any. */
  lastUpdated: string | null;
}

export function qualityFor(
  current: CurrentReading | null,
  hasAreas: boolean,
): DataQuality {
  if (!current) {
    return {
      status: "unavailable",
      label: "Data Unavailable",
      detail: "No current reading could be loaded.",
      lastUpdated: null,
    };
  }

  if (current.isStale) {
    return {
      status: "stale",
      label: "Stale",
      detail: `The last reading is ${Math.round(current.ageHours)} hours old — do not treat it as live.`,
      lastUpdated: current.observedAt,
    };
  }

  // The newest area readings can trail the headline, but coarser data is still
  // a signal of a limited picture, not a lack of one.
  if (!hasAreas) {
    return {
      status: "limited",
      label: "Limited Data",
      detail: "The city headline is live, but no neighbourhood-level data is available.",
      lastUpdated: current.observedAt,
    };
  }

  if (current.ageHours < 1) {
    return {
      status: "live",
      label: "Live",
      detail: `Last updated ${Math.round(current.ageHours * 60)} minutes ago.`,
      lastUpdated: current.observedAt,
    };
  }

  return {
    status: "recent",
    label: "Recently Updated",
    detail: `Last updated ${current.ageHours.toFixed(1)} hours ago.`,
    lastUpdated: current.observedAt,
  };
}