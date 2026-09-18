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
import { compassDirection } from "@/lib/format";
import type { AreaReading, OverallSummary } from "@/lib/aqi/types";
import { cn } from "@/lib/utils";

interface ComparePanelProps {
  areas: AreaReading[];
  overall: OverallSummary;
}

/**
 * Side-by-side comparison of the monitored areas — the answer to "which areas
 * are cleaner or dirtier right now?". The user chooses which areas to compare
 * (all are on by default); the picked ones are ranked worst-first against the
 * city average as the reference line.
 */
export function ComparePanel({ areas, overall }: ComparePanelProps) {
  const [selectedUids, setSelectedUids] = useState<string[]>(() =>
    areas.map((area) => area.uid),
  );

  const selected = useMemo(() => {
    const chosen = areas.filter((area) => selectedUids.includes(area.uid));
    return [...chosen].sort((a, b) => b.aqi - a.aqi);
  }, [areas, selectedUids]);

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
          Pick the neighbourhoods to compare. Values are model-derived grid
          points (Open-Meteo), not physical stations.
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

        {selected.length === 0 ? (
          <EmptyState
            title="No areas selected"
            description="Select at least one neighbourhood above to see its readings."
          />
        ) : (
          <>
            <AreaRankingChart areas={selected} cityAqi={overall.aqi} />
            <p className="font-mono text-[10px] text-muted-foreground">
              {selected.length} of {areas.length} areas shown · sorted worst to
              cleanest against the city average
            </p>

            <details className="group/details">
              <summary className="cursor-pointer list-none text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                <span className="group-open/details:hidden">
                  Show full readings
                </span>
                <span className="hidden group-open/details:inline">
                  Hide full readings
                </span>
              </summary>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Area</th>
                      <th className="py-2 pr-4 font-medium">AQI</th>
                      <th className="py-2 pr-4 font-medium">PM2.5</th>
                      <th className="py-2 pr-4 font-medium">Temp</th>
                      <th className="py-2 pr-4 font-medium">Humidity</th>
                      <th className="py-2 font-medium">Wind</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.map((area) => (
                      <tr key={area.uid} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{area.name}</td>
                        <td className="py-2 pr-4">
                          <AqiBadge aqi={area.aqi} showValue />
                        </td>
                        <td className="py-2 pr-4 font-mono tabular-nums">
                          {area.pm25 != null ? `${area.pm25.toFixed(1)}` : "—"}
                        </td>
                        <td className="py-2 pr-4 font-mono tabular-nums">
                          {area.temperatureC != null
                            ? `${area.temperatureC.toFixed(1)} °C`
                            : "—"}
                        </td>
                        <td className="py-2 pr-4 font-mono tabular-nums">
                          {area.humidityPct != null
                            ? `${Math.round(area.humidityPct)}%`
                            : "—"}
                        </td>
                        <td className="py-2 font-mono tabular-nums">
                          {area.windSpeedMs != null
                            ? `${area.windSpeedMs.toFixed(1)} m/s ${
                                compassDirection(area.windDirectionDeg) ?? ""
                              }`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}