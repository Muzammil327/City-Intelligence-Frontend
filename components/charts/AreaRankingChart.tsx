"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { TooltipSurface } from "@/components/charts/ChartTooltip";
import { getSeverityBand } from "@/lib/aqi/severity";
import type { AreaReading } from "@/lib/aqi/types";
import { compassDirection } from "@/lib/format";
import { DURATION, EASE } from "@/lib/motion";

interface AreaRankingChartProps {
  /** Sorted worst-first by the caller. */
  areas: AreaReading[];
  /** Drawn as a reference line, so every bar is read against the city. */
  cityAqi: number;
}

/** A floor for the axis, so a uniformly bad city does not look varied. */
const MIN_SCALE = 200;

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
 * Neighbourhoods ranked by AQI, as bars against the city average.
 *
 * This replaces a seven-column table. A table makes you compare numbers in
 * your head one pair at a time; bars against a shared reference line put the
 * whole ordering — and the size of each gap — in one look. The columns the
 * table used to carry are still reachable: hovering or focusing a row shows
 * that area's full reading.
 */
export function AreaRankingChart({ areas, cityAqi }: AreaRankingChartProps) {
  const [activeUid, setActiveUid] = useState<string | null>(null);

  const scale = useMemo(
    () => Math.max(MIN_SCALE, cityAqi, ...areas.map((area) => area.aqi)),
    [areas, cityAqi],
  );

  if (areas.length === 0) return null;

  const cityOffset = (cityAqi / scale) * 100;

  return (
    <div className="space-y-3">
      <div className="relative">
        {/* The city average, drawn once across the whole plot rather than
            restated as a "+18 above" column on every row. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-10 border-l border-dashed border-foreground/35"
          style={{ left: `calc(${cityOffset}% )` }}
        />

        <ul className="space-y-1.5" onMouseLeave={() => setActiveUid(null)}>
          {areas.map((area, index) => {
            const band = getSeverityBand(area.aqi);
            const delta = area.aqi - cityAqi;
            const isActive = activeUid === area.uid;
            // The enclosing Card clips overflow, so rows near the bottom open
            // upward instead of being cut off.
            const opensUpward = index >= areas.length - 2;

            return (
              <li key={area.uid} className="relative">
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`${area.name}: AQI ${area.aqi}, ${band.label}`}
                  onMouseEnter={() => setActiveUid(area.uid)}
                  onFocus={() => setActiveUid(area.uid)}
                  onBlur={() => setActiveUid(null)}
                  className="cursor-default rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <div className="flex items-baseline justify-between gap-3 pb-1">
                    <span className="truncate text-xs font-medium">
                      {area.name}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums">
                      {area.aqi}
                      <span className="ml-2 text-[10px] text-muted-foreground">
                        {delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "±0"}
                      </span>
                    </span>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        width: `${(area.aqi / scale) * 100}%`,
                        background: band.colorVar,
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
                          style={{ background: band.colorVar }}
                        />
                        <span className="font-medium">{area.name}</span>
                      </p>
                      <ul className="space-y-0.5">
                        <Detail label="AQI" value={`${area.aqi}`} />
                        <Detail label="Band" value={band.label} />
                        <Detail
                          label="vs city"
                          value={
                            delta > 0
                              ? `+${delta}`
                              : delta < 0
                                ? `${delta}`
                                : "at average"
                          }
                        />
                        <Detail
                          label="PM2.5"
                          value={
                            area.pm25 != null
                              ? `${area.pm25.toFixed(1)} µg/m³`
                              : null
                          }
                        />
                        <Detail
                          label="PM10"
                          value={
                            area.pm10 != null
                              ? `${area.pm10.toFixed(1)} µg/m³`
                              : null
                          }
                        />
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
      </div>

      <p className="text-[10px] text-muted-foreground">
        <span className="mr-1 inline-block h-px w-4 border-t border-dashed border-foreground/35 align-middle" />
        City average · AQI {cityAqi}
      </p>
    </div>
  );
}
