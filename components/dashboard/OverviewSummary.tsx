"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  Bell,
  Clock,
  Droplets,
  Flame,
  Gauge,
  Thermometer,
  Wind,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { AqiBadge } from "@/components/aqi/AqiBadge";
import { AqiGauge } from "@/components/aqi/AqiGauge";
import { AqiTrendChart } from "@/components/charts/AqiTrendChart";
import { QualityIndicator } from "@/components/dashboard/QualityIndicator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AqiAlert } from "@/lib/aqi/alerts";
import type { BestWindow } from "@/lib/aqi/best-time";
import type { DataQuality } from "@/lib/aqi/quality";
import { getSeverityBand } from "@/lib/aqi/severity";
import type {
  AreaReading,
  CurrentReading,
  ForecastPoint,
  HistoryPoint,
  OverallSummary,
} from "@/lib/aqi/types";
import { formatTime, partOfDay } from "@/lib/format";
import { riseIn, stagger } from "@/lib/motion";
import { compassDirection } from "@/lib/format";

interface OverviewSummaryProps {
  current: CurrentReading;
  quality: DataQuality;
  overall: OverallSummary | null;
  areas: AreaReading[] | null;
  bestWindow: BestWindow | null;
  /** The horizon the window was picked from — drawn under the headline. */
  forecast: ForecastPoint[];
  /** Observed hours, for the 24-hour shape under the hero. */
  history: HistoryPoint[];
  alerts: AqiAlert[];
  /** Navigate to a tab from a summary tile's arrow. */
  onNavigate: (tab: string) => void;
}

/**
 * The tile surface the hero is built from. The gauge and the nine readouts sit
 * on the same one, so the row reads as a single grid rather than a loose
 * number beside a set of cards.
 */
const TILE_SURFACE = "rounded-lg border border-white/5 bg-white/[0.02]";

