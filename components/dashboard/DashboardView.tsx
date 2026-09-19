"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { PollutantMixCard } from "@/components/aqi/PollutantMixCard";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { ModelAccuracyPanel } from "@/components/dashboard/ModelAccuracyPanel";
import { DEFAULT_TAB, isTabValue, tabFor } from "@/components/dashboard/tabs";
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
import { ReferenceStationsPanel } from "@/components/station/ReferenceStationsPanel";
import { StationMapPanel } from "@/components/station/StationMapPanel";
import { StationPanel } from "@/components/station/StationPanel";
import { Reveal, RevealGroup } from "@/components/common/Reveal";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
import { useTranslations } from "@/lib/i18n/context";

/**
 * The dashboard screen: the nav beside the active view. Assembled from the
 * live API, with each block keeping its own loading/error state so a failed
 * query never blanks the page.
 *
 * The active view lives in `?tab=`, not in component state, so a refresh, a
 * shared link and the browser's back button all land on the view the reader
 * was looking at.
 */
export function DashboardView() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // `?tab=` is user-supplied: an unknown value falls back to the default
  // rather than rendering a shell with no content in it.
  const requested = searchParams.get("tab");
  const activeTab = isTabValue(requested) ? requested : DEFAULT_TAB;

  const handleTabChange = useCallback(
    (value: string) => {
      if (!isTabValue(value)) return;

      const params = new URLSearchParams(searchParams.toString());
      // The default view is the bare URL — no `?tab=overview` to share around.
      if (value === DEFAULT_TAB) {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }

      const query = params.toString();
      // `replace`, not `push`: nine nav clicks should not mean nine presses of
      // the back button to leave the page. `scroll: false` because the view
      // changes in place and yanking to the top reads as a page load.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

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

  const activeTabMeta = tabFor(activeTab);
  const activeTitle = t(activeTabMeta.headerTitleKey ?? activeTabMeta.labelKey);
  const activeDescription = activeTabMeta.descriptionKey
    ? t(activeTabMeta.descriptionKey)
    : null;

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
      onValueChange={handleTabChange}
      className="w-full flex-col items-stretch lg:h-dvh lg:flex-row lg:items-stretch lg:overflow-hidden"
    >
      <DashboardNav activeTab={activeTab} />

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
              Last reading · {formatDateTime(current.observedAt)}
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
                  onNavigate={handleTabChange}
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
            <Reveal>
              <RecommendationsPanel
                currentAqi={current?.aqi ?? null}
                forecast={forecastPoints}
                bestWindow={bestWindow}
              />
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
            <Reveal>
              <ReferenceStationsPanel />
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

        <TabsContent value="accuracy" className="pt-0">
          <RevealGroup className="space-y-6">
            <Reveal>
              <ModelAccuracyPanel />
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