"use client";

import { useMemo, useState } from "react";

import { AqiBadge } from "@/components/aqi/AqiBadge";
import { AreaRankingChart } from "@/components/charts/AreaRankingChart";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  COMPARE_METRICS,
  formatDelta,
  formatMetricValue,
  metricMeta,
  valueForMetric,
  type CompareMetric,
} from "@/lib/aqi/compare";
import type { AreaReading, OverallSummary } from "@/lib/aqi/types";
import { compassDirection } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ComparePanelProps {
  areas: AreaReading[];
  overall: OverallSummary;
}

type SortMode = "worst" | "best" | "name";
type ViewMode = "chart" | "table";

const SORT_OPTIONS: ReadonlyArray<{ value: SortMode; label: string }> = [
  { value: "worst", label: "Worst first" },
  { value: "best", label: "Cleanest first" },
  { value: "name", label: "A → Z" },
];

const VIEW_OPTIONS: ReadonlyArray<{ value: ViewMode; label: string }> = [
  { value: "chart", label: "Chart" },
  { value: "table", label: "Table" },
];

/** A labelled segmented control, matching the pill language of the chips. */
function PillGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="flex rounded-full border border-white/10 bg-white/[0.04] p-0.5"
      >
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:bg-muted",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Side-by-side comparison of the monitored areas — the answer to "which areas
 * are cleaner or dirtier right now?". The user chooses which areas to compare
 * (all are on by default), which metric to rank them on, and which direction
 * to sort; the picked ones are ranked against the city average (AQI) or the
 * mean of the picked set (PM2.5 / PM10).
 */
