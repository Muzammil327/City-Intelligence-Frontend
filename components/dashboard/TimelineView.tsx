import type { ForecastPoint, HistoryPoint } from "@/lib/aqi/types";
import { getSeverityBand } from "@/lib/aqi/severity";
import { formatHour } from "@/lib/format";

interface TimelineViewProps {
  history: HistoryPoint[];
  forecast: ForecastPoint[];
  /** How many recent observed hours to show. */
  hours?: number;
}

interface TimelineRow {
  timestamp: string;
  aqi: number;
  predicted: boolean;
}

/**
 * A daily AQI timeline. Observed hours come from real stored data; where the
 * forecast extends beyond them it is shown with an explicit marker, so a
 * prediction is never read as a measurement.
 */
export function TimelineView({
  history,
  forecast,
  hours = 24,
}: TimelineViewProps) {
  const observed: TimelineRow[] = [...history]
    .slice(0, hours)
    .map((point) => ({
      timestamp: point.observedAt,
      aqi: point.aqi,
      predicted: false,
    }));

  const withoutLatest: ForecastPoint[] =
    forecast[forecast.length - 1]?.predictedFor === observed[0]?.timestamp
      ? forecast.slice(1)
      : forecast;

  const predicted: TimelineRow[] = withoutLatest.map((point) => ({
    timestamp: point.predictedFor,
    aqi: point.aqi,
    predicted: true,
  }));

  // Chronological, observed first.
  const rows = [...observed, ...predicted].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
  );

  if (rows.length === 0) {
    return null;
  }

  return (
    <ol className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
      {rows.map((row) => {
        const band = getSeverityBand(row.aqi);
        return (
          <li
            key={row.timestamp}
            className="flex items-center gap-2 border-b py-1 text-sm last:border-0"
          >
            <span className="w-10 shrink-0 tabular-nums text-muted-foreground">
              {formatHour(row.timestamp)}
            </span>
            <span
              className={`${band.className} size-2 shrink-0 rounded-full`}
              aria-hidden="true"
            />
            <span className="font-mono tabular-nums">{row.aqi}</span>
            {row.predicted ? (
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                predicted
              </span>
            ) : null}
            <span className="sr-only">{band.label}</span>
          </li>
        );
      })}
    </ol>
  );
}