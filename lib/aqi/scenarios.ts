/**
 * Planning scenarios — the "what would happen if" model.
 *
 * A scenario is a set of mitigation measures, each at an intensity from 0
 * (not implemented) to 100 (fully implemented). Measures combine with
 * diminishing returns — two 30% measures do not add to 60%, they compound —
 * which is the honest shape for cutting a shared pollutant from several
 * sources. Nothing here is a prediction: it is an arithmetic estimate built
 * only from the measures themselves, and the UI says so.
 */

import { aqiFromPm25 } from "./pm25";
import { getSeverityBand, SEVERITY_BANDS } from "./severity";
import type { AreaReading } from "./types";

/** One lever a planner can pull, with the largest PM2.5 cut it can deliver. */
export interface MitigationMeasure {
  id: string;
  label: string;
  description: string;
  /** % of baseline PM2.5 this measure removes at full (100%) intensity. */
  maxReductionPct: number;
}

export const MITIGATION_MEASURES: readonly MitigationMeasure[] = [
  {
    id: "traffic",
    label: "Cut vehicle emissions",
    description:
      "Cleaner fuels, public-transport priority and low-emission zones.",
    maxReductionPct: 25,
  },
  {
    id: "industry",
    label: "Clean up industry",
    description:
      "Flue scrubbers, fuel switching and tighter stack limits.",
    maxReductionPct: 20,
  },
  {
    id: "dust",
    label: "Suppress construction & road dust",
    description:
      "Watering active sites and wet-sweeping streets so settled dust stays down.",
    maxReductionPct: 15,
  },
  {
    id: "burning",
    label: "Stop open waste & crop burning",
    description:
      "Collection, enforcement and alternatives to burning in the open.",
    maxReductionPct: 14,
  },
  {
    id: "greenery",
    label: "Expand green cover",
    description:
      "Street trees and parks that intercept and settle particulates.",
    maxReductionPct: 10,
  },
];

/** measure id → intensity (0–100). */
export type ScenarioInput = Record<string, number>;

/** A scenario with every measure off — the "as it is now" state. */
export function emptyScenario(): ScenarioInput {
  const result: ScenarioInput = {};
  for (const measure of MITIGATION_MEASURES) {
    result[measure.id] = 0;
  }
  return result;
}

/** A scenario with every measure at full intensity — the ceiling reference. */
export function fullScenario(): ScenarioInput {
  const result: ScenarioInput = {};
  for (const measure of MITIGATION_MEASURES) {
    result[measure.id] = 100;
  }
  return result;
}

/** Intensities outside 0–100 (over-typed, NaN) clamp to the range. */
export function clampIntensity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * The combined PM2.5 reduction of a scenario, as a percentage of baseline.
 *
 * Measures compound rather than add: each leaves the pollutant fraction the
 * others have not yet removed, so total reduction approaches but never
 * exceeds a floor set by the measures themselves.
 */
export function totalReductionPct(scenario: ScenarioInput): number {
  let remaining = 1;
  for (const measure of MITIGATION_MEASURES) {
    const intensity = clampIntensity(scenario[measure.id] ?? 0) / 100;
    remaining *= 1 - intensity * (measure.maxReductionPct / 100);
  }
  return (1 - remaining) * 100;
}

/** PM2.5 after a percentage reduction never goes below zero. */
export function projectPm25(
  basePm25: number | null,
  reductionPct: number,
): number | null {
  if (basePm25 == null || !Number.isFinite(basePm25)) return null;
  return Math.max(0, basePm25 * (1 - reductionPct / 100));
}

/** Scale a concentration by a pm25 factor, kept to one decimal. */
function scale(value: number | null, factor: number): number | null {
  if (value == null || !Number.isFinite(factor)) return null;
  return Math.round(value * factor * 10) / 10;
}

/**
 * The same area under a scenario, as a full reading — so the existing chart
 * components can draw it without knowing anything about scenarios.
 */
