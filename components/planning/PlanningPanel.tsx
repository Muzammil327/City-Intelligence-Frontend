"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AqiBadge } from "@/components/aqi/AqiBadge";
import { AreaRankingChart } from "@/components/charts/AreaRankingChart";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { aqiQueryKeys, fetchAreas } from "@/lib/aqi/api";
import {
  MITIGATION_MEASURES,
  computeScenario,
  emptyScenario,
  fullScenario,
  projectedAreaReading,
  totalReductionPct,
  type ScenarioInput,
} from "@/lib/aqi/scenarios";

const STEP = 5;

/**
 * Planning scenarios — a what-if tool for the mitigation package the city
 * could run. Each lever is a real measure; moving it re-projects every
 * neighbourhood reading through the same EPA conversion used everywhere else.
 * The numbers are arithmetic estimates, not predictions, and the panel says so.
 */
export function PlanningPanel() {
  const areasQuery = useQuery({
    queryKey: aqiQueryKeys.areas(),
    queryFn: fetchAreas,
  });

  const [scenario, setScenario] = useState<ScenarioInput>(emptyScenario);

  const reductionPct = useMemo(
    () => totalReductionPct(scenario),
    [scenario],
  );

  const result = useMemo(
    () =>
      areasQuery.data
        ? computeScenario(areasQuery.data.areas, scenario)
        : null,
    [areasQuery.data, scenario],
  );

  const bestPossible = useMemo(
    () =>
      areasQuery.data
        ? computeScenario(areasQuery.data.areas, fullScenario())
        : null,
    [areasQuery.data],
  );

  const projectedAreas = useMemo(
    () =>
      result
        ? areasQuery.data?.areas
            .map((area) => projectedAreaReading(area, result.reductionPct))
            .sort((a, b) => b.aqi - a.aqi) ?? []
        : [],
    [result, areasQuery.data],
  );

  if (areasQuery.isPending) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  if (areasQuery.isError) {
    return (
      <ErrorState
        title="Planning unavailable"
        description="The area readings needed for scenarios could not be loaded."
        onRetry={() => void areasQuery.refetch()}
      />
    );
  }

  if (!result) {
    return (
      <EmptyState
        title="Nothing to plan from"
        description="No neighbourhood readings are available to run a scenario on."
      />
    );
  }

  const setIntensity = (id: string, value: number) => {
    setScenario((previous) => ({ ...previous, [id]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planning scenarios</CardTitle>
          <CardDescription>
            What would the city air look like if a package of measures were
            actually run? Drag the levers — every area is re-projected through
            the same EPA PM2.5 conversion the rest of the dashboard uses.
          </CardDescription>
          <p className="text-xs text-muted-foreground">
            Estimates for planning, not predictions. Measures combine with
            diminishing returns, and a reading never improves if nothing is
            invested.
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-4">
            {MITIGATION_MEASURES.map((measure) => (
              <div key={measure.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <label className="text-sm font-medium" htmlFor={measure.id}>
                    {measure.label}
                  </label>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {Math.round(scenario[measure.id] ?? 0)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {measure.description} Up to {measure.maxReductionPct}% of the
                  city PM2.5.
                </p>
                <Slider
                  id={measure.id}
                  value={[Math.round(scenario[measure.id] ?? 0)]}
                  min={0}
                  max={100}
                  step={STEP}
                  aria-label={measure.label}
                  onValueChange={([value]) =>
                    setIntensity(measure.id, value ?? 0)
                  }
                  className="mt-2"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <p className="text-sm">
              Combined effect:{" "}
              <span className="font-mono tabular-nums">
                {reductionPct.toFixed(1)}%
              </span>{" "}
              lower PM2.5 city-wide
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setScenario(emptyScenario())}
            >
              Reset to as-is
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projected city air</CardTitle>
          <CardDescription>
            The neighbourhood readings under this package, against the city
            average afterwards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Today
              </p>
              <AqiBadge aqi={result.overall.baseAqi} showValue />
            </div>
            <span aria-hidden="true" className="text-muted-foreground">
              →
            </span>
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                With this package
              </p>
              <AqiBadge aqi={result.overall.projectedAqi} showValue />
            </div>

            <div className="ml-auto space-y-1 text-right">
              <p className="font-mono text-sm tabular-nums">
                {result.overall.deltaAqi < 0
                  ? `${result.overall.deltaAqi} on the city average`
                  : "no change"}
              </p>
              <p className="text-xs text-muted-foreground">
                {result.areasImprovedBand > 0
                  ? `${result.areasImprovedBand} of ${
                      result.areas.length
                    } areas reach a cleaner band`
                  : "no area reaches a cleaner band"}
              </p>
            </div>
          </div>

          <AreaRankingChart
            areas={projectedAreas}
            cityAqi={result.overall.projectedAqi}
          />

          {bestPossible ? (
            <p className="text-xs text-muted-foreground">
              If every measure were implemented in full: AQI{" "}
              {bestPossible.overall.projectedAqi} (
              {bestPossible.overall.projectedCategory}) — a{" "}
              {bestPossible.reductionPct.toFixed(0)}% cut. This is the ceiling
              the levers allow, reached by no single measure alone.
            </p>
          ) : null}

          <details className="group/details">
            <summary className="cursor-pointer list-none text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <span className="group-open/details:hidden">
                Show per-area before / after
              </span>
              <span className="hidden group-open/details:inline">
                Hide per-area before / after
              </span>
            </summary>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Area</th>
                    <th className="py-2 pr-4 font-medium">PM2.5 now</th>
                    <th className="py-2 pr-4 font-medium">PM2.5 projected</th>
                    <th className="py-2 pr-4 font-medium">AQI now</th>
                    <th className="py-2 font-medium">AQI projected</th>
                  </tr>
                </thead>
                <tbody>
                  {result.areas.map((sweep) => (
                    <tr key={sweep.uid} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{sweep.name}</td>
                      <td className="py-2 pr-4 font-mono tabular-nums">
                        {sweep.basePm25 != null
                          ? sweep.basePm25.toFixed(1)
                          : "—"}
                      </td>
                      <td className="py-2 pr-4 font-mono tabular-nums">
                        {sweep.projectedPm25 != null
                          ? sweep.projectedPm25.toFixed(1)
                          : "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <AqiBadge aqi={sweep.baseAqi} showValue />
                      </td>
                      <td className="py-2">
                        <span className="inline-flex items-center gap-2">
                          <AqiBadge aqi={sweep.projectedAqi} showValue />
                          {sweep.bandImproved ? (
                            <span className="text-xs text-muted-foreground">
                              cleaner band
                            </span>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}