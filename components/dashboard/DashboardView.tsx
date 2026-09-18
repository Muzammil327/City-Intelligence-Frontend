"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { PollutantMixCard } from "@/components/aqi/PollutantMixCard";
import {
  AlertsPanel,
  BestTimeCard,
  CityHero,
  ComparePanel,
  CorrelationPanel,
  ExplainableForecastCard,
  HistoryPanel,
  HotspotsPanel,
  OverallCard,
  RecommendationsPanel,
  TimelineView,
  TrendPanel,
} from "@/components/dashboard";
import { PlanningPanel } from "@/components/planning/PlanningPanel";
import { StationPanel } from "@/components/station/StationPanel";
import { Reveal, RevealGroup } from "@/components/common/Reveal";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  aqiQueryKeys,
  fetchAreas,
  fetchCurrentReading,
  fetchForecast,
  fetchHistory,
} from "@/lib/aqi/api";
import { generateAlerts } from "@/lib/aqi/alerts";
import { bestOutsideWindow } from "@/lib/aqi/best-time";
import { forecastInsights } from "@/lib/aqi/insights";
import { qualityFor } from "@/lib/aqi/quality";
import { trendOver } from "@/lib/aqi/trend";
import {
  FORECAST_HORIZON_HOURS,
  HISTORY_HOURS,
  REFRESH_INTERVAL_MS,
} from "@/lib/config";
import { formatDateTime } from "@/lib/format";
import { indicatorTransition } from "@/lib/motion";

/**
 * Five tabs, five jobs — each one shows different data, so no neighbourhood
 * reading is repeated across two views. "What is the air like now" (Overview),
 * "how is it changing" (Trends), "where exactly" (Map), "the raw numbers"
 * (Compare & history), and "what could change it" (Plan).
 */
const TABS = [
  { value: "overview", label: "Overview" },
  { value: "trend", label: "Trends" },
  { value: "map", label: "Map & stations" },
  { value: "compare", label: "Compare & history" },
  { value: "plan", label: "Plan" },
] as const;

/**
 * The whole dashboard, assembled from the bundled demo dataset. Each block
 * keeps its own loading/error state and any block can render on its own, so a
 * failed query never blanks the page.
 */
