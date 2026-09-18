"use client";

import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { AreasMapPanel } from "@/components/map/AreasMapPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { aqiQueryKeys, fetchAreas } from "@/lib/aqi/api";

/**
 * The city map on its own: every monitoring point, unfiltered.
 *
 * It reads `aqiQueryKeys.areas()` — the same key `StationPanel` uses — so the
 * two tabs share one cached response instead of fetching the list twice.
 */
export function StationMapPanel() {
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
        title="Map unavailable"
        description="The monitoring network could not be loaded."
        onRetry={() => void areasQuery.refetch()}
      />
    );
  }

  const stations = areasQuery.data?.areas ?? [];
  if (stations.length === 0) {
    return (
      <EmptyState
        title="No stations reporting"
        description="Once a monitoring point reports a reading, it will appear on the map."
      />
    );
  }

  return <AreasMapPanel areas={stations} />;
}