export function projectedAreaReading(
  area: AreaReading,
  reductionPct: number,
): AreaReading {
  const projectedPm25 = projectPm25(area.pm25, reductionPct);
  const factor = area.pm25 != null ? (projectedPm25 ?? 0) / area.pm25 : 1;
  return {
    ...area,
    source: "scenario (sample)",
    aqi: projectedPm25 != null ? aqiFromPm25(projectedPm25) : area.aqi,
    pm25: projectedPm25,
    pm10: scale(area.pm10, factor),
  };
}

/** Position in the severity scale, so "improved band" is a real comparison. */
function bandIndex(aqi: number): number {
  const id = getSeverityBand(aqi).id;
  const index = SEVERITY_BANDS.findIndex((band) => band.id === id);
  return index < 0 ? SEVERITY_BANDS.length : index;
}

/** One area's before/after under a scenario. */
export interface ProjectedAreaSweep {
  uid: string;
  name: string;
  basePm25: number | null;
  baseAqi: number;
  baseCategory: string;
  projectedPm25: number | null;
  projectedAqi: number;
  projectedCategory: string;
  deltaAqi: number;
  /** True when the projected reading sits in a cleaner severity band. */
  bandImproved: boolean;
}

/** The city-level before/after, from the mean concentration like `/areas`. */
export interface ScenarioOverview {
  basePm25: number | null;
  baseAqi: number;
  baseCategory: string;
  projectedPm25: number | null;
  projectedAqi: number;
  projectedCategory: string;
  deltaAqi: number;
  bandImproved: boolean;
}

export interface ScenarioResult {
  reductionPct: number;
  overall: ScenarioOverview;
  areas: ProjectedAreaSweep[];
  /** How many of the monitored areas reach a cleaner severity band. */
  areasImprovedBand: number;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function meanOfNullables(values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value != null);
  return mean(present);
}

/**
 * Project every area under the scenario and roll up the city summary. Returns
 * null for an empty area list — there is nothing to plan from.
 */
export function computeScenario(
  areas: AreaReading[],
  scenario: ScenarioInput,
): ScenarioResult | null {
  if (areas.length === 0) return null;

  const reductionPct = totalReductionPct(scenario);

  const sweeps: ProjectedAreaSweep[] = areas.map((area) => {
    const projectedPm25 = projectPm25(area.pm25, reductionPct);
    const projectedAqi =
      projectedPm25 != null ? aqiFromPm25(projectedPm25) : area.aqi;
    return {
      uid: area.uid,
      name: area.name,
      basePm25: area.pm25,
      baseAqi: area.aqi,
      baseCategory: getSeverityBand(area.aqi).label,
      projectedPm25,
      projectedAqi,
      projectedCategory: getSeverityBand(projectedAqi).label,
      deltaAqi: projectedAqi - area.aqi,
      bandImproved: bandIndex(projectedAqi) < bandIndex(area.aqi),
    };
  });

  const basePm25 = meanOfNullables(areas.map((area) => area.pm25));
  const projectedPm25 = meanOfNullables(
    sweeps.map((sweep) => sweep.projectedPm25),
  );
  const baseAqi =
    basePm25 != null
      ? aqiFromPm25(basePm25)
      : Math.round(mean(areas.map((area) => area.aqi)) ?? 0);
  const projectedAqi =
    projectedPm25 != null
      ? aqiFromPm25(projectedPm25)
      : Math.round(mean(sweeps.map((sweep) => sweep.projectedAqi)) ?? 0);

  const overall: ScenarioOverview = {
    basePm25,
    baseAqi,
    baseCategory: getSeverityBand(baseAqi).label,
    projectedPm25,
    projectedAqi,
    projectedCategory: getSeverityBand(projectedAqi).label,
    deltaAqi: projectedAqi - baseAqi,
    bandImproved: bandIndex(projectedAqi) < bandIndex(baseAqi),
  };

  return {
    reductionPct,
    overall,
    areas: sweeps,
    areasImprovedBand: sweeps.filter((sweep) => sweep.bandImproved).length,
  };
}