export function DashboardView() {
  const [activeTab, setActiveTab] = useState<string>(TABS[0].value);

  const currentQuery = useQuery({
    queryKey: aqiQueryKeys.current(),
    queryFn: fetchCurrentReading,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const historyQuery = useQuery({
    queryKey: aqiQueryKeys.history(HISTORY_HOURS),
    queryFn: () => fetchHistory(HISTORY_HOURS),
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const forecastQuery = useQuery({
    queryKey: aqiQueryKeys.forecast(FORECAST_HORIZON_HOURS),
    queryFn: () => fetchForecast(FORECAST_HORIZON_HOURS),
    retry: false,
  });

  const areasQuery = useQuery({
    queryKey: aqiQueryKeys.areas(),
    queryFn: fetchAreas,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const current = currentQuery.data ?? null;
  const readings = useMemo(
    () => historyQuery.data?.readings ?? [],
    [historyQuery.data],
  );
  const forecastPoints = useMemo(
    () => forecastQuery.data?.points ?? [],
    [forecastQuery.data],
  );

  const quality = useMemo(
    () => qualityFor(current, areasQuery.isSuccess),
    [current, areasQuery.isSuccess],
  );

  const trend = useMemo(() => trendOver(readings), [readings]);

  const bestWindow = useMemo(
    () => bestOutsideWindow(forecastPoints),
    [forecastPoints],
  );

  const insight = useMemo(
    () => forecastInsights(current, readings, forecastPoints),
    [current, readings, forecastPoints],
  );

  const alerts = useMemo(
    () =>
      generateAlerts(
        current,
        forecastQuery.data ?? null,
        readings,
        areasQuery.data?.areas ?? null,
        areasQuery.data?.overall ?? null,
      ),
    [current, forecastQuery.data, readings, areasQuery.data],
  );

  const hero = current ? (
    <CityHero current={current} quality={quality} />
  ) : currentQuery.isError ? (
    <ErrorState
      title="Live reading unavailable"
      description="The city's current air quality could not be loaded from the service."
      onRetry={() => void currentQuery.refetch()}
    />
  ) : (
    <Skeleton className="h-56 w-full rounded-lg" />
  );

  const pollutantsBlock = current ? (
    <PollutantMixCard
      concentrations={current.concentrations}
      aqi={current.aqi}
    />
  ) : null;

  const areasBlock = areasQuery.isPending ? (
    <Skeleton className="h-64 w-full rounded-lg" />
  ) : areasQuery.isError ? (
    <ErrorState
      title="Neighbourhood data unavailable"
      description="Area-level readings could not be loaded."
      onRetry={() => void areasQuery.refetch()}
    />
  ) : areasQuery.data ? (
    <div className="space-y-6">
      <OverallCard overall={areasQuery.data.overall} />
      <HotspotsPanel
        areas={areasQuery.data.areas}
        overall={areasQuery.data.overall}
      />
    </div>
  ) : null;

  const trendBlock = historyQuery.isPending ? (
    <Skeleton className="h-80 w-full rounded-lg" />
  ) : historyQuery.isError ? (
    <ErrorState
      title="Trend unavailable"
      description="Observed history could not be loaded."
      onRetry={() => void historyQuery.refetch()}
    />
  ) : readings.length === 0 ? (
    <EmptyState
      title="Not enough history yet"
      description="Once the service has stored a few hours of readings, a trend will appear here."
    />
  ) : (
    <div className="space-y-6">
      <TrendPanel history={readings} forecast={forecastPoints} trend={trend} />
      {forecastQuery.isError ? (
        <p className="text-xs text-muted-foreground">
          The forecast could not be loaded right now.
        </p>
      ) : forecastQuery.data ? (
        <ExplainableForecastCard
          insight={insight}
          forecast={forecastQuery.data}
        />
      ) : null}
    </div>
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList
          variant="line"
          className="h-auto max-w-full gap-1 overflow-x-auto p-1"
        >
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative shrink-0 grow-0 rounded-md px-3 py-1.5"
            >
              {/*
                The active pill is a shared-layout element: one node that moves
                between triggers, rather than five that fade. That is what
                makes the travel read as a single object sliding.
              */}
              {activeTab === tab.value ? (
                <motion.span
                  layoutId="dashboard-tab-indicator"
                  transition={indicatorTransition}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-md bg-white/10 ring-1 ring-white/10"
                />
              ) : null}
              <span className="relative">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {current ? (
          <p className="font-mono text-[11px] text-muted-foreground">
            Sample reading · {formatDateTime(current.observedAt)}
          </p>
        ) : null}
      </div>

      <TabsContent value="overview" className="pt-6">
        <RevealGroup className="space-y-6">
          <Reveal>{hero}</Reveal>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <Reveal>{pollutantsBlock}</Reveal>
              <Reveal>{areasBlock}</Reveal>
            </div>
            <div className="space-y-6">
              <Reveal>
                <BestTimeCard
                  bestWindow={bestWindow}
                  forecast={forecastPoints}
                  hasForecast={forecastPoints.length > 0}
                />
              </Reveal>
              <Reveal>
                <RecommendationsPanel
                  currentAqi={current?.aqi ?? null}
                  forecast={forecastPoints}
                  bestWindow={bestWindow}
                />
              </Reveal>
              <Reveal>
                <AlertsPanel alerts={alerts} />
              </Reveal>
            </div>
          </div>
        </RevealGroup>
      </TabsContent>

      <TabsContent value="trend" className="pt-6">
        <RevealGroup className="space-y-6">
          <Reveal>{trendBlock}</Reveal>
          <Reveal>
            <TimelineView history={readings} forecast={forecastPoints} />
          </Reveal>
          <Reveal>
            {historyQuery.isPending ? (
              <Skeleton className="h-80 w-full rounded-lg" />
            ) : historyQuery.isError ? (
              <ErrorState
                title="Weather &amp; pollution unavailable"
                description="The joined hourly data could not be loaded."
                onRetry={() => void historyQuery.refetch()}
              />
            ) : (
              <CorrelationPanel history={readings} />
            )}
          </Reveal>
        </RevealGroup>
      </TabsContent>

      <TabsContent value="map" className="pt-6">
        <RevealGroup className="space-y-6">
          <Reveal>
            <StationPanel />
          </Reveal>
        </RevealGroup>
      </TabsContent>

      <TabsContent value="compare" className="pt-6">
        <RevealGroup className="space-y-6">
          <Reveal>
            {areasQuery.isPending ? (
              <Skeleton className="h-72 w-full rounded-lg" />
            ) : areasQuery.isError ? (
              <ErrorState
                title="Comparison unavailable"
                description="Area readings could not be loaded."
                onRetry={() => void areasQuery.refetch()}
              />
            ) : areasQuery.data ? (
              <ComparePanel
                areas={areasQuery.data.areas}
                overall={areasQuery.data.overall}
              />
            ) : null}
          </Reveal>
          <Reveal>
            <HistoryPanel />
          </Reveal>
        </RevealGroup>
      </TabsContent>

      <TabsContent value="plan" className="pt-6">
        <RevealGroup className="space-y-6">
          <Reveal>
            <PlanningPanel />
          </Reveal>
        </RevealGroup>
      </TabsContent>
    </Tabs>
  );
}