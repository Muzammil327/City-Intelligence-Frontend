import type { ForecastPoint } from "./types";

/**
 * The relatively better slot to be outside over the forecast horizon.
 *
 * This is found in the data, never hardcoded: contiguous runs of forecast hours
 * are compared and the run with the lowest average AQI wins. When the whole
 * horizon is poor the answer is honest about it — the window is the *least bad*
 * one, with its actual expected category — rather than pretending there is a
 * clean-air window that does not exist.
 */

export interface BestWindow {
  /** ISO-8601 timestamps of the window's first and last hour. */
  start: string;
  end: string;
  hours: number;
  averageAqi: number;
  peakAqi: number;
  category: string;
}

const HOUR_MS = 60 * 60 * 1000;
/** A window must be at least this many hours to be worth planning around. */
const MIN_WINDOW_HOURS = 2;

export function bestOutsideWindow(
  forecast: ForecastPoint[],
): BestWindow | null {
  const ordered = [...forecast].sort(
    (a, b) => Date.parse(a.predictedFor) - Date.parse(b.predictedFor),
  );
  if (ordered.length === 0) return null;

  // Split the horizon into contiguous runs (gap larger than one hour breaks it).
  const runs: ForecastPoint[][] = [];
  let current: ForecastPoint[] = [ordered[0] as ForecastPoint];
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1] as ForecastPoint;
    const point = ordered[index] as ForecastPoint;
    const gap =
      Date.parse(point.predictedFor) - Date.parse(previous.predictedFor);
    if (gap > HOUR_MS + 60_000) {
      runs.push(current);
      current = [];
    }
    current.push(point);
  }
  runs.push(current);

  const eligible = runs.filter((run) => run.length >= MIN_WINDOW_HOURS);
  if (eligible.length === 0) return null;

  let best: ForecastPoint[] = eligible[0] as ForecastPoint[];
  for (const run of eligible) {
    const runAvg = average(run);
    const bestAvg = average(best);
    if (runAvg < bestAvg) {
      best = run;
    } else if (runAvg === bestAvg && run.length > best.length) {
      best = run;
    }
  }

  const first = best[0] as ForecastPoint;
  const last = best[best.length - 1] as ForecastPoint;
  const peak = Math.max(...best.map((point) => point.aqi));

  return {
    start: first.predictedFor,
    end: last.predictedFor,
    hours: best.length,
    averageAqi: Math.round(average(best)),
    peakAqi: peak,
    // The category of the *peak* hour, because that is the air a person would
    // actually meet; a low mean over a single ugly spike would mislead.
    category: best.reduce(
      (worst, point) => (point.aqi > worst.aqi ? point : worst),
      first,
    ).category,
  };
}

function average(points: ForecastPoint[]): number {
  return (
    points.reduce((sum, point) => sum + point.aqi, 0) / points.length
  );
}