function Metric({
  icon,
  label,
  value,
  detail,
  aside,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  /** One short line under the value — a time range, a count, a scope. */
  detail?: ReactNode;
  /** Rides the top row opposite the icon: a severity badge, a tab arrow. */
  aside?: ReactNode;
}) {
  return (
    <motion.div
      variants={riseIn}
      className={cn(
        TILE_SURFACE,
        "flex min-h-28 flex-col justify-between gap-3 p-4",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-muted-foreground"
          aria-hidden="true"
        >
          {icon}
        </span>
        {aside ? (
          <div className="flex min-w-0 items-center gap-2">{aside}</div>
        ) : null}
      </div>
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </dt>
        <dd className="min-w-0">
          <span className="block truncate text-2xl font-semibold tabular-nums leading-tight">
            {value}
          </span>
          {detail ? (
            <span className="mt-1 block truncate text-[11px] text-muted-foreground">
              {detail}
            </span>
          ) : null}
        </dd>
      </div>
    </motion.div>
  );
}

/** The arrow that takes a summary tile to the tab holding its full treatment. */
function TabLink({
  target,
  label,
  onNavigate,
}: {
  target: string;
  label: string;
  onNavigate: (tab: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Open ${label} tab`}
      onClick={() => onNavigate(target)}
      className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <ArrowRight aria-hidden="true" className="size-3.5" />
    </button>
  );
}

/**
 * The Overview is a summary on purpose: the current AQI as a headline beside
 * nine readouts — the live concentrations and weather, then the city summary,
 * worst area, best outdoor window and alert count, each with an arrow to the
 * tab holding its full treatment. No deep panel lives here, and no chart is
 * drawn twice: the 24-hour shape appears once, under the tiles.
 */
export function OverviewSummary({
  current,
  quality,
  overall,
  areas,
  bestWindow,
  forecast,
  history,
  alerts,
  onNavigate,
}: OverviewSummaryProps) {
  const band = getSeverityBand(current.aqi);

  const hotspots = areas
    ? [...areas].sort((a, b) => b.aqi - a.aqi)
    : [];
  const worst = hotspots[0] ?? null;

  const weather = current.weather;
  const windDirection = compassDirection(
    weather?.windDirectionDeg ?? null,
  );

  const historyPoints = useMemo(
    () =>
      [...history]
        .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt))
        .map((point) => ({ key: point.observedAt, value: point.aqi })),
    [history],
  );

  const forecastPeak = useMemo(() => {
    if (forecast.length === 0) return null;
    return forecast.reduce((worst, point) =>
      point.aqi > worst.aqi ? point : worst,
    );
  }, [forecast]);

  const worstAlert = alerts[0] ?? null;
  const worstAlertLabel =
    worstAlert?.severity === "critical"
      ? "Critical"
      : worstAlert?.severity === "warning"
        ? "Warning"
        : worstAlert?.severity === "info"
          ? "Information"
          : null;

  return (
    <div className="space-y-6">
      <motion.div variants={riseIn}>
        <Card className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: band.colorVar, opacity: 0.5 }}
          />

          <CardHeader>
            <CardTitle className="text-lg tracking-tight">
              Current air quality — Lahore
            </CardTitle>
            <CardDescription>
              <QualityIndicator quality={quality} />
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 lg:grid-cols-4 lg:gap-8">
              <div
                className={cn(
                  TILE_SURFACE,
                  "flex flex-col items-center justify-center gap-3 p-4",
                )}
              >
                <AqiGauge aqi={current.aqi} />
                <AqiBadge aqi={current.aqi} />
              </div>

              <motion.dl
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-3"
              >
                <Metric
                  icon={
                    <span className="text-[10px] font-semibold">PM2.5</span>
                  }
                  label="Fine"
                  value={
                    current.concentrations.pm25 != null
                      ? current.concentrations.pm25.toFixed(1)
                      : "—"
                  }
                />
                <Metric
                  icon={
                    <span className="text-[10px] font-semibold">PM10</span>
                  }
                  label="Coarse"
                  value={
                    current.concentrations.pm10 != null
                      ? current.concentrations.pm10.toFixed(1)
                      : "—"
                  }
                />
                <Metric
                  icon={<Thermometer className="size-4" aria-hidden="true" />}
                  label="Temp"
                  value={
                    weather?.temperatureC != null
                      ? `${weather.temperatureC.toFixed(1)} °C`
                      : "—"
                  }
                />
                <Metric
                  icon={<Droplets className="size-4" aria-hidden="true" />}
                  label="Humidity"
                  value={
                    weather?.humidityPct != null
                      ? `${Math.round(weather.humidityPct)}%`
                      : "—"
                  }
                />
                <Metric
                  icon={<Wind className="size-4" aria-hidden="true" />}
                  label="Wind"
                  value={
                    weather?.windSpeedMs != null
                      ? `${weather.windSpeedMs.toFixed(1)} m/s${
                          windDirection ? ` ${windDirection}` : ""
                        }`
                      : "—"
                  }
                />

                {/*
                  The four summaries that used to be cards under the chart.
                  Same values, same tabs behind the arrows — as tiles, so each
                  number is read once and the 24-hour chart is drawn once.
                */}
                <Metric
                  icon={<Gauge className="size-4" aria-hidden="true" />}
                  label="Overall AQI"
                  value={overall != null ? overall.aqi : "—"}
                  detail={
                    overall != null
                      ? `Across ${overall.areasWithData} of ${overall.areaCount} areas`
                      : "Loading neighbourhood data…"
                  }
                  aside={
                    <>
                      {overall != null ? <AqiBadge aqi={overall.aqi} /> : null}
                      <TabLink
                        target="compare"
                        label="Compare"
                        onNavigate={onNavigate}
                      />
                    </>
                  }
                />
                <Metric
                  icon={<Flame className="size-4" aria-hidden="true" />}
                  label="Top hotspot"
                  value={worst != null ? worst.name : "—"}
                  detail={
                    worst != null
                      ? `Highest of ${hotspots.length} neighbourhood points`
                      : "No area readings yet"
                  }
                  aside={
                    <>
                      {worst != null ? <AqiBadge aqi={worst.aqi} /> : null}
                      <TabLink
                        target="hotspots"
                        label="Hotspots"
                        onNavigate={onNavigate}
                      />
                    </>
                  }
                />
                <Metric
                  icon={<Clock className="size-4" aria-hidden="true" />}
                  label="Best outdoor window"
                  value={bestWindow != null ? bestWindow.averageAqi : "—"}
                  detail={
                    bestWindow != null
                      ? `${formatTime(bestWindow.start)} → ${formatTime(bestWindow.end)} (${bestWindow.hours}h)${
                          forecastPeak
                            ? ` · peaks at ${forecastPeak.aqi} ${partOfDay(forecastPeak.predictedFor)}`
                            : ""
                        }`
                      : "No forecast available yet"
                  }
                  aside={
                    bestWindow != null ? (
                      <AqiBadge aqi={bestWindow.averageAqi} />
                    ) : null
                  }
                />
                <Metric
                  icon={<Bell className="size-4" aria-hidden="true" />}
                  label="Active alerts"
                  value={
                    alerts.length > 0 ? (
                      alerts.length
                    ) : (
                      <span className="text-xl font-normal text-muted-foreground">
                        All clear
                      </span>
                    )
                  }
                  detail={
                    worstAlert != null
                      ? worstAlert.title
                      : "No thresholds crossed right now"
                  }
                  aside={
                    <>
                      {worstAlertLabel ? (
                        <span className="text-xs text-muted-foreground">
                          {worstAlertLabel}
                        </span>
                      ) : null}
                      <TabLink
                        target="alerts"
                        label="Alerts"
                        onNavigate={onNavigate}
                      />
                    </>
                  }
                />
              </motion.dl>
            </div>

            {/*
              The headline says what the air is *now*; it cannot say whether
              that is rising. The full read, with the observed/predicted split
              spelled out, stays on the Trends tab — this is its shape.
            */}
            {historyPoints.length > 1 ? (
              <div className="mt-6 border-t border-white/5 pt-4">
                <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Last 24 hours
                </p>
                <AqiTrendChart history={history} forecast={forecast} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