export function ComparePanel({ areas, overall }: ComparePanelProps) {
  const [selectedUids, setSelectedUids] = useState<string[]>(() =>
    areas.map((area) => area.uid),
  );
  const [metric, setMetric] = useState<CompareMetric>("aqi");
  const [sort, setSort] = useState<SortMode>("worst");
  const [view, setView] = useState<ViewMode>("chart");

  const selected = useMemo(() => {
    const chosen = areas.filter((area) => selectedUids.includes(area.uid));
    return [...chosen].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      const aValue = valueForMetric(a, metric) ?? -Infinity;
      const bValue = valueForMetric(b, metric) ?? -Infinity;
      return sort === "worst" ? bValue - aValue : aValue - bValue;
    });
  }, [areas, selectedUids, metric, sort]);

  // Rows the plot and the "dirtiest / cleanest" callouts can actually stand
  // on: the metric was measured, so its value is a real number.
  const chartRows = useMemo(
    () => selected.filter((area) => valueForMetric(area, metric) != null),
    [selected, metric],
  );

  const reference = useMemo(() => {
    if (metric === "aqi") return overall.aqi;
    if (chartRows.length === 0) return 0;
    const total = chartRows.reduce(
      (sum, area) => sum + (valueForMetric(area, metric) as number),
      0,
    );
    return total / chartRows.length;
  }, [metric, overall, chartRows]);

  const referenceLabel = metric === "aqi" ? "city average" : "selected average";

  const extremes = useMemo(() => {
    if (chartRows.length === 0) return null;
    let worst = chartRows[0];
    let best = chartRows[0];
    for (const area of chartRows) {
      const value = valueForMetric(area, metric) as number;
      if (value > (valueForMetric(worst, metric) as number)) worst = area;
      if (value < (valueForMetric(best, metric) as number)) best = area;
    }
    return { worst, best };
  }, [chartRows, metric]);

  if (areas.length === 0) {
    return (
      <EmptyState
        title="No area data"
        description="No neighbourhood readings are available to compare."
      />
    );
  }

  const allSelected = selectedUids.length === areas.length;

  const toggleArea = (uid: string) => {
    setSelectedUids((previous) =>
      previous.includes(uid)
        ? previous.filter((candidate) => candidate !== uid)
        : [...previous, uid],
    );
  };

  const toggleAll = () => {
    setSelectedUids(allSelected ? [] : areas.map((area) => area.uid));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Area comparison</CardTitle>
        <CardDescription>
          Pick the neighbourhoods to compare, then rank them by AQI or a
          pollutant. Values are model-derived grid points (Open-Meteo), not
          physical stations.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div role="group" aria-label="Areas to compare">
          <button
            type="button"
            onClick={toggleAll}
            aria-pressed={allSelected}
            className="mr-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:bg-muted"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
          {areas.map((area) => {
            const active = selectedUids.includes(area.uid);
            return (
              <button
                key={area.uid}
                type="button"
                onClick={() => toggleArea(area.uid)}
                aria-pressed={active}
                className={cn(
                  "mr-2 mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-foreground/40 aria-pressed:bg-muted",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-2 rounded-full",
                    active ? "bg-foreground/70" : "bg-muted-foreground/40",
                  )}
                />
                {area.name}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <PillGroup label="Rank by" options={COMPARE_METRICS} value={metric} onChange={setMetric} />
          <PillGroup label="Sort" options={SORT_OPTIONS} value={sort} onChange={setSort} />
          <PillGroup label="View" options={VIEW_OPTIONS} value={view} onChange={setView} />
        </div>

        {selected.length === 0 ? (
          <EmptyState
            title="No areas selected"
            description="Select at least one neighbourhood above to see its readings."
          />
        ) : (
          <>
            {extremes ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Dirtiest
                  </p>
                  <p className="truncate text-sm font-medium">
                    {extremes.worst.name}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatMetricValue(
                      valueForMetric(extremes.worst, metric) as number,
                      metric,
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Cleanest
                  </p>
                  <p className="truncate text-sm font-medium">
                    {extremes.best.name}
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatMetricValue(
                      valueForMetric(extremes.best, metric) as number,
                      metric,
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Range
                  </p>
                  <p className="truncate text-sm font-medium">
                    {chartRows.length} areas
                  </p>
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {formatMetricValue(
                      (valueForMetric(extremes.worst, metric) as number) -
                        (valueForMetric(extremes.best, metric) as number),
                      metric,
                    )}
                  </p>
                </div>
              </div>
            ) : null}

            {view === "chart" ? (
              <AreaRankingChart
                areas={selected}
                metric={metric}
                reference={reference}
                referenceLabel={referenceLabel}
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="sticky top-0 z-10 bg-background/80 py-2 pl-3 pr-4 font-medium backdrop-blur">
                        #
                      </th>
                      <th className="sticky top-0 z-10 bg-background/80 py-2 pr-4 font-medium backdrop-blur">
                        Area
                      </th>
                      <th className="sticky top-0 z-10 bg-background/80 py-2 pr-4 text-right font-medium backdrop-blur">
                        vs avg
                      </th>
                      <th className="sticky top-0 z-10 bg-background/80 py-2 pr-4 font-medium backdrop-blur">
                        AQI
                      </th>
                      <th className="sticky top-0 z-10 bg-background/80 py-2 pr-4 text-right font-medium backdrop-blur">
                        PM2.5
                      </th>
                      <th className="sticky top-0 z-10 bg-background/80 py-2 pr-4 text-right font-medium backdrop-blur">
                        PM10
                      </th>
                      <th className="sticky top-0 z-10 bg-background/80 py-2 pr-4 text-right font-medium backdrop-blur">
                        Temp
                      </th>
                      <th className="sticky top-0 z-10 bg-background/80 py-2 pr-4 text-right font-medium backdrop-blur">
                        Humidity
                      </th>
                      <th className="sticky top-0 z-10 bg-background/80 py-2 pr-3 text-right font-medium backdrop-blur">
                        Wind
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.map((area, index) => {
                      const value = valueForMetric(area, metric);
                      const delta =
                        value != null ? value - reference : null;
                      return (
                        <tr
                          key={area.uid}
                          className="border-b last:border-0"
                        >
                          <td className="py-2 pl-3 pr-4 text-xs tabular-nums text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="py-2 pr-4 font-medium">
                            {area.name}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {delta != null ? formatDelta(delta, metric) : "—"}
                          </td>
                          <td className="py-2 pr-4">
                            <AqiBadge aqi={area.aqi} showValue />
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {area.pm25 != null
                              ? `${area.pm25.toFixed(1)}`
                              : "—"}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {area.pm10 != null
                              ? `${area.pm10.toFixed(1)}`
                              : "—"}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {area.temperatureC != null
                              ? `${area.temperatureC.toFixed(1)} °C`
                              : "—"}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {area.humidityPct != null
                              ? `${Math.round(area.humidityPct)}%`
                              : "—"}
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums">
                            {area.windSpeedMs != null
                              ? `${area.windSpeedMs.toFixed(1)} m/s ${
                                  compassDirection(area.windDirectionDeg) ?? ""
                                }`
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">
              {chartRows.length} of {areas.length} areas shown by{" "}
              {metricMeta(metric).label} ·{" "}
              {sort === "name"
                ? "sorted by name"
                : sort === "worst"
                  ? "dirtiest first"
                  : "cleanest first"}
              · deltas vs {referenceLabel}{" "}
              {formatMetricValue(reference, metric)}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}