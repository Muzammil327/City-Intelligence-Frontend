"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  Flame,
  HeartPulse,
  History,
  LayoutDashboard,
  MapPin,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { PollutantMixCard } from "@/components/aqi/PollutantMixCard";
import {
  AlertsPanel,
  ComparePanel,
  CorrelationPanel,
  ExplainableForecastCard,
  HistoryPanel,
  HotspotsPanel,
  OverallCard,
  OverviewSummary,
  RecommendationsPanel,
  TimelineView,
  TrendPanel,
} from "@/components/dashboard";
import { PlanningPanel } from "@/components/planning/PlanningPanel";
import { StationMapPanel } from "@/components/station/StationMapPanel";
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
 * The views. Overview is a summary only — one headline and four cards that
 * point at the tab holding that subject's depth: how it changes (Trends),
 * where exactly (Map), what it means for you (Air & health), the raw numbers
 * (Compare & history), and what could change it (Plan).
 *
 * `headerTitle` sets the page-heading word per view (Overview reads as the
 * Dashboard); `description` is the one-line summary under that heading.
 */
const TABS = [
  { value: "overview", label: "Overview", headerTitle: "Dashboard" },
  {
    value: "trend",
    label: "Trends",
    description: "How the city's air is moving, hour by hour.",
  },
  {
    value: "stations",
    label: "Stations",
    description:
      "Every monitoring point on the map — pick one to read its full picture.",
  },
  {
    value: "hotspots",
    label: "Hotspots",
    description:
      "The neighbourhoods with the worst air, and which species are driving it.",
  },
  {
    value: "guidance",
    label: "Guidance",
    description: "What to do outdoors today, and when.",
  },
  {
    value: "alerts",
    label: "Alerts",
    description: "Every threshold the current air has crossed.",
  },
  {
    value: "compare",
    label: "Compare",
    description: "The raw numbers across every neighbourhood.",
  },
  {
    value: "history",
    label: "History",
    description: "The stored record of observed hourly readings.",
  },
  {
    value: "plan",
    label: "Plan",
    description: "Model what mitigation scenarios could do to the air.",
  },
] as const;

const TAB_ICONS = {
  overview: LayoutDashboard,
  trend: TrendingUp,
  stations: MapPin,
  hotspots: Flame,
  guidance: HeartPulse,
  alerts: Bell,
  compare: BarChart3,
  history: History,
  plan: Target,
} as const;

