"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";

import { AqiBadge } from "@/components/aqi/AqiBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { aqiQueryKeys, fetchAreas } from "@/lib/aqi/api";
import { compassDirection, formatDateTime } from "@/lib/format";
import type { AreaReading } from "@/lib/aqi/types";

/**
 * The monitoring network as a list. Lahore has no official sensor stations, so
 * each "station" here is a real neighbourhood coordinate read from a gridded
 * air model. Filter by name, then pick one to read its full reading.
 *
 * The map lives on its own tab as `StationMapPanel`, which always shows every
 * point — this filter is local to the list.
 */
export function StationPanel() {
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const areasQuery = useQuery({
    queryKey: aqiQueryKeys.areas(),
    queryFn: fetchAreas,
  });

  if (areasQuery.isPending) {
    return <Skeleton className="h-[420px] w-full rounded-lg" />;
  }

  if (areasQuery.isError) {
    return (
      <ErrorState
        title="Stations unavailable"
        description="The monitoring network could not be loaded."
        onRetry={() => void areasQuery.refetch()}
      />
    );
  }

  const stations: AreaReading[] = areasQuery.data?.areas ?? [];
  if (stations.length === 0) {
    return (
      <EmptyState
        title="No stations reporting"
        description="Once a monitoring point reports a reading, it will appear here."
      />
    );
  }

  const term = query.trim().toLowerCase();
  const visible = term
    ? stations.filter((station) =>
        station.name.toLowerCase().includes(term),
      )
    : stations;

  const selected =
    visible.find((station) => station.uid === selectedUid) ??
    (visible[0] as AreaReading);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neighbourhood points</CardTitle>
        <CardDescription>
          One model grid point per neighbourhood — not physical sensors. Filter
          the list, then pick one to read its full picture.
        </CardDescription>
      </CardHeader>

      {/* List on the left, the selected station's reading on the right. */}
      <CardContent className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-4">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stations by name…"
              aria-label="Search monitoring stations"
              className="pl-8"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {visible.length} of {stations.length} stations
            {term ? ` matching “${query.trim()}”` : ""}
          </p>

          {visible.length === 0 ? (
            <EmptyState
              title="No matching stations"
              description="Try a different name — for example “Gulberg” or “DHA”."
            />
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {visible.map((station) => {
                const isSelected = station.uid === selected.uid;
                return (
                  <li key={station.uid}>
                    <button
                      type="button"
                      onClick={() => setSelectedUid(station.uid)}
                      aria-pressed={isSelected}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted/50 aria-pressed:border-foreground/40 aria-pressed:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {station.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          PM2.5{" "}
                          {station.pm25 != null
                            ? `${station.pm25.toFixed(1)} µg/m³`
                            : "—"}
                        </span>
                      </span>
                      <AqiBadge aqi={station.aqi} showValue />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {visible.length > 0 ? <StationDetail station={selected} /> : null}
      </CardContent>
    </Card>
  );
}

function StationDetail({ station }: { station: AreaReading }) {
  const metrics = [
    { label: "PM2.5", value: station.pm25, unit: "µg/m³" },
    { label: "PM10", value: station.pm10, unit: "µg/m³" },
    { label: "Temperature", value: station.temperatureC, unit: "°C" },
    { label: "Humidity", value: station.humidityPct, unit: "%" },
    {
      label: "Wind",
      value: station.windSpeedMs,
      unit: "m/s",
      suffix: compassDirection(station.windDirectionDeg) ?? "",
    },
  ];

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-medium">{station.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Updated {formatDateTime(station.observedAt)} ·{" "}
            {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
          </p>
        </div>
        <AqiBadge aqi={station.aqi} showValue />
      </div>

      <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="flex items-baseline justify-between border-b pb-1.5 text-sm last:border-0"
          >
            <dt className="text-muted-foreground">{metric.label}</dt>
            <dd className="tabular-nums">
              {metric.value != null
                ? `${metric.value.toFixed(1)} ${metric.unit}${
                    metric.suffix ? ` ${metric.suffix}` : ""
                  }`
                : "—"}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">
        Model grid point read from Open-Meteo at this neighbourhood’s real
        coordinates — not a physical sensor. There is no official Lahore
        monitoring network to attach a station name to.
      </p>
    </div>
  );
}