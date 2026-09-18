"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { TooltipSurface } from "@/components/charts/ChartTooltip";
import {
  formatDelta,
  formatMetricValue,
  metricMeta,
  valueForMetric,
  type CompareMetric,
} from "@/lib/aqi/compare";
import { getSeverityBand } from "@/lib/aqi/severity";
import type { AreaReading } from "@/lib/aqi/types";
import { compassDirection } from "@/lib/format";
import { DURATION, EASE } from "@/lib/motion";

interface AreaRankingChartProps {
  /** Sorted worst-first (or by name) by the caller. */
  areas: AreaReading[];
  /** Which metric the bars represent. AQI colours by severity band; the mass
      metrics share a single neutral accent. */
  metric: CompareMetric;
  /** The number the deltas on each row are read against. */
  reference: number;
  /** "city average" or "selected average" — reads as "vs {referenceLabel}". */
  referenceLabel: string;
}

/** A floor for the AQI axis, so a uniformly bad city does not look varied.
    The mass metrics scale to their own maximum instead. */
const MIN_AQI_SCALE = 200;

/** Bars for non-AQI metrics: one neutral accent, never a severity colour. */
const NEUTRAL_BAR =
  "color-mix(in srgb, var(--color-foreground) 42%, transparent)";

/** One row of the hover card. Omits itself when the reading is missing. */
function Detail({ label, value }: { label: string; value: string | null }) {
  if (value === null) return null;
  return (
    <li className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </li>
  );
}

/**
 * Neighbourhoods ranked on the chosen metric, each bar against the shared
 * reference (city or selected average).
 *
 * This replaces a wide table: a table makes you compare numbers in your head
 * one pair at a time; bars put the whole ordering — and the size of each gap —
 * in one look. The columns a table would carry are still reachable: hovering
 * or focusing a row shows that area's full reading.
 */
export function AreaRankingChart({
  areas,
  metric,
  reference,
  referenceLabel,
}: AreaRankingChartProps) {
  const [activeUid, setActiveUid] = useState<string | null>(null);

  // Rows whose value for the chosen metric is missing stay out of the plot
  // (they are still visible in the table view). Order from the caller holds.
  const rows = useMemo(
    () =>
      areas.filter((area) => valueForMetric(area, metric) != null),
    [areas, metric],
  );

  const scale = useMemo(() => {
    const max = rows.reduce(
      (highest, area) =>
        Math.max(highest, valueForMetric(area, metric) as number),
      reference,
    );
    if (metric === "aqi") return Math.max(MIN_AQI_SCALE, max);
    return Math.max(max * 1.12, 1);
  }, [rows, reference, metric]);

  if (rows.length === 0) return null;

  const meta = metricMeta(metric);
  const isAqi = metric === "aqi";

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5" onMouseLeave={() => setActiveUid(null)}>
        {rows.map((area, index) => {
          const value = valueForMetric(area, metric) as number;
          const band = getSeverityBand(area.aqi);
          const barColor = isAqi ? band.colorVar : NEUTRAL_BAR;
          const delta = value - reference;
          const isActive = activeUid === area.uid;
          // The enclosing Card clips overflow, so rows near the bottom open
          // upward instead of being cut off.
          const opensUpward = index >= rows.length - 2;

          return (
            <li key={area.uid} className="relative">
              <div
                role="button"
                tabIndex={0}
                aria-label={`${area.name}: ${meta.label} ${formatMetricValue(value, metric)}, rank ${index + 1}`}
                onMouseEnter={() => setActiveUid(area.uid)}
                onFocus={() => setActiveUid(area.uid)}
                onBlur={() => setActiveUid(null)}
                className="cursor-default rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <div className="flex items-baseline justify-between gap-3 pb-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <span className="truncate text-xs font-medium">
                      {area.name}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs tabular-nums">
                    {formatMetricValue(value, metric)}
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      {formatDelta(delta, metric)}
                    </span>
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      width: `${(value / scale) * 100}%`,
                      background: barColor,
                      opacity: activeUid === null || isActive ? 1 : 0.5,
                      transformOrigin: "left",
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: DURATION.base,
                      ease: EASE,
                      delay: index * 0.04,
                    }}
                  />
                </div>
              </div>

              {isActive ? (
                <div
                  className={`absolute right-0 z-30 w-56 ${
                    opensUpward ? "bottom-full mb-1" : "top-full mt-1"
                  }`}
                >
                  <TooltipSurface>
                    <p className="mb-1 flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-[2px]"
                        style={{ background: barColor }}
                      />
                      <span className="font-medium">{area.name}</span>
                    </p>
                    <ul className="space-y-0.5">
                      <Detail
                        label={meta.label}
                        value={formatMetricValue(value, metric)}
                      />
                      {isAqi ? (
                        <Detail label="Band" value={band.label} />
                      ) : null}
                      <Detail
                        label={`vs ${referenceLabel}`}
                        value={formatDelta(delta, metric)}
                      />
                      {metric !== "pm25" ? (
                        <Detail
                          label="PM2.5"
                          value={
                            area.pm25 != null
                              ? `${area.pm25.toFixed(1)} µg/m³`
                              : null
                          }
                        />
                      ) : null}
                      {metric !== "pm10" ? (
                        <Detail
                          label="PM10"
                          value={
                            area.pm10 != null
                              ? `${area.pm10.toFixed(1)} µg/m³`
                              : null
                          }
                        />
                      ) : null}
                      <Detail
                        label="Temp"
                        value={
                          area.temperatureC != null
                            ? `${area.temperatureC.toFixed(1)} °C`
                            : null
                        }
                      />
                      <Detail
                        label="Humidity"
                        value={
                          area.humidityPct != null
                            ? `${Math.round(area.humidityPct)}%`
                            : null
                        }
                      />
                      <Detail
                        label="Wind"
                        value={
                          area.windSpeedMs != null
                            ? `${area.windSpeedMs.toFixed(1)} m/s ${
                                compassDirection(area.windDirectionDeg) ?? ""
                              }`.trim()
                            : null
                        }
                      />
                    </ul>
                  </TooltipSurface>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="text-[10px] text-muted-foreground">
        Ranked by {meta.label} · deltas vs {referenceLabel}{" "}
        {formatMetricValue(reference, metric)}
      </p>
    </div>
  );
}