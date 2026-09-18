"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  Droplets,
  Navigation,
  Thermometer,
  Wind,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { AqiBadge } from "@/components/aqi/AqiBadge";
import { AqiGauge } from "@/components/aqi/AqiGauge";
import { Sparkline } from "@/components/charts/Sparkline";
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
  OverallSummary,
} from "@/lib/aqi/types";
import { formatHour, formatTime, partOfDay } from "@/lib/format";
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
  alerts: AqiAlert[];
  /** Navigate to a tab when a summary card is clicked. */
  onNavigate: (tab: string) => void;
}

/**
 * The tile surface the hero is built from. The gauge and the six readouts sit
 * on the same one, so the row reads as a single grid rather than a loose
 * number beside a set of cards.
 */
const TILE_SURFACE = "rounded-lg border border-white/5 bg-white/[0.02]";

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <motion.div
      variants={riseIn}
      className={cn(
        TILE_SURFACE,
        "flex min-h-28 flex-col justify-between gap-3 p-4",
      )}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/5 text-muted-foreground"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </dt>
        <dd className="text-2xl font-semibold tabular-nums leading-tight">
          {value}
        </dd>
      </div>
    </motion.div>
  );
}

/**
 * The Overview is a summary on purpose: the current AQI as a headline, and
 * four clickable cards that each point at the tab holding that subject's full
 * treatment. No deep panel lives here — detail is one click away.
 */
export function OverviewSummary({
  current,
  quality,
  overall,
  areas,
  bestWindow,
  forecast,
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

  // The same series `BestTimeCard` plots: sorted ascending, keyed by timestamp.
  const forecastPoints = useMemo(
    () =>
      [...forecast]
        .sort(
          (a, b) => Date.parse(a.predictedFor) - Date.parse(b.predictedFor),
        )
        .map((point) => ({ key: point.predictedFor, value: point.aqi })),
    [forecast],
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
                      ? `${weather.windSpeedMs.toFixed(1)} m/s`
                      : "—"
                  }
                />
                <Metric
                  icon={<Navigation className="size-4" aria-hidden="true" />}
                  label="Bearing"
                  value={
                    windDirection ??
                    (weather?.windDirectionDeg != null
                      ? `${Math.round(weather.windDirectionDeg)}°`
                      : "—")
                  }
                />
              </motion.dl>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.dl
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="grid gap-4 sm:grid-cols-2"
      >
        <SummaryStat
          label="Overall AQI"
          value={overall != null ? overall.aqi : "—"}
          valueDetail={overall != null ? <AqiBadge aqi={overall.aqi} /> : null}
          detail={
            overall != null
              ? `Across ${overall.areasWithData} of ${overall.areaCount} areas`
              : "Loading neighbourhood data…"
          }
          target="compare"
          onNavigate={onNavigate}
        />

        <SummaryStat
          label="Best outdoor window"
          value={bestWindow != null ? bestWindow.averageAqi : "—"}
          valueDetail={
            bestWindow != null ? (
              <AqiBadge aqi={bestWindow.averageAqi} />
            ) : null
          }
          detail={
            bestWindow != null
              ? `${formatTime(bestWindow.start)} → ${formatTime(bestWindow.end)} (${bestWindow.hours}h)${
                  forecastPeak
                    ? ` · peaks at ${forecastPeak.aqi} ${partOfDay(forecastPeak.predictedFor)}`
                    : ""
                }`
              : "No forecast available yet"
          }
          chart={
            bestWindow != null ? (
              <Sparkline
                points={forecastPoints}
                accent={getSeverityBand(bestWindow.averageAqi).colorVar}
                labelFormatter={formatHour}
                className="h-12 w-full"
                label={`Forecast AQI over the next ${forecastPoints.length} hours, averaging ${bestWindow.averageAqi} in the best window.`}
              />
            ) : null
          }
          target="guidance"
          onNavigate={onNavigate}
        />

        <SummaryStat
          label="Top hotspot"
          value={worst != null ? worst.name : "—"}
          valueDetail={
            worst != null ? <AqiBadge aqi={worst.aqi} /> : null
          }
          detail={
            worst != null
              ? `Highest of ${hotspots.length} neighbourhood points`
              : "No area readings yet"
          }
          target="hotspots"
          onNavigate={onNavigate}
        />

        <SummaryStat
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
          valueDetail={
            worstAlertLabel ? (
              <span className="text-xs font-normal text-muted-foreground">
                {worstAlertLabel}
              </span>
            ) : null
          }
          detail={
            alerts.length > 0
              ? alerts[0]
                ? alerts[0]!.title
                : "Thresholds crossed"
              : "No thresholds crossed right now"
          }
          target="alerts"
          onNavigate={onNavigate}
        />
      </motion.dl>
    </div>
  );
}

interface SummaryStatProps {
  label: string;
  value: ReactNode;
  valueDetail: ReactNode;
  detail: string;
  /** Optional shape under the detail line — a sparkline, usually. */
  chart?: ReactNode;
  target: string;
  onNavigate: (tab: string) => void;
}

function SummaryStat({
  label,
  value,
  valueDetail,
  detail,
  chart,
  target,
  onNavigate,
}: SummaryStatProps) {
  const navigate = () => onNavigate(target);

  return (
    <motion.dd variants={riseIn} className="contents">
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label}: ${detail}. Open ${target} tab for details.`}
        onClick={navigate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigate();
          }
        }}
        className="group cursor-pointer outline-none"
      >
        <Card className="h-full transition-colors group-hover:border-white/20">
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {label}
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </div>
            <p className="flex flex-wrap items-center gap-2 text-3xl font-medium leading-none tabular-nums">
              <span className="min-w-0 truncate">{value}</span>
              {valueDetail}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {detail}
            </p>
            {chart}
          </CardContent>
        </Card>
      </div>
    </motion.dd>
  );
}