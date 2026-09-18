"use client";

import { useQuery } from "@tanstack/react-query";

import { AqiBadge } from "@/components/aqi/AqiBadge";
import { ErrorState } from "@/components/common/ErrorState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { aqiQueryKeys, failureMessage, fetchStations } from "@/lib/aqi/api";
import { formatDateTime } from "@/lib/format";

/**
 * Physical monitoring stations, as distinct from the modelled neighbourhood
 * points above them.
 *
 * An empty list is the expected answer and is treated as information rather
 * than as a failure: WAQI lists no active station in Lahore, and saying so
 * plainly is what justifies the modelled points being there at all. A station
 * that does report is shown with its reading's age, because a stale index
 * presented without one reads as current.
 */
export function ReferenceStationsPanel() {
  const stationsQuery = useQuery({
    queryKey: aqiQueryKeys.stations(),
    queryFn: fetchStations,
  });

  const stations = stationsQuery.data?.stations ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reference stations</CardTitle>
        <CardDescription>
          Physical monitoring hardware reported for Lahore — measured air, not
          modelled.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {stationsQuery.isPending ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : stationsQuery.isError ? (
          <ErrorState
            title="Stations unavailable"
            description={failureMessage(
              stationsQuery.error,
              "The station list could not be loaded.",
            )}
            onRetry={() => void stationsQuery.refetch()}
          />
        ) : stations.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6">
            <p className="text-sm font-medium">No reporting stations</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              No active monitoring station is reported for Lahore. That absence
              is why the neighbourhood points above are read from Open-Meteo’s
              gridded model — there is no physical sensor network here to read
              instead.
            </p>
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {stations.map((station) => (
              <li
                key={station.uid}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{station.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {station.observedAt
                      ? `Observed ${formatDateTime(station.observedAt)}`
                      : "No reading reported"}
                  </p>
                </div>
                {station.aqi != null ? (
                  <AqiBadge aqi={station.aqi} showValue />
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    —
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
