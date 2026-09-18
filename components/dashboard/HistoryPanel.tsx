"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { SeverityLegend } from "@/components/aqi/SeverityLegend";
import { HistoryLineChart } from "@/components/charts/HistoryLineChart";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { aqiQueryKeys, fetchHistory } from "@/lib/aqi/api";
import { getSeverityBand } from "@/lib/aqi/severity";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "24 h", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "14 days", hours: 336 },
  { label: "30 days", hours: 720 },
] as const;

/**
 * The stored record — every observed hourly reading, browsable over a 24-hour
 * or 7-day window, with an explicit observed/predicted split in the timeline.
 */
export function HistoryPanel() {
  const [rangeHours, setRangeHours] = useState(24);

  const historyQuery = useQuery({
    queryKey: aqiQueryKeys.history(rangeHours),
    queryFn: () => fetchHistory(rangeHours),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Historical records</CardTitle>
            <CardDescription>
              Observed hourly AQI from stored readings and the Open-Meteo
              archive — measurements only, no predictions.
            </CardDescription>
          </div>
          <div
            role="tablist"
            aria-label="History range"
            className="inline-flex flex-wrap rounded-lg border p-0.5"
          >
            {RANGES.map(({ label, hours }) => (
              <button
                key={hours}
                type="button"
                role="tab"
                aria-selected={rangeHours === hours}
                onClick={() => setRangeHours(hours)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium",
                  rangeHours === hours
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {historyQuery.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : historyQuery.isError ? (
          <ErrorState
            title="History unavailable"
            description="The historical readings could not be loaded."
            onRetry={() => void historyQuery.refetch()}
          />
        ) : historyQuery.data && historyQuery.data.readings.length === 0 ? (
          <EmptyState
            title="No readings recorded yet"
            description="Once the service has stored a few hours of data, they will appear here."
          />
        ) : historyQuery.data ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2 text-xs text-muted-foreground">
              <p>
                {historyQuery.data.count} recorded readings
                {historyQuery.data.sources.stored
                  ? ` · ${historyQuery.data.sources.stored} from this service`
                  : ""}
                {historyQuery.data.sources["open-meteo-archive"]
                  ? ` · ${historyQuery.data.sources["open-meteo-archive"]} from the archive`
                  : ""}
              </p>
              <p>
                Newest:{" "}
                {formatDateTime(historyQuery.data.readings[0]?.observedAt ?? "")}
                {" · "}
                Oldest present:{" "}
                {formatDateTime(
                  historyQuery.data.readings[
                    historyQuery.data.readings.length - 1
                  ]?.observedAt ?? "",
                )}
              </p>
            </div>

            <HistoryLineChart
              history={historyQuery.data.readings}
              hours={rangeHours}
            />
            <SeverityLegend />

            <details className="group/details">
              <summary className="cursor-pointer list-none text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <span className="group-open/details:hidden">
                  Show hourly readings table
                </span>
                <span className="hidden group-open/details:inline">
                  Hide hourly readings table
                </span>
              </summary>

              <div className="mt-4 rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Time</th>
                      <th className="px-3 py-2 font-medium">AQI</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyQuery.data.readings.map((point) => (
                      <tr key={point.observedAt} className="border-b last:border-0">
                        <td className="px-3 py-1.5 tabular-nums">
                          {formatDateTime(point.observedAt)}
                        </td>
                        <td className="px-3 py-1.5 tabular-nums">
                          {point.aqi}
                        </td>
                        <td className="px-3 py-1.5">
                          {getSeverityBand(point.aqi).label}
                        </td>
                        <td className="px-3 py-1.5 text-xs text-muted-foreground">
                          {point.source === "stored"
                            ? "recorded"
                            : "archive"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}