/**
 * The dashboard screen: a sidebar nav on the left, the active view on the
 * right. Assembled from the bundled demo dataset, with each block keeping its
 * own loading/error state so a failed query never blanks the page.
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

  const activeTabMeta =
    TABS.find((tab) => tab.value === activeTab) ?? TABS[0];
  const activeTitle = activeTabMeta.headerTitle ?? activeTabMeta.label;
  const activeDescription = activeTabMeta.description ?? null;

  const areasBlock = (fallbackTitle: string, fallbackDesc: string) =>
    areasQuery.isPending ? (
      <Skeleton className="h-64 w-full rounded-lg" />
    ) : areasQuery.isError ? (
      <ErrorState
        title={fallbackTitle}
        description={fallbackDesc}
        onRetry={() => void areasQuery.refetch()}
      />
    ) : areasQuery.data ? (
      <HotspotsPanel
        areas={areasQuery.data.areas}
        overall={areasQuery.data.overall}
      />
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
    <Tabs
      orientation="vertical"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col items-stretch gap-8 lg:h-dvh lg:flex-row lg:items-stretch lg:gap-0 lg:overflow-hidden"
    >
      <aside className="shrink-0 px-5 py-6 lg:flex lg:h-full lg:min-h-0 lg:w-60 lg:flex-col lg:gap-6 lg:border-r lg:border-white/5 lg:px-5 lg:py-6">
        <div className="flex items-center justify-center border-b border-white/5 pb-4">
          <p className="truncate text-xl font-semibold tracking-tight">
            City Intelligence
          </p>
        </div>

        <TabsList
          variant="line"
          className="h-auto w-full min-h-0 flex-col items-stretch gap-1 overflow-y-auto rounded-lg bg-transparent p-0"
        >
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.value];
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="relative w-full justify-start gap-2.5 rounded-md border border-transparent px-0 py-0 text-left transition-colors hover:border-white/10 hover:bg-white/5"
              >
                {/*
                  The active pill is a shared-layout element that slides
                  between nav rows, so the travel reads as one object moving.
                */}
                {activeTab === tab.value ? (
                  <motion.span
                    layoutId="dashboard-nav-indicator"
                    transition={indicatorTransition}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-md bg-white/10 ring-1 ring-white/10"
                  />
                ) : null}
                {/*
                  The icon sits in the same 36px column as the wordmark's
                  glyph above it, so the nav labels start on the wordmark's
                  left edge rather than a column of their own.
                */}
                <span className="relative flex size-9 shrink-0 items-center justify-center">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="relative">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <p className="hidden text-[10px] leading-relaxed text-muted-foreground lg:mt-auto lg:block">
          Running on bundled sample data — these are not live readings.
        </p>
      </aside>

      <div className="min-w-0 flex-1 lg:h-full lg:overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {activeTitle}
            </h1>
            {activeDescription ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {activeDescription}
              </p>
            ) : null}
          </div>
          {current ? (
            <p className="text-[11px] text-muted-foreground">
              Sample reading · {formatDateTime(current.observedAt)}
            </p>
          ) : null}
        </header>

        <TabsContent value="overview" className="pt-0">
          <RevealGroup className="space-y-6">
            <Reveal>
              {current ? (
                <OverviewSummary
                  current={current}
                  quality={quality}
                  overall={areasQuery.data?.overall ?? null}
                  areas={areasQuery.data?.areas ?? null}
                  bestWindow={bestWindow}
                  forecast={forecastPoints}
                  history={readings}
                  alerts={alerts}
                  onNavigate={setActiveTab}
                />
              ) : currentQuery.isError ? (
                <ErrorState
                  title="Live reading unavailable"
                  description="The city's current air quality could not be loaded from the service."
                  onRetry={() => void currentQuery.refetch()}
                />
              ) : (
                <Skeleton className="h-64 w-full rounded-lg" />
              )}
            </Reveal>
          </RevealGroup>
        </TabsContent>

        <TabsContent value="trend" className="pt-0">
          <RevealGroup className="space-y-6">
            <Reveal>{trendBlock}</Reveal>
            <Reveal>
              <TimelineView history={readings} forecast={forecastPoints} />
            </Reveal>
          </RevealGroup>
        </TabsContent>

        <TabsContent value="stations" className="pt-0">
          <RevealGroup className="space-y-6">
            <Reveal>
              <StationMapPanel />
            </Reveal>
            <Reveal>
              <StationPanel />
            </Reveal>
          </RevealGroup>
        </TabsContent>

        <TabsContent value="hotspots" className="pt-0">
          <RevealGroup className="space-y-6">
            <Reveal>
              {areasBlock(
                "Hotspots unavailable",
                "Area readings could not be loaded.",
              )}
            </Reveal>
            <Reveal>
              {current ? (
                <PollutantMixCard
                  concentrations={current.concentrations}
                  aqi={current.aqi}
                />
              ) : currentQuery.isPending ? (
                <Skeleton className="h-72 w-full rounded-lg" />
              ) : null}
            </Reveal>
          </RevealGroup>
        </TabsContent>

        <TabsContent value="guidance" className="pt-0">
          <RevealGroup className="space-y-6">
            <Reveal>
              <RecommendationsPanel
                currentAqi={current?.aqi ?? null}
                forecast={forecastPoints}
                bestWindow={bestWindow}
              />
            </Reveal>
          </RevealGroup>
        </TabsContent>

        <TabsContent value="alerts" className="pt-0">
          <RevealGroup className="space-y-6">
            <Reveal>
              <AlertsPanel alerts={alerts} />
            </Reveal>
          </RevealGroup>
        </TabsContent>

        <TabsContent value="compare" className="pt-0">
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
                <>
                  <OverallCard overall={areasQuery.data.overall} />
                  <div className="mt-6">
                    <ComparePanel
                      areas={areasQuery.data.areas}
                      overall={areasQuery.data.overall}
                    />
                  </div>
                </>
              ) : null}
            </Reveal>
          </RevealGroup>
        </TabsContent>

        <TabsContent value="history" className="pt-0">
          <RevealGroup className="space-y-6">
            <Reveal>
              <HistoryPanel />
            </Reveal>
          </RevealGroup>
        </TabsContent>

        <TabsContent value="plan" className="pt-0">
          <RevealGroup className="space-y-6">
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
            <Reveal>
              <PlanningPanel />
            </Reveal>
          </RevealGroup>
        </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}